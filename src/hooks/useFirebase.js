import { useState, useEffect, useRef } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { getInitialFormData } from '../utils/helpers';
import { ACTIONS } from '../constants/config';

// 深度比對：徹底解決因資料順序不同造成的「儲存中...」無限迴圈
const deepEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) return false;
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    return true;
};

export const useFirebaseSync = (formData, dispatch, auth, db, appId) => {
    const [user, setUser] = useState(null);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [authMode, setAuthMode] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('contact-book-auth-mode') || null;
        return null;
    });

    const isRemoteUpdate = useRef(false);
    const saveTimeoutRef = useRef(null);
    const loadedDateRef = useRef(null);
    const lastSyncedDataRef = useRef(null);
    
    // 解決 React 閉包陷阱：永遠使用最新的 formData 進行比對
    const latestFormData = useRef(formData);
    useEffect(() => {
        latestFormData.current = formData;
    }, [formData]);

    // 1. Firebase 登入狀態監聽
    useEffect(() => {
        if (!auth) {
            setIsAuthLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setIsAuthLoading(false);
            if (u && authMode) localStorage.setItem('contact-book-auth-mode', authMode);
        });

        if (authMode === 'local' && !user) {
             signInAnonymously(auth).catch((e) => {
                 if (e.code === 'auth/operation-not-allowed') {
                     setAuthMode(null);
                     localStorage.removeItem('contact-book-auth-mode');
                 }
             });
        }
        return () => unsubscribe();
    }, [auth, authMode, user]);

    // 2. 跨設備讀取與監聽 Firebase 雲端資料 (A設備寫入，B設備會在這裡收到)
    useEffect(() => {
        if (!user || !formData.date || !db || !appId) return;
        setIsLoaded(false);
        loadedDateRef.current = null;
        setSyncStatus('syncing');

        const unsub = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'handover_records', `handover_${formData.date}`), (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                const localDataForCompare = { ...latestFormData.current };
                delete localDataForCompare.lastUpdated;
                const remoteDataForCompare = { ...getInitialFormData(), date: formData.date, ...d };
                delete remoteDataForCompare.lastUpdated;

                // 若遠端資料與本地最新資料不同，代表是「另一個設備」更新的
                if (!deepEqual(localDataForCompare, remoteDataForCompare)) {
                    isRemoteUpdate.current = true;
                    dispatch({ type: ACTIONS.SET_FULL_DATA, payload: remoteDataForCompare });
                    lastSyncedDataRef.current = remoteDataForCompare;
                    setSyncStatus('saved');
                    
                    // 鎖定本地儲存 1 秒，防止互相觸發迴圈
                    setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
                } else {
                    lastSyncedDataRef.current = localDataForCompare;
                    // 資料相同但遠端時間較新，同步最後更新時間
                    if (d.lastUpdated && d.lastUpdated !== latestFormData.current.lastUpdated) {
                        dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name: 'lastUpdated', value: d.lastUpdated } });
                    }
                }
            } else {
                 const defaultData = { ...getInitialFormData(), date: formData.date };
                 delete defaultData.lastUpdated;
                 lastSyncedDataRef.current = defaultData;
            }
            loadedDateRef.current = formData.date;
            setIsLoaded(true);
            if (syncStatus === 'syncing') setSyncStatus('saved');
        }, (err) => { console.error(err); setSyncStatus('error'); });

        return () => unsub();
    }, [user, formData.date, dispatch, db, appId]); 

    // 3. 本地寫入資料到 Firebase 雲端
    useEffect(() => {
        if (loadedDateRef.current !== formData.date) return;
        if (isRemoteUpdate.current || !user || !db || !isLoaded || !appId) return;

        const localDataForCompare = { ...formData };
        delete localDataForCompare.lastUpdated;
        
        // 如果資料沒有實質改變，就不觸發存檔
        if (deepEqual(localDataForCompare, lastSyncedDataRef.current)) return;

        setSyncStatus('saving');
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const nowIso = new Date().toISOString();
                // 存檔前先立刻更新本地時間，避免延遲
                dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name: 'lastUpdated', value: nowIso } });
                
                await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'handover_records', `handover_${formData.date}`), { ...formData, lastUpdated: nowIso });
                lastSyncedDataRef.current = localDataForCompare;
                setSyncStatus('saved');
            } catch (e) { setSyncStatus('error'); }
        }, 1000); // 增加緩衝時間至 1 秒
    }, [formData, user, isLoaded, db, appId]);

    return { user, syncStatus, isLoaded, isAuthLoading, authMode, setAuthMode };
};

export const useRecordedDates = (user, db, appId) => {
    const [recordedDates, setRecordedDates] = useState([]);

    useEffect(() => {
        if (!user || !db || !appId) return;
        const q = collection(db, 'artifacts', appId, 'users', user.uid, 'handover_records');

        // 原生監聽：當 A 設備匯入 13 筆資料，B 設備會在這裡立刻收到 Firebase 的推播
        const unsub = onSnapshot(q, (snap) => {
            const dates = [];
            snap.forEach(doc => {
                const d = doc.data().date;
                if (d) dates.push(d);
            });
            setRecordedDates(dates);
        }, (err) => console.error(err));
        
        return () => unsub();
    }, [user, db, appId]);

    return recordedDates;
};