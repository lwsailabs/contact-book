import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, Moon, Utensils, School, Save, FileText, 
  Cloud, Loader2, Wifi, AlertCircle, HeartPlus, Smile, 
  PawPrint, Sun, Lock, Unlock, CalendarDays, Users, User, Baby, X
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, doc, setDoc, getDocs, collection, writeBatch, deleteDoc } from 'firebase/firestore';

// --- 模組化匯入 ---
import { ACTIONS } from './constants/config';
import { getInitialFormData, formatRocDate, getDateStatus } from './utils/helpers';
import { generateReportText } from './utils/reportGenerator';

import { useWeather } from './hooks/useWeather';
import { useFirebaseSync, useRecordedDates } from './hooks/useFirebase'; 
import { useContactBookForm } from './hooks/useContactBookForm';

import { FormSkeleton, Toast } from './components/common/UI';
import { ConfirmModal, ErrorModal, HistoryModal } from './components/common/Modals';
import { LoginScreen } from './components/auth/LoginScreen';

import { BasicSection } from './components/sections/BasicSection';
import { SchoolSection } from './components/sections/SchoolSection';
import { ActivitySection } from './components/sections/ActivitySection';
import { DiningSection } from './components/sections/DiningSection';
import { SleepSection } from './components/sections/SleepSection';
import { PhysiologySection } from './components/sections/PhysiologySection';
import { HealthSection } from './components/sections/HealthSection';
import { NotesSection } from './components/sections/NotesSection';
import { FileSection } from './components/sections/FileSection';
// ---------------------------------

// --- Global Initialization & Config ---
const myFirebaseConfig = {
  apiKey: "AIzaSyBIakebs6orkgvGfMImFKC9fJGZ1eeRVnA",
  authDomain: "contact-book-5a035.firebaseapp.com",
  projectId: "contact-book-5a035",
  storageBucket: "contact-book-5a035.firebasestorage.app",
  messagingSenderId: "861889746646",
  appId: "1:861889746646:web:4c5b659164731068429b77"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : myFirebaseConfig;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-contact-book';

let app, auth, db;
if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "請將這裡替換為您的 apiKey") {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, { localCache: persistentLocalCache() });
}

const FAMILY_ACCOUNT = { email: 'family@contactbook.com' };

// --- Local Hooks ---
const useToast = () => {
    const [toast, setToast] = useState(null);
    const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);
    return { toast, showToast, setToast };
};

const App = () => {
  const { toast, showToast, setToast } = useToast();
  const { formData, dispatch, handleChange, handleTimeReset, handleJumpToToday, listOps, handlers, dateInfo } = useContactBookForm();
  
  const { user, syncStatus, isLoaded, isAuthLoading, authMode, setAuthMode } = useFirebaseSync(formData, dispatch, auth, db, appId);
  const recordedDates = useRecordedDates(user, db, appId);
  
  const [copySuccess, setCopySuccess] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const [bulkImportConfirm, setBulkImportConfirm] = useState(null);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [isBatchImageExporting, setIsBatchImageExporting] = useState(false);
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('contact-book-theme');
          return saved === 'dark';
      }
      return false;
  });
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const isLocked = formData.isLocked || false;

  useEffect(() => { 
      const root = document.documentElement;
      if (isDarkMode) {
          root.classList.add('dark');
          localStorage.setItem('contact-book-theme', 'dark');
      } else {
          root.classList.remove('dark');
          localStorage.setItem('contact-book-theme', 'light');
      }
  }, [isDarkMode]);

  const handleLoginFamily = async (password) => {
      if (!auth) {
          setLoginError('無法連接認證伺服器');
          return;
      }
      setIsAuthenticating(true);
      setLoginError('');
      try {
          await signInWithEmailAndPassword(auth, FAMILY_ACCOUNT.email, password);
          setAuthMode('family');
          showToast('已登入家庭同步模式', 'success');
      } catch (error) {
          setLoginError('密碼錯誤或尚未啟用該帳號，請檢查 Firebase 設定');
      } finally {
          setIsAuthenticating(false);
      }
  };

  const handleLoginLocal = async () => {
      if (!auth) return;
      setIsAuthenticating(true);
      try {
          await signInAnonymously(auth);
          setAuthMode('local');
          showToast('已進入單機模式', 'info');
      } catch (error) {
          setLoginError('進入單機模式失敗');
      } finally {
          setIsAuthenticating(false);
      }
  };

  const handleLogout = async () => {
      setConfirmModal({
          title: '確認登出',
          content: '確定要登出並切換模式嗎？',
          confirmText: '登出',
          onConfirm: async () => {
              if (auth) await signOut(auth);
              localStorage.setItem('contact-book-auth-mode', '');
              setAuthMode(null);
              setConfirmModal(null);
              dispatch({ type: ACTIONS.SET_FULL_DATA, payload: getInitialFormData() });
          },
          onCancel: () => setConfirmModal(null)
      });
  };
  
  const scrollToElement = useCallback((id, retries = 5) => {
      const attemptScroll = (currentRetries) => {
          const el = document.getElementById(id);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2');
              setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2'), 1500);
          } else if (currentRetries > 0) {
              setTimeout(() => attemptScroll(currentRetries - 1), 100);
          }
      };
      attemptScroll(retries);
  }, []);

  const handleScrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);
  const fetchWeather = useWeather(formData.date, dispatch, showToast);
  const generatedText = useMemo(() => generateReportText(formData, dateInfo), [formData, dateInfo]);

  const handleCopy = () => {
      if (!generatedText) return;
      const textArea = document.createElement("textarea");
      textArea.value = generatedText;
      document.body.appendChild(textArea);
      textArea.select();
      try {
          document.execCommand('copy');
          setCopySuccess(true);
          showToast('複製成功', 'success');
          setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
          showToast('複製失敗', 'error');
      }
      document.body.removeChild(textArea);
  };

  const getRocFileNameDate = (dateStr) => {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      return `${parseInt(y) - 1911}-${m}-${d}`;
  };

  const handleJsonExport = () => {
      const blob = new Blob([JSON.stringify(formData, null, 2)], { type: "application/json" });
      const link = document.createElement('a'); 
      link.href = URL.createObjectURL(blob); 
      link.download = `Contact_backup_${getRocFileNameDate(formData.date)}.json`; 
      document.body.appendChild(link); 
      link.click(); 
      document.body.removeChild(link); 
      showToast('匯出成功', 'success');
  };
  
  const processImport = (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const data = JSON.parse(ev.target.result);
              const doImport = () => {
                  setConfirmModal(null);
                  if (db && user) {
                      setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'handover_records', `handover_${data.date}`), { ...data, lastUpdated: new Date().toISOString() })
                          .then(() => showToast('資料匯入成功且已同步', 'success'))
                          .catch(() => showToast('同步失敗', 'error'));
                  }
                  dispatch({ type: ACTIONS.SET_FULL_DATA, payload: data });
              };
              setConfirmModal({ title: '確認匯入', content: `您確定要匯入 ${data.date} 的資料嗎？`, onConfirm: doImport, onCancel: () => setConfirmModal(null) });
          } catch (err) { 
              setErrorModal({ content: '解析 JSON 失敗' }); 
          }
      };
      reader.readAsText(file);
  };
  
  const handleClearToday = () => {
      setConfirmModal({
          title: '確認刪除單日資料',
          content: `確定要刪除 ${formData.date} 的所有資料嗎？`,
          confirmText: "確認刪除",
          onConfirm: () => {
              setConfirmModal(null);
              dispatch({ type: ACTIONS.SET_FULL_DATA, payload: { ...getInitialFormData(), date: formData.date } });
              if (db && user) {
                  deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'handover_records', `handover_${formData.date}`))
                      .then(() => showToast('已刪除雲端資料', 'success'));
              }
          },
          onCancel: () => setConfirmModal(null)
      });
  };

  const handleClearAllData = () => {
      setConfirmModal({
          title: '⚠️ 警告：刪除所有資料',
          content: `確定要徹底清空雲端上所有的備份資料嗎？此動作無法復原！`,
          confirmText: "確認全部刪除",
          onConfirm: async () => {
              setConfirmModal(null);
              if (db && user) {
                  const snap = await getDocs(collection(db, 'artifacts', appId, 'users', user.uid, 'handover_records'));
                  const batch = writeBatch(db);
                  snap.forEach(d => batch.delete(d.ref));
                  await batch.commit();
                  showToast('已清空所有歷史資料', 'success');
              }
          },
          onCancel: () => setConfirmModal(null)
      });
  };

  const handleBulkExport = async () => {
      setIsBulkExporting(true);
      try {
          const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'users', user.uid, 'handover_records'));
          const allData = querySnapshot.docs.map(doc => doc.data());
          const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
          const link = document.createElement('a'); 
          link.href = URL.createObjectURL(blob); 
          link.download = `Full_Backup_${getRocFileNameDate(new Date().toISOString().slice(0,10))}.json`; 
          link.click();
          showToast(`成功匯出 ${allData.length} 筆資料`, 'success');
      } catch (error) { showToast("匯出失敗", 'error'); }
      setIsBulkExporting(false);
  };

  const handleImageExport = async () => {
      showToast('正在產生圖片...', 'info');
      // 本機環境下 html2canvas 由 index.html 載入
      if (!window.html2canvas) {
          showToast('請確保本機已安裝 html2canvas', 'info');
          return;
      }
      try {
          const element = document.getElementById('capture-text');
          if (!element) return;
          const canvas = await window.html2canvas(element, { 
              scale: 2, 
              backgroundColor: '#0f172a',
              windowWidth: 800
          });
          const link = document.createElement('a');
          link.download = `ContactBook_${getRocFileNameDate(formData.date)}.jpg`;
          link.href = canvas.toDataURL('image/jpeg', 0.9);
          link.click();
          showToast('圖片匯出成功', 'success');
      } catch (error) {
          console.error(error);
          showToast('圖片匯出失敗', 'error');
      }
  };

  const handleBulkImageExport = async () => {
      showToast('批次圖片功能開發中', 'info');
  };

  const processBulkImport = (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { 
          try { 
              const data = JSON.parse(ev.target.result); 
              if (Array.isArray(data)) setBulkImportConfirm({ count: data.length, data }); 
          } catch (e) { setErrorModal({ content: '檔案解析失敗' }); } 
      };
      reader.readAsText(file);
  };

  const executeBulkImport = (data) => {
      setBulkImportConfirm(null);
      if (db && user) {
          const batch = writeBatch(db);
          data.forEach(item => { 
              if (item.date) batch.set(doc(db, 'artifacts', appId, 'users', user.uid, 'handover_records', `handover_${item.date}`), item); 
          });
          batch.commit().then(() => showToast(`成功匯入 ${data.length} 筆資料`, 'success'));
      }
  };

  const navItems = [
    {id:'basic',l:'基本',i:Calendar, colorClass: 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'},
    {id:'school',l:'學校',i:School, colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/50'},
    {id:'sleep',l:'睡眠',i:Moon, colorClass: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/50'},
    {id:'food',l:'飲食',i:Utensils, colorClass: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/50'},
    {id:'physiology',l:'生理',i:Smile, colorClass: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/50'},
    {id:'health',l:'健康',i:HeartPlus, colorClass: 'text-teal-600 bg-teal-50 border-teal-200 hover:bg-teal-100 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-900/50'},
    {id:'activity',l:'活動',i:PawPrint, colorClass: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100 dark:bg-fuchsia-900/30 dark:border-fuchsia-800 dark:text-fuchsia-400 dark:hover:bg-fuchsia-900/50'},
    {id:'notes',l:'備註',i:FileText, colorClass: 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'},
    {id:'files',l:'檔案',i:Save, colorClass: 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}
  ];

  if (isAuthLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;

  if (!authMode || !user) {
      return <LoginScreen onLoginFamily={handleLoginFamily} onLoginLocal={handleLoginLocal} isAuthenticating={isAuthenticating} loginError={loginError} />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans text-gray-700 dark:text-gray-200 transition-colors duration-200">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white flex flex-col gap-2">
             <div className="flex justify-between items-start w-full">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-3 whitespace-nowrap"><Baby className="w-8 h-8 shrink-0"/> 親子成長聯絡簿</h1>
                    <div className="mt-2 space-y-1 w-full text-xs opacity-80">
                        <p>雲端代碼: {appId.slice(0,5)}***{appId.slice(-3)}</p>
                        {formData.lastUpdated && <p>最後更新: {new Date(formData.lastUpdated).toLocaleString()}</p>}
                    </div>
                </div>
             </div>
             <div className="flex justify-between items-end mt-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${syncStatus==='saved'?'bg-green-500/20 border-green-400':'bg-white/20'}`}>
                        {syncStatus==='saving'?<Loader2 className="w-3 h-3 animate-spin"/>:<Cloud className="w-3 h-3"/>}
                        <span>{syncStatus==='saving'?'儲存中':syncStatus==='saved'?'已同步':'準備中'}</span>
                    </div>
                    <button onClick={handleLogout} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border bg-white/10 hover:bg-white/20 border-white/20 transition-colors">切換模式</button>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => setShowHistoryModal(true)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20"><CalendarDays className="w-5 h-5"/></button>
                   <button onClick={() => dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name: 'isLocked', value: !isLocked } })} className={`p-2 rounded-lg ${isLocked ? 'bg-red-500/80' : 'bg-white/10'}`}>{isLocked ? <Lock className="w-5 h-5"/> : <Unlock className="w-5 h-5"/>}</button>
                   <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">{isDarkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}</button>
                </div>
             </div>
        </div>
        
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex overflow-x-auto p-2 gap-2 hide-scrollbar">
            {navItems.map(n => (
                <button key={n.id} onClick={() => { window.dispatchEvent(new CustomEvent('expandSection', { detail: n.id })); setTimeout(() => scrollToElement(n.id), 50); }} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap ${n.colorClass}`}><n.i className="w-3 h-3"/> {n.l}</button>
            ))}
        </div>

        <div className="p-6 space-y-8 transition-all duration-300">
            {!formData.date ? ( <FormSkeleton /> ) : (
                <div className="space-y-8">
                    <BasicSection formData={formData} handleChange={handleChange} dateInfo={dateInfo} handleJumpToToday={handleJumpToToday} handleAutoWeather={fetchWeather} handleTimeReset={handleTimeReset} listOps={listOps} onScrollTop={handleScrollToTop} handlers={handlers} isLocked={isLocked} recordedDates={recordedDates} />
                    <SchoolSection formData={formData} handleChange={handleChange} handleTimeReset={handleTimeReset} listOps={listOps} onScrollTop={handleScrollToTop} isLocked={isLocked}/>
                    <SleepSection formData={formData} handleChange={handleChange} handleTimeReset={handleTimeReset} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} onScrollTop={handleScrollToTop} handlers={handlers} isLocked={isLocked}/>
                    <DiningSection formData={formData} handleChange={handleChange} listOps={listOps} onScrollTop={handleScrollToTop} handlers={handlers} isLocked={isLocked}/>
                    <PhysiologySection formData={formData} handleChange={handleChange} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} onScrollTop={handleScrollToTop} handlers={handlers} isLocked={isLocked}/>
                    <HealthSection formData={formData} handleChange={handleChange} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} onScrollTop={handleScrollToTop} handlers={handlers} isLocked={isLocked}/>
                    <ActivitySection formData={formData} handleChange={handleChange} handleTimeReset={handleTimeReset} listOps={listOps} onScrollTop={handleScrollToTop} isLocked={isLocked}/>
                    <NotesSection formData={formData} handleChange={handleChange} onScrollTop={handleScrollToTop} generatedText={generatedText} onCopy={handleCopy} copySuccess={copySuccess} isLocked={isLocked} />
                    <FileSection onExportJSON={handleJsonExport} onImportJSON={(e) => processImport(e.target.files[0])} onClearToday={handleClearToday} onClearAll={handleClearAllData} isBulkExporting={isBulkExporting} isBatchImageExporting={isBatchImageExporting} processBulkImport={processBulkImport} onBulkExportJSON={handleBulkExport} onExportImage={handleImageExport} onBulkExportImage={handleBulkImageExport} />
                </div>
            )}
        </div>
      </div>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmModal && <ConfirmModal {...confirmModal} />}
      {errorModal && <ErrorModal content={errorModal.content} onClose={() => setErrorModal(null)} />}
      {showHistoryModal && <HistoryModal recordedDates={recordedDates} currentDate={formData.date} onSelectDate={(date) => { handleChange({ target: { name: 'date', value: date } }); setShowHistoryModal(false); }} onClose={() => setShowHistoryModal(false)} />}
      {bulkImportConfirm && (
         <ConfirmModal title="確認批次匯入" content={`系統偵測到 ${bulkImportConfirm.count} 筆備份資料，是否匯入？`} confirmText="全部匯入" onConfirm={() => executeBulkImport(bulkImportConfirm.data)} onCancel={() => setBulkImportConfirm(null)} />
      )}
    </div>
  );
};

export default App;
