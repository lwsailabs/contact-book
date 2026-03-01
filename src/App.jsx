import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, Moon, Utensils, School, Save, FileText, 
  Cloud, Loader2, Wifi, AlertCircle, HeartPlus, Smile, 
  PawPrint, Sun, Lock, Unlock, CalendarDays, Users, User, Baby
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithEmailAndPassword, signOut } from 'firebase/auth';
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
} else {
  console.warn("⚠️ Firebase 尚未設定完整，請確認 firebaseConfig 資料是否正確填寫。");
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
  
  // 呼叫 Firebase 同步 (從 Hook 取得狀態)
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
          return localStorage.getItem('contact-book-theme') === 'dark';
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

  // --- 登入相關函式 ---
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
          localStorage.setItem('contact-book-auth-mode', 'family');
          showToast('已登入家庭同步模式', 'success');
      } catch (error) {
          if (error.code === 'auth/operation-not-allowed') {
              setLoginError('⚠️ 尚未啟用「電子郵件/密碼」登入！請至 Firebase 後台的 Authentication 啟用此功能。');
          } else {
              setLoginError('密碼錯誤或尚未啟用該帳號，請檢查 Firebase 設定');
          }
      } finally {
          setIsAuthenticating(false);
      }
  };

  const handleLoginLocal = async () => {
      if (!auth) return;
      setIsAuthenticating(true);
      setLoginError('');
      try {
          await signInAnonymously(auth);
          setAuthMode('local');
          localStorage.setItem('contact-book-auth-mode', 'local');
          showToast('已進入單機模式', 'info');
      } catch (error) {
          if (error.code === 'auth/operation-not-allowed') {
              setLoginError('⚠️ 尚未啟用「匿名登入」！請至 Firebase 後台的 Authentication 啟用 Anonymous 功能。');
          } else {
              setLoginError('進入單機模式失敗');
          }
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
              localStorage.removeItem('contact-book-auth-mode');
              setAuthMode(null);
              setConfirmModal(null);
              dispatch({ type: ACTIONS.SET_FULL_DATA, payload: getInitialFormData() });
          },
          onCancel: () => setConfirmModal(null)
      });
  };
  
  // --- 互動與輔助函式 ---
  const scrollToElement = useCallback((id, retries = 5) => {
      const attemptScroll = (currentRetries) => {
          const el = document.getElementById(id);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'dark:ring-offset-gray-800', 'transition-all', 'duration-500');
              setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'dark:ring-offset-gray-800'), 1500);
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
              const rawText = ev.target.result;
              if (!rawText || rawText.trim() === '') {
                  setErrorModal({ content: '上傳的檔案是空的！' });
                  return;
              }
              const data = JSON.parse(rawText);
              
              if (Array.isArray(data)) {
                  setErrorModal({ content: '您上傳的是「批次備份」檔案 (包含多天資料)，請使用下方的「匯入所有資料」按鈕進行匯入。' });
                  return;
              }
              if (!data.date) {
                  setErrorModal({ content: '檔案缺少日期欄位，無法辨識為聯絡簿資料！' });
                  return;
              }

              const initial = getInitialFormData();
              const safeData = { ...initial };
              Object.keys(initial).forEach(key => {
                  if (data[key] !== undefined && data[key] !== null) {
                      safeData[key] = data[key];
                  }
              });

              const doImport = () => {
                  setConfirmModal(null);
                  if (db && user) {
                      showToast('正在寫入雲端...', 'info');
                      setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'handover_records', `handover_${safeData.date}`), { ...safeData, lastUpdated: new Date().toISOString() })
                          .then(() => showToast('資料匯入成功，並已同步至雲端', 'success'))
                          .catch(e => {
                              console.error("Firebase sync error on import", e); 
                              showToast('寫入雲端失敗，請檢查網路或網域設定', 'error');
                          });
                  } else {
                      showToast('已匯入至本機 (未連線雲端，重整後會消失)', 'info');
                  }
                  dispatch({ type: ACTIONS.SET_FULL_DATA, payload: safeData });
              };

              if (safeData.date !== formData.date) {
                   setConfirmModal({ title: '切換日期並匯入', content: `匯入檔案日期 (${safeData.date}) 與目前日期 (${formData.date}) 不同。是否切換至該日期並匯入？`, confirmText: "切換並匯入", onConfirm: doImport, onCancel: () => setConfirmModal(null) }); return;
              }
              setConfirmModal({ title: '確認匯入資料', content: `您確定要匯入 ${safeData.date} 的備份資料嗎？這將覆蓋目前的表單與雲端內容。`, onConfirm: doImport, onCancel: () => setConfirmModal(null) });
          } catch (err) { 
              console.error("Parse Error:", err);
              setErrorModal({ content: '解析 JSON 檔案失敗，請確認檔案是否損毀或格式正確。' }); 
          }
      };
      reader.readAsText(file);
  };
  
  const handleClearToday = () => {
      setConfirmModal({
          title: '確認刪除單日資料',
          content: `您確定要刪除 ${formData.date} 的所有資料嗎？此動作將覆蓋目前的表單與雲端內容，且無法復原。`,
          confirmText: "確認刪除",
          onConfirm: () => {
              setConfirmModal(null);
              const emptyData = { ...getInitialFormData(), date: formData.date };
              dispatch({ type: ACTIONS.SET_FULL_DATA, payload: emptyData });
              
              if (db && user) {
                  showToast('已清空畫面，正在同步刪除雲端資料...', 'info');
                  deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'handover_records', `handover_${formData.date}`))
                      .then(() => showToast('已徹底刪除雲端資料', 'success'))
                      .catch(e => {
                          console.error("Firebase sync error on clear", e);
                          showToast('雲端刪除失敗，請檢查網路或權限設定', 'error');
                      });
              } else {
                  showToast('已刪除單日本機資料', 'success');
              }
          },
          onCancel: () => setConfirmModal(null)
      });
  };

  const handleClearAllData = () => {
      setConfirmModal({
          title: '⚠️ 警告：刪除所有資料',
          content: `您確定要刪除「所有」的歷史紀錄嗎？此動作將徹底清空雲端上所有的備份資料，且永遠無法復原！強烈建議您先執行「匯出所有資料」進行備份。`,
          confirmText: "確認全部刪除",
          onConfirm: () => {
              setConfirmModal(null);
              const emptyData = { ...getInitialFormData(), date: formData.date };
              dispatch({ type: ACTIONS.SET_FULL_DATA, payload: emptyData });
              
              if (db && user) {
                  showToast('正在清空雲端資料...', 'info');
                  const q = collection(db, 'artifacts', appId, 'users', user.uid, 'handover_records');
                  getDocs(q).then(snap => {
                      const batch = writeBatch(db);
                      snap.forEach(docSnap => {
                          batch.delete(docSnap.ref);
                      });
                      return batch.commit();
                  }).then(() => {
                      showToast('已清空所有歷史資料', 'success');
                  }).catch(e => {
                      console.error("Firebase sync error on clear all", e);
                      showToast('刪除失敗，請檢查網路或稍後再試', 'error');
                  });
              } else {
                  showToast('已清空所有本機資料', 'success');
              }
          },
          onCancel: () => setConfirmModal(null)
      });
  };

  const handleBulkExport = async () => {
      setIsBulkExporting(true);
      try {
          let allData = [];
          if (db && user) {
              const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'users', user.uid, 'handover_records'));
              allData = querySnapshot.docs.map(doc => doc.data());
          }
          const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
          const link = document.createElement('a'); 
          link.href = URL.createObjectURL(blob); 
          link.download = `Contact_FullBackup_${getRocFileNameDate(new Date().toISOString().slice(0,10))}.json`; 
          document.body.appendChild(link); 
          link.click(); 
          document.body.removeChild(link); 
          showToast(`成功匯出 ${allData.length} 筆資料`, 'success');
      } catch (error) { 
          console.error(error); 
          showToast("匯出失敗，請檢查網路", 'error'); 
      }
      setIsBulkExporting(false);
  };

  const handleImageExport = async () => {
      showToast('正在產生圖片，請稍候...', 'info');
      try {
          if (!window.html2canvas) {
              await new Promise((resolve, reject) => {
                  const script = document.createElement('script');
                  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                  script.onload = resolve;
                  script.onerror = reject;
                  document.head.appendChild(script);
              });
          }
          const element = document.getElementById('capture-text');
          if (!element) {
              showToast('找不到預覽區塊', 'error');
              return;
          }
          const canvas = await window.html2canvas(element, { 
              scale: 2, 
              backgroundColor: '#0f172a',
              windowWidth: 800,
              onclone: (clonedDoc) => {
                  const clonedElement = clonedDoc.getElementById('capture-text');
                  if (clonedElement) {
                      clonedElement.style.width = '800px';
                      clonedElement.style.height = 'auto';
                      clonedElement.style.overflow = 'visible';
                  }
                  const textContainer = clonedDoc.getElementById('preview-text-container');
                  if (textContainer) {
                      textContainer.style.fontSize = '30px';
                      textContainer.style.lineHeight = '52px';
                      textContainer.style.padding = '36px';
                      textContainer.style.fontWeight = 'bold';
                  }
              }
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
      setIsBatchImageExporting(true);
      showToast('準備批次匯出圖片，這可能需要一點時間...', 'info');
      try {
          if (!window.html2canvas) {
              await new Promise((r, reject) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; s.onload = r; s.onerror = reject; document.head.appendChild(s); });
          }
          if (!window.JSZip) {
              await new Promise((r, reject) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; s.onload = r; s.onerror = reject; document.head.appendChild(s); });
          }

          let allData = [];
          if (db && user) {
              const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'users', user.uid, 'handover_records'));
              allData = querySnapshot.docs.map(doc => doc.data());
          } else {
              allData = [formData]; 
          }

          if (allData.length === 0) {
              showToast('沒有資料可匯出', 'info');
              setIsBatchImageExporting(false);
              return;
          }

          const zip = new window.JSZip();
          const imgFolder = zip.folder("ContactBook_Images");

          const originalCaptureText = document.getElementById('capture-text');
          if (!originalCaptureText) throw new Error("找不到預覽區塊");

          const hiddenContainer = document.createElement('div');
          hiddenContainer.style.position = 'fixed';
          hiddenContainer.style.left = '-9999px';
          hiddenContainer.style.top = '-9999px';
          hiddenContainer.style.width = '800px'; 
          document.body.appendChild(hiddenContainer);

          for (let i = 0; i < allData.length; i++) {
              const data = allData[i];
              if (!data.date) continue;
              
              const [y, m, d] = data.date.split('-');
              const mockDateInfo = getDateStatus(parseInt(y), parseInt(m), parseInt(d));
              const text = generateReportText(data, mockDateInfo);
              
              const clonedNode = originalCaptureText.cloneNode(true);
              clonedNode.style.width = '800px';
              clonedNode.style.height = 'auto';
              clonedNode.style.overflow = 'visible';
              
              const preElement = clonedNode.querySelector('#preview-text-container');
              if (preElement) {
                  preElement.innerHTML = '';
                  preElement.style.fontSize = '30px';
                  preElement.style.lineHeight = '52px';
                  preElement.style.padding = '36px';
                  preElement.style.fontWeight = 'bold';
                  
                  if (!text) {
                      preElement.innerText = '尚無內容';
                  } else {
                      text.split('\n').forEach(line => {
                          const div = document.createElement('div');
                          div.style.minHeight = '1.5em';
                          div.style.width = '100%';
                          
                          let prefix = '';
                          const headerMatch = line.match(/^([^：\n(]{1,30}：)/);
                          if (headerMatch) {
                              prefix = headerMatch[1];
                          } else {
                              const listMatch = line.match(/^(\s+(?:[-•]\s|\(\d+\)\s)?)/);
                              if (listMatch) prefix = listMatch[1];
                          }
                          
                          if (prefix) {
                              const content = line.substring(prefix.length);
                              div.style.display = 'flex';
                              
                              const span1 = document.createElement('span');
                              span1.style.whiteSpace = 'pre';
                              span1.style.flexShrink = '0';
                              span1.textContent = prefix;
                              
                              const span2 = document.createElement('span');
                              span2.style.wordBreak = 'break-word';
                              span2.style.flex = '1';
                              span2.style.whiteSpace = 'pre-wrap';
                              span2.textContent = content;
                              
                              div.appendChild(span1);
                              div.appendChild(span2);
                          } else {
                              div.style.wordBreak = 'break-word';
                              div.style.whiteSpace = 'pre-wrap';
                              div.textContent = line;
                          }
                          preElement.appendChild(div);
                      });
                  }
              }

              hiddenContainer.innerHTML = '';
              hiddenContainer.appendChild(clonedNode);

              const canvas = await window.html2canvas(clonedNode, { 
                  scale: 2, 
                  backgroundColor: '#0f172a',
                  windowWidth: 800 
              });
              const imgData = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
              imgFolder.file(`ContactBook_${getRocFileNameDate(data.date)}.jpg`, imgData, {base64: true});
              
              if (i % 5 === 0) showToast(`正在產生圖片... ${i+1} / ${allData.length}`, 'info');
          }

          document.body.removeChild(hiddenContainer);
          showToast('正在打包 ZIP 檔案...', 'info');

          const content = await zip.generateAsync({type:"blob"});
          const link = document.createElement('a');
          link.href = URL.createObjectURL(content);
          link.download = `ContactBook_Images_${getRocFileNameDate(new Date().toISOString().slice(0,10))}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          showToast(`成功匯出 ${allData.length} 張圖片！`, 'success');
      } catch (error) {
          console.error(error);
          showToast("圖片批次匯出失敗，請稍後再試", 'error');
      }
      setIsBatchImageExporting(false);
  };

  const processBulkImport = (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { 
          try { 
              const rawText = ev.target.result;
              if (!rawText || rawText.trim() === '') {
                   setErrorModal({ content: '上傳的檔案是空的！' });
                   return;
              }
              const data = JSON.parse(rawText); 
              
              if (!Array.isArray(data)) {
                   if (data.date) {
                       setErrorModal({ content: '您上傳的是「單日備份」檔案，請使用上方的「單日資料 -> 匯入 (JSON)」按鈕進行匯入。' });
                   } else {
                       setErrorModal({ content: '格式錯誤，無法辨識資料。' });
                   }
                   return;
              }
              
              const safeBulkData = data.map(item => {
                  const initial = getInitialFormData();
                  const safeItem = { ...initial };
                  Object.keys(initial).forEach(key => {
                      if (item[key] !== undefined && item[key] !== null) {
                          safeItem[key] = item[key];
                      }
                  });
                  return safeItem;
              });

              setBulkImportConfirm({ count: safeBulkData.length, data: safeBulkData }); 
          } catch (e) { 
              console.error("Bulk Parse Error:", e);
              setErrorModal({ content: '檔案解析失敗。請確認您選擇的是正確的 JSON 批次備份檔。' }); 
          } 
      };
      reader.readAsText(file);
  };

  const executeBulkImport = (data) => {
      setBulkImportConfirm(null);

      if (db && user) {
          const batch = writeBatch(db); let count = 0;
          data.forEach(item => { 
              if (item.date) { 
                  const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'handover_records', `handover_${item.date}`); 
                  batch.set(docRef, item); 
                  count++; 
              } 
          });
          showToast(`正在寫入 ${count} 筆資料...`, 'info');
          batch.commit()
              .then(() => showToast(`成功匯入 ${count} 筆資料`, 'success'))
              .catch(e => { console.error(e); showToast("匯入失敗，請稍後再試", 'error'); });
      } else {
          showToast("未連線至雲端，無法批次寫入", 'error');
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

  if (isAuthLoading) {
      return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
  }

  if (!authMode || !user) {
      return <LoginScreen onLoginFamily={handleLoginFamily} onLoginLocal={handleLoginLocal} isAuthenticating={isAuthenticating} loginError={loginError} />;
  }
  
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans text-gray-700 dark:text-gray-200 transition-colors duration-200`}>
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white flex flex-col gap-2">
             <div className="flex justify-between items-start w-full">
                 <div className="flex-1">
                     <h1 className="text-2xl font-bold flex items-center gap-3 whitespace-nowrap"><Baby className="w-8 h-8 shrink-0"/> 親子成長聯絡簿</h1>
                     <div className="mt-2 space-y-1 w-full text-xs opacity-80">
                         <p>雲端代碼: {appId.slice(0,5)}***{appId.slice(-3)}</p>
                         {formData.lastUpdated && <p>最後更新: {new Date(formData.lastUpdated).toLocaleString('zh-TW', { hour12: false })}</p>}
                     </div>
                 </div>
             </div>
             <div className="flex justify-between items-end mt-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border w-fit ${syncStatus==='saved'?'bg-green-500/20 border-green-400':'bg-white/20'}`}>
                        {syncStatus==='saving'?<Loader2 className="w-3 h-3 animate-spin"/>:<Cloud className="w-3 h-3"/>}
                        <span>{syncStatus==='saving'?'儲存中':syncStatus==='saved'?'已同步':'準備中'}</span>
                    </div>
                    <button onClick={handleLogout} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border bg-white/10 hover:bg-white/20 border-white/20 transition-colors">
                        {authMode === 'family' ? <><Users className="w-3 h-3"/> 家庭同步</> : <><User className="w-3 h-3"/> 單機模式</>}
                        <span className="mx-1 opacity-50">|</span> 切換
                    </button>
                </div>
                <div className="flex items-center gap-2">
                   <button type="button" onClick={() => setShowHistoryModal(true)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white" title="歷史紀錄總覽"><CalendarDays className="w-5 h-5"/></button>
                   <button type="button" onClick={() => dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name: 'isLocked', value: !isLocked } })} className={`p-2 rounded-lg transition-colors text-white ${isLocked ? 'bg-red-500/80 hover:bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}>{isLocked ? <Lock className="w-5 h-5"/> : <Unlock className="w-5 h-5"/>}</button>
                   <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white" title="切換深淺色">{isDarkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}</button>
                </div>
             </div>
        </div>
        
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex overflow-x-auto p-2 gap-2 hide-scrollbar transition-colors duration-200">
            {navItems.map(n => (
                <button type="button" key={n.id} onClick={() => {
                    window.dispatchEvent(new CustomEvent('expandSection', { detail: n.id }));
                    setTimeout(() => scrollToElement(n.id), 50);
                }} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${n.colorClass}`}><n.i className="w-3 h-3"/> {n.l}</button>
            ))}
        </div>

        <div className={`p-6 space-y-8 transition-all duration-300`}>
            {!formData.date ? ( <FormSkeleton /> ) : (
                <div className="space-y-8">
                    <BasicSection formData={formData} handleChange={handleChange} dateInfo={dateInfo} handleJumpToToday={handleJumpToToday} handleAutoWeather={fetchWeather} handleTimeReset={handleTimeReset} listOps={listOps} onScrollTop={handleScrollToTop} handlers={handlers} isLocked={isLocked} recordedDates={recordedDates} />
                    <SchoolSection formData={formData} handleChange={handleChange} handleTimeReset={handleTimeReset} listOps={listOps} onScrollTop={handleScrollToTop} handlers={handlers} isLocked={isLocked}/>
                    <SleepSection formData={formData} handleChange={handleChange} handleTimeReset={handleTimeReset} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} onScrollTop={handleScrollToTop} handlers={handlers} isLocked={isLocked}/>
                    <DiningSection formData={formData} handleChange={handleChange} listOps={listOps} onScrollTop={handleScrollToTop} handlers={handlers} isLocked={isLocked}/>
                    <PhysiologySection formData={formData} handleChange={handleChange} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} onScrollTop={handleScrollToTop} handlers={handlers} isLocked={isLocked}/>
                    <HealthSection formData={formData} handleChange={handleChange} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} onScrollTop={handleScrollToTop} handlers={handlers} isLocked={isLocked}/>
                    <ActivitySection formData={formData} handleChange={handleChange} handleTimeReset={handleTimeReset} listOps={listOps} onScrollTop={handleScrollToTop} handlers={handlers} isLocked={isLocked}/>
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
         <ConfirmModal 
            title="確認批次匯入" 
            content={`系統偵測到 ${bulkImportConfirm.count} 筆備份資料。此動作將覆蓋雲端同日期的現有資料。請問是否確認匯入？`} 
            confirmText="全部匯入" 
            onConfirm={() => executeBulkImport(bulkImportConfirm.data)} 
            onCancel={() => setBulkImportConfirm(null)} 
         />
      )}
    </div>
  );
};

export default App;