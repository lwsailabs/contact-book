import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, onSnapshot } from 'firebase/firestore';
import { ACTIONS } from '../constants/config';
import { getInitialFormData } from '../utils/helpers';

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
    const lastSyncedDataRef = useRef(''); 

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

    useEffect(() => {
        if (!user || !formData.date || !db || !appId) return;
        setIsLoaded(false); 
        loadedDateRef.current = null;
        setSyncStatus('syncing');
        
        const unsub = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'handover_records', `handover_${formData.date}`), (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                const localDataForCompare = { ...formData };
                delete localDataForCompare.lastUpdated;
                const remoteDataForCompare = { ...getInitialFormData(), date: formData.date, ...d };
                delete remoteDataForCompare.lastUpdated;

                if (JSON.stringify(localDataForCompare) !== JSON.stringify(remoteDataForCompare)) {
                    isRemoteUpdate.current = true;
                    dispatch({ type: ACTIONS.SET_FULL_DATA, payload: { ...getInitialFormData(), date: formData.date, ...d }});
                    lastSyncedDataRef.current = JSON.stringify(remoteDataForCompare); 
                    setSyncStatus('saved');
                    setTimeout(() => { isRemoteUpdate.current = false; }, 500);
                } else {
                    lastSyncedDataRef.current = JSON.stringify(localDataForCompare); 
                }
            } else {
                 const defaultData = { ...getInitialFormData(), date: formData.date };
                 delete defaultData.lastUpdated;
                 lastSyncedDataRef.current = JSON.stringify(defaultData); 
            }
            loadedDateRef.current = formData.date;
            setIsLoaded(true); 
            if (syncStatus === 'syncing') setSyncStatus('saved');
        }, (err) => { console.error(err); setSyncStatus('error'); });
        return () => unsub();
    }, [user, formData.date, dispatch, db, appId]); 

    useEffect(() => {
        if (loadedDateRef.current !== formData.date) return;
        if (isRemoteUpdate.current || !user || !db || !isLoaded || !appId) return;
        
        const localDataForCompare = { ...formData };
        delete localDataForCompare.lastUpdated;
        if (JSON.stringify(localDataForCompare) === lastSyncedDataRef.current) return;

        setSyncStatus('saving');
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'handover_records', `handover_${formData.date}`), { ...formData, lastUpdated: new Date().toISOString() });
                lastSyncedDataRef.current = JSON.stringify(localDataForCompare); 
                setSyncStatus('saved');
            } catch (e) { setSyncStatus('error'); }
        }, 500);
    }, [formData, user, isLoaded, db, appId]); 

    return { user, syncStatus, isLoaded, isAuthLoading, authMode, setAuthMode };
};

export const useRecordedDates = (user, db, appId) => {
    const [recordedDates, setRecordedDates] = useState([]);
    useEffect(() => {
        if (!user || !db || !appId) return;
        const q = collection(db, 'artifacts', appId, 'users', user.uid, 'handover_records');
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
