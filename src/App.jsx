import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, Moon, Utensils, School, Save, FileText, ClipboardList, 
  PlusCircle, Trash2, Cloud, Check, Loader2, Wifi, Upload, Download, 
  ImageUp, RotateCcw, AlertCircle, Info, X, HeartPlus, Smile,
  Activity, Pill, Syringe, MessageSquare, ArrowUp, Copy, CheckSquare, Baby,
  CloudSun, Thermometer, Database, NotebookPen,
  Frown, Meh, Zap, Coffee, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, DollarSign, PawPrint, Tent, Bike, Sun, Car, Lock, Unlock, CalendarDays, LogIn, Users, User
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { 
  initializeFirestore, persistentLocalCache, 
  doc, setDoc, getDocs, collection, onSnapshot, writeBatch, deleteDoc
} from 'firebase/firestore';

// --- 1. Global Initialization & Config ---
// 👇 準備佈署到 GitHub: 請將下方的 myFirebaseConfig 替換為您在 Firebase 主控台取得的真實設定檔
const myFirebaseConfig = {
  apiKey: "AIzaSyBIakebs6orkgvGfMImFKC9fJGZ1eeRVnA",
  authDomain: "contact-book-5a035.firebaseapp.com",
  projectId: "contact-book-5a035",
  storageBucket: "contact-book-5a035.firebasestorage.app",
  messagingSenderId: "861889746646",
  appId: "1:861889746646:web:4c5b659164731068429b77"
};

// 為了同時相容目前的預覽環境與未來的 GitHub 佈署，加入雙重判斷
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : myFirebaseConfig;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-contact-book'; // 您可以自訂您的 App 識別碼

let app, auth, db;
// 檢查是否有設定有效的 apiKey，避免未設定時導致整個畫面崩潰
if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "請將這裡替換為您的 apiKey") {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache()
  });
} else {
  console.warn("⚠️ Firebase 尚未設定完整，請確認 firebaseConfig 資料是否正確填寫。");
}

// 👨‍👩‍👦 家庭共用帳號設定 (請填入您在 Firebase 後台建立的 Email)
const FAMILY_ACCOUNT = {
  email: 'family@contactbook.com' // 👈 已經幫您修改成正確的信箱囉！
};

// --- CONSTANTS & CONFIGURATIONS ---
const HOLIDAYS_CONFIG = {
    '01-01': '元旦', '02-16': '除夕', '02-17': '春節(初一)', '02-18': '春節(初二)', 
    '02-19': '春節(初三)', '02-20': '春節(初四)', '02-27': '補假', '02-28': '和平紀念日',
    '04-03': '補假', '04-04': '兒童/清明', '04-05': '清明節', '04-06': '補假', 
    '05-01': '勞動節', '06-19': '端午節', '09-25': '中秋節', '10-09': '補假', 
    '10-10': '國慶日', '10-25': '光復節', '10-26': '補假',
};

const MAKE_UP_DAYS = [];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const ACTIONS = {
  SET_FULL_DATA: 'SET_FULL_DATA',
  UPDATE_FIELD: 'UPDATE_FIELD',
  RESET_DATE_TO_TODAY: 'RESET_DATE_TO_TODAY',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  RESET_MEAL: 'RESET_MEAL',
  RESET_ITEM_FIELDS: 'RESET_ITEM_FIELDS',
  DELETE_LINKED_RECORD: 'DELETE_LINKED_RECORD',
  UPDATE_BOWEL_TYPE: 'UPDATE_BOWEL_TYPE',
  TOGGLE_WAKE_UP_BREASTFEEDING: 'TOGGLE_WAKE_UP_BREASTFEEDING',
  TOGGLE_NAP_IS_BREASTFEEDING: 'TOGGLE_NAP_IS_BREASTFEEDING',
  TOGGLE_NAP_IS_NAP: 'TOGGLE_NAP_IS_NAP',
  TOGGLE_BREASTFEEDING_IS_NAP: 'TOGGLE_BREASTFEEDING_IS_NAP',
  TOGGLE_AWAKE_IS_BREASTFEEDING: 'TOGGLE_AWAKE_IS_BREASTFEEDING',
  TOGGLE_BEDTIME_BREASTFEEDING: 'TOGGLE_BEDTIME_BREASTFEEDING'
};

const OPTIONS = {
  WEATHER: ['晴', '舒適', '陰', '雨', '寒冷', '颱風'],
  HANDOVER: ['本日無交接', '爸爸交接給媽媽', '媽媽交接給爸爸', '其它'],
  LOCATIONS: ['爸爸住所', '媽媽住所', '其它'],
  IS_OVERNIGHT: ['是', '否'],
  LEAVE_TYPES: ['放假', '寒假', '暑假', '病假', '事假', '半天', '其它'],
  COMPANIONS: ['爸爸接送', '媽媽接送', '共同接送'],
  APPETITE: ['正常', '普通', '略少', '不佳', '非常棒'],
  WATER: ['正常', '略少', '不佳', '非常棒'],
  BOWEL_TYPES: ['正常', '粒狀/便秘', '稀狀/偏軟', '拉肚子/腸胃炎'],
  HEALTH_CARD: [
    { value: 'card_at_dad', label: '卡片在爸爸這' },
    { value: 'card_at_mom', label: '卡片在媽媽這' },
    { value: 'dad_to_mom', label: '爸爸交給媽媽' },
    { value: 'mom_to_dad', label: '媽媽交給爸爸' }
  ],
  ORAL_TIMES: ['早上', '中午', '晚上'],
  ORAL_TYPES: ['刷牙', '漱口'],
  MOODS: [
    { value: '開心', label: '😃 開心' },
    { value: '穩定', label: '😊 穩定' },
    { value: '哭鬧', label: '😭 哭鬧' },
    { value: '生氣', label: '😡 生氣' },
    { value: '崩潰', label: '😱 崩潰' },
    { value: '害怕', label: '😨 害怕' },
    { value: '焦慮', label: '😰 焦慮' },
    { value: '興奮', label: '😆 興奮' },
    { value: '疲累', label: '😴 疲累' }
  ],
  ACTIVITY_TYPES: ['室內', '戶外'],
  RECORDERS: ['爸爸', '媽媽', '共同記錄'],
  TRANSPORTATION: ['飛機', '高鐵', '臺鐵', '公車', '計程車', '步行', '開車', '騎車', '其它']
};

// --- 2. Helper Functions ---
const getDateStatus = (year, month, day) => {
    const md = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, day);
    const weekDay = dateObj.getDay(); 
    const holidayName = HOLIDAYS_CONFIG[md] || '';
    let familyName = '';
    if (md === '10-16') { const age = year - 2023; familyName = age === 0 ? '兒子誕生' : `兒子${age}歲生日`; }
    if (md === '02-27') familyName = '爸爸生日';
    if (md === '08-31') familyName = '媽媽生日';
    if (md === '08-08') familyName = '父親節';
    if (month === 5 && weekDay === 0 && day >= 8 && day <= 14) familyName = '母親節';
    const isMakeUp = MAKE_UP_DAYS.includes(md);
    const isHoliday = (!!holidayName || weekDay === 0 || weekDay === 6) && !isMakeUp;
    return { isHoliday, holidayName, familyName, isMakeUp, weekDay };
};

const getTaiwanTimeParts = (date = new Date()) => {
  const formatter = (options) => date.toLocaleString('en-US', { timeZone: 'Asia/Taipei', ...options });
  return {
    year: parseInt(formatter({ year: 'numeric' })),
    month: formatter({ month: '2-digit' }).padStart(2, '0'),
    day: formatter({ day: '2-digit' }).padStart(2, '0'),
    hour: formatter({ hour: '2-digit', hour12: false }).replace(/^24/, '00').padStart(2, '0'),
    minute: formatter({ minute: '2-digit' }).padStart(2, '0')
  };
};

const formatRocDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const dateObj = new Date(dateStr);
  const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const weekDay = weekDays[dateObj.getDay()];
  const { holidayName, familyName } = getDateStatus(parseInt(y), parseInt(m), parseInt(d));
  let info = weekDay;
  if (holidayName) info += ` / ${holidayName}`;
  if (familyName) info += ` / ${familyName}`;
  return `${parseInt(y) - 1911}年${m}月${d}日 ${info}`;
};

const getCurrentTime = () => {
    const t = getTaiwanTimeParts();
    return `${t.hour}:${t.minute}`;
};

const sortListHelper = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
        const prevA = a.isPreviousDay || false;
        const prevB = b.isPreviousDay || false;
        if (prevA !== prevB) return prevA ? -1 : 1;
        const getTime = (item) => {
             if (item.time === '早上') return '06:00';
             if (item.time === '中午') return '12:00';
             if (item.time === '晚上') return '18:00';
             if (item.time) return item.time;
             if (item.startTime) return item.startTime;
             return '99:99'; 
        };
        return getTime(a).localeCompare(getTime(b));
    });
};

const getInitialFormData = () => {
  const t = getTaiwanTimeParts();
  return {
    date: `${t.year}-${t.month}-${t.day}`,
    time: '', weather: '', weatherTempMin: '', weatherTempMax: '', weatherLocation: '', weatherSearchQuery: '',
    location: '', locationCustom: '', handoverItems: '', handoverSituation: '', handoverSituationCustom: '', 
    isOvernight: '', overnightStartDate: '', overnightEndDate: '', departureTripTime: '', departureTripTransportation: '', departureTripTransportationCustom: '', returnTripTime: '', returnTripTransportation: '', returnTripTransportationCustom: '',
    schoolDepartureTripTime: '', schoolDepartureTripTransportation: '', schoolDepartureTripTransportationCustom: '', schoolReturnTripTime: '', schoolReturnTripTransportation: '', schoolReturnTripTransportationCustom: '',
    activityDepartureTripTime: '', activityDepartureTripTransportation: '', activityDepartureTripTransportationCustom: '', activityReturnTripTime: '', activityReturnTripTransportation: '', activityReturnTripTransportationCustom: '',
    schoolLeaveType: '', schoolLeaveOther: '', schoolLeaveHalfDayDesc: '', schoolLeavePersonalDesc: '', schoolLeaveSickDesc: '', 
    schoolNotes: '', schoolArrivalTime: '', schoolArrivalCompanion: '', schoolDepartureTime: '', schoolDepartureCompanion: '',
    mealBreakfast: '', mealBreakfastTime: '', waterBreakfast: '', appetiteBreakfast: '',
    mealLunch: '', mealLunchTime: '', waterLunch: '', appetiteLunch: '', lunchReferToSchool: false,
    mealDinner: '', mealDinnerTime: '', waterDinner: '', appetiteDinner: '',
    snackRecords: [], snackReferToSchool: false, breastfeedingTimes: [],
    sleepLastNight: '', sleepAwakeRecords: [], sleepWakeUp: '', isWakeUpBreastfeeding: false,
    sleepBedtime: '', isBedtimeBreastfeeding: false, sleepActualTime: '', sleepActualReason: '', 
    napRecords: [], napReferToSchool: false, bowelMovements: [], bowelReferToSchool: false, isNoBowelMovement: false, 
    emotionRecords: [], activityRecords: [], oralCareRecords: [], oralCareReferToSchool: false,
    symptoms: [], injuryRecords: [], medicalLocations: [], healthCheckRecords: [], medications: [], healthCardStatus: '',
    notes: '', recorder: '', childArrivalRecordsBasic: [], childArrivalRecordsSchool: [], childArrivalRecordsActivity: [],
    isLocked: false,
    lastUpdated: null
  };
};

// --- Logic Layer: Reducer Handlers ---
const actionHandlers = {
    [ACTIONS.SET_FULL_DATA]: (state, action) => ({ ...state, ...action.payload }),
    
    [ACTIONS.UPDATE_FIELD]: (state, action) => {
        const { name, value } = action.payload;
        if (name === 'date') return { ...getInitialFormData(), date: value };
        
        const newState = { ...state, [name]: value };
        if (name === 'isOvernight' && value === '是' && !state.overnightStartDate) {
            newState.overnightStartDate = state.date;
            newState.overnightEndDate = state.date;
        }
        if (name === 'sleepWakeUp' && state.isWakeUpBreastfeeding) {
            const updatedBFList = state.breastfeedingTimes.map(b => b.source === 'sleep-wakeup' ? { ...b, time: value || '00:00' } : b);
            newState.breastfeedingTimes = sortListHelper(updatedBFList);
        }
        if (name === 'sleepBedtime' && state.isBedtimeBreastfeeding) {
            const updatedBFList = state.breastfeedingTimes.map(b => b.source === 'sleep-bedtime' ? { ...b, time: value || '00:00' } : b);
            newState.breastfeedingTimes = sortListHelper(updatedBFList);
        }
        return newState;
    },
    
    [ACTIONS.RESET_DATE_TO_TODAY]: (state) => {
        const t = getTaiwanTimeParts();
        return { ...getInitialFormData(), date: `${t.year}-${t.month}-${t.day}` };
    },

    [ACTIONS.ADD_ITEM]: (state, action) => {
        const id = action.item.id || Date.now();
        const newItem = { ...action.item, id };
        const newList = [...(state[action.key] || []), newItem];
        return { ...state, [action.key]: sortListHelper(newList) };
    },

    [ACTIONS.REMOVE_ITEM]: (state, action) => {
         let newState = { ...state, [action.key]: state[action.key].filter(i => i.id !== action.id) };
         if (action.key === 'symptoms') {
             const removedItem = state.symptoms.find(i => i.id === action.id);
             if (removedItem && removedItem.source === 'bowel-list' && removedItem.sourceId) {
                 const updatedBowelList = newState.bowelMovements.map(b => b.id === removedItem.sourceId ? { ...b, type: '正常' } : b);
                 newState.bowelMovements = sortListHelper(updatedBowelList);
             }
         }
         return newState;
    },

    [ACTIONS.UPDATE_ITEM]: (state, action) => {
         const newList = state[action.key].map(i => i.id === action.id ? { ...i, [action.field]: action.value } : i);
         let newState = { ...state, [action.key]: sortListHelper(newList) };
         
         if (action.key === 'sleepAwakeRecords' && action.field === 'time') {
             const updatedBFList = newState.breastfeedingTimes.map(b => (b.source === 'sleep-awake' && b.sourceId === action.id) ? { ...b, time: action.value || '00:00' } : b);
             newState.breastfeedingTimes = sortListHelper(updatedBFList);
         }
         if (action.key === 'napRecords' && action.field === 'startTime') {
             const updatedBFList = newState.breastfeedingTimes.map(b => (b.source === 'nap-list' && b.sourceId === action.id) ? { ...b, time: action.value || '00:00' } : b);
             newState.breastfeedingTimes = sortListHelper(updatedBFList);
         }
         return newState;
    },

    [ACTIONS.RESET_MEAL]: (state, action) => {
        const { meal } = action.payload; 
        return {
            ...state,
            [`meal${meal}`]: '',
            [`meal${meal}Time`]: '',
            [`appetite${meal}`]: '',
            [`water${meal}`]: ''
        };
    },

    [ACTIONS.RESET_ITEM_FIELDS]: (state, action) => {
        const { key, id, fields } = action.payload;
        const newList = state[key].map(i => {
            if (i.id === id) {
                const updates = {};
                fields.forEach(f => updates[f] = '');
                return { ...i, ...updates };
            }
            return i;
        });
        return { ...state, [key]: sortListHelper(newList) };
    },

    [ACTIONS.DELETE_LINKED_RECORD]: (state, action) => {
        const { listKey, id } = action.payload;
        const list = state[listKey] || [];
        const itemToDelete = list.find(i => i.id === id);
        const newList = list.filter(i => i.id !== id);
        let newState = { ...state, [listKey]: sortListHelper(newList) };
        if (itemToDelete && itemToDelete.source && itemToDelete.sourceId) {
            const { source, sourceId, linkedField } = itemToDelete;
            let targetListKey = '';
            if (source === 'symptom-list') targetListKey = 'symptoms';
            else if (source === 'injury-list') targetListKey = 'injuryRecords';
            let targetField = linkedField;
            if (!targetField) {
                if (listKey === 'medications') targetField = 'isMedicated';
                else if (listKey === 'medicalLocations') targetField = 'isDoctorVisited';
            }
            if (targetListKey && targetField && newState[targetListKey]) {
                const newTargetList = newState[targetListKey].map(item => {
                    if (item.id === sourceId) {
                        return { ...item, [targetField]: false };
                    }
                    return item;
                });
                newState = { ...newState, [targetListKey]: sortListHelper(newTargetList) };
            }
        }
        return newState;
    },

    [ACTIONS.UPDATE_BOWEL_TYPE]: (state, action) => {
        const { id, value, time } = action.payload;
        const targetBowel = state.bowelMovements.find(i => i.id === id);
        const prevValue = targetBowel ? targetBowel.type : null;
        
        const updatedBowelList = state.bowelMovements.map(i => i.id === id ? { ...i, type: value } : i);
        let newState = { ...state, bowelMovements: sortListHelper(updatedBowelList) };
        
        if (value === '拉肚子/腸胃炎' && prevValue !== '拉肚子/腸胃炎') {
            const newSymptom = { id: Date.now(), time: time || '00:00', desc: '拉肚子/腸胃炎', isFever: false, isPreviousDay: false, source: 'bowel-list', sourceId: id };
            newState.symptoms = sortListHelper([...state.symptoms, newSymptom]);
        } else if (prevValue === '拉肚子/腸胃炎' && value !== '拉肚子/腸胃炎') {
            newState.symptoms = state.symptoms.filter(s => !(s.source === 'bowel-list' && s.sourceId === id));
        }
        return newState;
    },

    [ACTIONS.TOGGLE_WAKE_UP_BREASTFEEDING]: (state, action) => {
        const { checked, time } = action.payload;
        let newState = { ...state, isWakeUpBreastfeeding: checked };
        const existingIdx = state.breastfeedingTimes.findIndex(b => b.source === 'sleep-wakeup');
        if (checked) {
            if (existingIdx === -1) {
                const newRecord = { id: Date.now(), time: time || '00:00', isNap: false, source: 'sleep-wakeup' };
                newState.breastfeedingTimes = sortListHelper([...state.breastfeedingTimes, newRecord]);
            }
        } else {
            if (existingIdx !== -1) {
                newState.breastfeedingTimes = state.breastfeedingTimes.filter((_, i) => i !== existingIdx);
            }
        }
        return newState;
    },

    [ACTIONS.TOGGLE_AWAKE_IS_BREASTFEEDING]: (state, action) => {
        const { id, checked, time } = action.payload;
        const updatedAwakeList = state.sleepAwakeRecords.map(i => i.id === id ? { ...i, isBreastfeeding: checked } : i);
        let newState = { ...state, sleepAwakeRecords: sortListHelper(updatedAwakeList) };
        
        const existingIdx = state.breastfeedingTimes.findIndex(b => 
            (b.source === 'sleep-awake' && b.sourceId === id) || 
            (!b.sourceId && b.source === 'sleep-awake' && b.time === time)
        );
        
        if (checked) {
            if (existingIdx === -1) {
                const newRecord = { id: Date.now(), time: time || '00:00', isNap: false, source: 'sleep-awake', sourceId: id };
                newState.breastfeedingTimes = sortListHelper([...state.breastfeedingTimes, newRecord]);
            }
        } else {
            if (existingIdx !== -1) {
                newState.breastfeedingTimes = state.breastfeedingTimes.filter((_, i) => i !== existingIdx);
            }
        }
        return newState;
    },

    [ACTIONS.TOGGLE_BEDTIME_BREASTFEEDING]: (state, action) => {
        const { checked, time } = action.payload;
        let newState = { ...state, isBedtimeBreastfeeding: checked };
        const existingIdx = state.breastfeedingTimes.findIndex(b => b.source === 'sleep-bedtime');
        if (checked) {
            if (existingIdx === -1) {
                const newRecord = { id: Date.now(), time: time || '00:00', isNap: false, source: 'sleep-bedtime' };
                newState.breastfeedingTimes = sortListHelper([...state.breastfeedingTimes, newRecord]);
            }
        } else {
            if (existingIdx !== -1) {
                newState.breastfeedingTimes = state.breastfeedingTimes.filter((_, i) => i !== existingIdx);
            }
        }
        return newState;
    },

    [ACTIONS.TOGGLE_NAP_IS_BREASTFEEDING]: (state, action) => {
        const { id, checked, time, isNap } = action.payload;
        const targetNap = state.napRecords.find(i => i.id === id);
        if (!targetNap) return state;

        if (targetNap.source === 'breastfeeding-list' && targetNap.sourceId) {
            if (!checked) {
                const updatedNapList = state.napRecords.map(i => 
                    i.id === id ? { ...i, isBreastfeeding: false, source: undefined, sourceId: undefined } : i
                );
                const updatedBFList = state.breastfeedingTimes.filter(b => b.id !== targetNap.sourceId);
                return { ...state, napRecords: sortListHelper(updatedNapList), breastfeedingTimes: sortListHelper(updatedBFList) };
            } else {
                const updatedNapList = state.napRecords.map(i => i.id === id ? { ...i, isBreastfeeding: checked } : i);
                return { ...state, napRecords: sortListHelper(updatedNapList) };
            }
        } else {
            const updatedNapList = state.napRecords.map(i => i.id === id ? { ...i, isBreastfeeding: checked } : i);
            let newState = { ...state, napRecords: sortListHelper(updatedNapList) };
            
            const existingBfIndex = state.breastfeedingTimes.findIndex(b => 
                (b.source === 'nap-list' && b.sourceId === id) || 
                (!b.sourceId && b.source === 'nap-list' && b.time === targetNap.startTime)
            );

            if (checked) {
                if (existingBfIndex !== -1) {
                    const updatedBFList = state.breastfeedingTimes.map((b, idx) => 
                        idx === existingBfIndex ? { ...b, isNap: isNap || false, time: time || '00:00' } : b
                    );
                    newState.breastfeedingTimes = sortListHelper(updatedBFList);
                } else {
                    const newRecord = { id: Date.now(), time: time || '00:00', isNap: isNap || false, source: 'nap-list', sourceId: id };
                    newState.breastfeedingTimes = sortListHelper([...state.breastfeedingTimes, newRecord]);
                }
            } else {
                if (existingBfIndex !== -1) {
                    newState.breastfeedingTimes = state.breastfeedingTimes.filter((_, idx) => idx !== existingBfIndex);
                }
            }
            return newState;
        }
    },

    [ACTIONS.TOGGLE_NAP_IS_NAP]: (state, action) => {
        const { id, checked } = action.payload;
        const targetNap = state.napRecords.find(i => i.id === id);
        const updatedNapList = state.napRecords.map(i => i.id === id ? { ...i, isNap: checked } : i);
        let newState = { ...state, napRecords: sortListHelper(updatedNapList) };
        
        if (targetNap && targetNap.isBreastfeeding) {
            const timeToMatch = targetNap.startTime || '00:00';
            const updatedBFList = state.breastfeedingTimes.map(b => 
                (
                    b.sourceId === id || 
                    (!b.sourceId && b.source === 'nap-list' && b.time === timeToMatch) ||
                    (targetNap.source === 'breastfeeding-list' && targetNap.sourceId === b.id)
                ) 
                    ? { ...b, isNap: checked } 
                    : b
            );
            newState.breastfeedingTimes = sortListHelper(updatedBFList);
        }
        return newState;
    },

    [ACTIONS.TOGGLE_BREASTFEEDING_IS_NAP]: (state, action) => {
        const { id, checked, time } = action.payload;
        const targetBF = state.breastfeedingTimes.find(i => i.id === id);
        const updatedBFList = state.breastfeedingTimes.map(i => i.id === id ? { ...i, isNap: checked } : i);
        let newState = { ...state, breastfeedingTimes: sortListHelper(updatedBFList) };
        
        if (targetBF && targetBF.source === 'nap-list') {
            const updatedNapList = state.napRecords.map(n => 
                (n.id === targetBF.sourceId || (!targetBF.sourceId && n.startTime === targetBF.time)) 
                    ? { ...n, isNap: checked } 
                    : n
            );
            newState.napRecords = sortListHelper(updatedNapList);
        } else {
            const existingNapIndex = state.napRecords.findIndex(n => 
                (n.source === 'breastfeeding-list' && n.sourceId === id) || 
                (!n.sourceId && n.startTime === time && n.isBreastfeeding)
            );
            
            if (existingNapIndex !== -1) {
                const updatedNapList = state.napRecords.map((n, idx) => 
                    idx === existingNapIndex ? { ...n, isNap: checked } : n
                );
                newState.napRecords = sortListHelper(updatedNapList);
            } else if (checked) {
                const newNap = { id: Date.now(), startTime: time || '00:00', endTime: '', isBreastfeeding: true, isNap: true, source: 'breastfeeding-list', sourceId: id };
                newState.napRecords = sortListHelper([...state.napRecords, newNap]);
            }
        }
        return newState;
    }
};

const formReducer = (state, action) => {
    const handler = actionHandlers[action.type];
    return handler ? handler(state, action) : state;
};

// --- Report Generation Helpers ---
const getTransportText = (depTime, depTrans, depTransCustom, retTime, retTrans, retTransCustom, indent = '   ') => {
    let transportText = '';
    // 智慧判斷：如果縮排較深 (5格以上)，子項目使用 •，否則使用 -
    const symbol = indent.length >= 5 ? '•' : '-';
    if (depTime || depTrans) {
        let depStr = depTrans || '';
        if (depStr.includes('其它') && depTransCustom) {
            depStr = depStr.replace('其它', `其它(${depTransCustom})`);
        }
        transportText += `${indent}${symbol} 出發：${depTime || '??:??'} ${depStr}\n`;
    }
    if (retTime || retTrans) {
        let retStr = retTrans || '';
        if (retStr.includes('其它') && retTransCustom) {
            retStr = retStr.replace('其它', `其它(${retTransCustom})`);
        }
        transportText += `${indent}${symbol} 返程：${retTime || '??:??'} ${retStr}\n`;
    }
    return transportText;
};

const formatBasicReport = (formData, dateInfo) => {
    const loc = formData.location === '其它' ? formData.locationCustom : formData.location;
    let text = `【親子成長聯絡簿】\n\n📅 日期：${formatRocDate(formData.date)} ${formData.time}\n`;
    
    let wParts = [];
    if (formData.weather) wParts.push(formData.weather);
    if (formData.weatherTempMin || formData.weatherTempMax) wParts.push(`${formData.weatherTempMin || '?'}°C ~ ${formData.weatherTempMax || '?'}°C`);
    if (formData.weatherLocation) wParts.push(`(${formData.weatherLocation})`);
    if (wParts.length > 0) text += `🌤️ 天氣：${wParts.join(' ')}\n`;

    const handoverStr = formData.handoverSituation === '其它' ? `${formData.handoverSituation} (${formData.handoverSituationCustom})` : formData.handoverSituation;
    if (handoverStr) text += `🤝 交接：${handoverStr}\n`; 
    if (loc) text += `📍 地點：${loc}\n`;
    if (formData.handoverItems) text += `🎒 物品：${formData.handoverItems}\n`;
    if (formData.isOvernight) {
        text += `🌙 過夜：${formData.isOvernight}${formData.isOvernight === '是' ? ` 【${formatRocDate(formData.overnightStartDate || formData.date)} ~ ${formatRocDate(formData.overnightEndDate || formData.date)}】` : ''}\n`;
    }
    
    const basicTransport = getTransportText(formData.departureTripTime, formData.departureTripTransportation, formData.departureTripTransportationCustom, formData.returnTripTime, formData.returnTripTransportation, formData.returnTripTransportationCustom, '   ');
    if (basicTransport) {
        text += `🚗 交通方式：\n${basicTransport}`;
    }

    formData.childArrivalRecordsBasic?.forEach(r => { const aloc = r.location === '其它' ? r.locationCustom : r.location; if (r.time || aloc) text += `🏠 小孩已於 ${r.time || '??:??'} 抵達 ${aloc || '???'}\n`; });
    
    return text.trimEnd();
};

const formatSchoolReport = (formData) => {
    let schoolText = '';
    if (formData.schoolLeaveType) {
        let lt = formData.schoolLeaveType;
        if (lt === '其它') lt += ` (${formData.schoolLeaveOther})`;
        else if (lt === '半天') lt += ` (${formData.schoolLeaveHalfDayDesc})`;
        else if (lt === '事假') lt += ` (${formData.schoolLeavePersonalDesc})`;
        else if (lt === '病假') lt += ` (${formData.schoolLeaveSickDesc})`;
        schoolText += `   - 假別：${lt}\n`;
    }
    if (formData.schoolNotes) schoolText += `   - 校方的話：${formData.schoolNotes}\n`;
    if (formData.schoolArrivalTime) schoolText += `   - 到校：${formData.schoolArrivalTime} ${formData.schoolArrivalCompanion ? `(${formData.schoolArrivalCompanion})` : ''}\n`;
    if (formData.schoolDepartureTime) schoolText += `   - 放學：${formData.schoolDepartureTime} ${formData.schoolDepartureCompanion ? `(${formData.schoolDepartureCompanion})` : ''}\n`;
    
    const schoolTransport = getTransportText(formData.schoolDepartureTripTime, formData.schoolDepartureTripTransportation, formData.schoolDepartureTripTransportationCustom, formData.schoolReturnTripTime, formData.schoolReturnTripTransportation, formData.schoolReturnTripTransportationCustom, '     ');
    if (schoolTransport) {
        schoolText += `   - 🚗 交通方式：\n${schoolTransport}`;
    }

    formData.childArrivalRecordsSchool?.forEach(r => { const aloc = r.location === '其它' ? r.locationCustom : r.location; if (r.time || aloc) schoolText += `   - 🏠 小孩已於 ${r.time || '??:??'} 抵達 ${aloc || '???'}\n`; });

    return schoolText ? `🏫 學校接送資訊：\n${schoolText.trimEnd()}` : '';
};

const formatActivityReport = (formData) => {
    let activityText = '';
    if (formData.activityRecords && formData.activityRecords.length > 0) { formData.activityRecords.forEach(a => { activityText += `   • ${a.time ? `${a.time} ` : ''}${a.location ? `在${a.location} ` : ''}${a.content ? `進行 ${a.content}` : ''} ${a.type ? `(${a.type})` : ''}\n`; }); }
    
    if (formData.activityRecords?.some(a => a.type === '戶外')) {
        const activityTransport = getTransportText(formData.activityDepartureTripTime, formData.activityDepartureTripTransportation, formData.activityDepartureTripTransportationCustom, formData.activityReturnTripTime, formData.activityReturnTripTransportation, formData.activityReturnTripTransportationCustom, '     ');
        if (activityTransport) {
            activityText += `   • 🚗 交通方式：\n${activityTransport}`;
        }
        formData.childArrivalRecordsActivity?.forEach(r => { const aloc = r.location === '其它' ? r.locationCustom : r.location; if (r.time || aloc) activityText += `   • 🏠 小孩已於 ${r.time || '??:??'} 抵達 ${aloc || '???'}\n`; });
    }

    return activityText ? `🐾 活動記錄：\n${activityText.trimEnd()}` : '';
};

const formatDiningReport = (formData) => {
    let diningText = '';
    const formatMeal = (name, time, content, appetite, water, isRefer) => {
        if (!content && !time && !appetite && !water && !isRefer) return '';
        let c = content; if (isRefer) c = c ? `${c} (參考學校聯絡簿)` : "(參考學校聯絡簿)";
        let details = []; if(appetite) details.push(`食慾:${appetite}`); if(water) details.push(`水:${water}`);
        let detailStr = details.length ? ` (${details.join(', ')})` : '';
        return `   - ${name}：${time ? `(${time}) ` : ''}${c}${detailStr}\n`;
    };
    diningText += formatMeal('早餐', formData.mealBreakfastTime, formData.mealBreakfast, formData.appetiteBreakfast, formData.waterBreakfast);
    diningText += formatMeal('午餐', formData.mealLunchTime, formData.mealLunch, formData.appetiteLunch, formData.waterLunch, formData.lunchReferToSchool);
    diningText += formatMeal('晚餐', formData.mealDinnerTime, formData.mealDinner, formData.appetiteDinner, formData.waterDinner);
    if (formData.snackReferToSchool) diningText += `   - 點心：(參考學校聯絡簿)\n`;
    formData.snackRecords.forEach(s => diningText += formatMeal('點心', s.time, s.content, s.appetite, s.water));
    if (formData.breastfeedingTimes.length > 0) diningText += `🤱 親餵哺乳：${formData.breastfeedingTimes.map(t => `${t.time}${t.isNap ? '(小睡)' : ''}`).join('、')}\n`;

    return diningText ? `🍽  用餐與飲水：\n${diningText.trimEnd()}` : '';
};

const formatSleepReport = (formData) => {
    let sleepText = '';
    if (formData.sleepLastNight) sleepText += `   - 昨晚就寢：${formData.sleepLastNight}\n`;
    formData.sleepAwakeRecords.forEach(r => sleepText += `     • 夜醒 ${r.time}${r.asleepTime ? ` ~ ${r.asleepTime}` : ''} : ${r.reason}${r.isBreastfeeding ? " (親餵)" : ""}\n`);
    if (formData.sleepWakeUp) sleepText += `   - 早上起床：${formData.sleepWakeUp} ${formData.isWakeUpBreastfeeding ? '(親餵)' : ''}\n`;
    
    let napHeader = `   - 午休、小睡：`; if (formData.napReferToSchool) napHeader += ` (參考學校聯絡簿)`; 
    if (formData.napRecords.length > 0 || formData.napReferToSchool) {
        sleepText += `${napHeader}\n`;
        formData.napRecords.forEach(n => { const typeLabel = n.isNap ? '小睡' : '午休'; sleepText += `     • ${typeLabel} ${n.startTime} ~ ${n.endTime}${n.isNotAsleep ? ` (沒睡著: ${n.reason})` : ''}\n`; });
    }
    if (formData.sleepBedtime) sleepText += `   - 晚上就寢：${formData.sleepBedtime} ${formData.isBedtimeBreastfeeding ? '(親餵)' : ''}\n`;
    if (formData.sleepActualTime) sleepText += `     • 實際入睡：${formData.sleepActualTime} ${formData.sleepActualReason ? `(${formData.sleepActualReason})` : ''}\n`;

    return sleepText ? `💤 睡眠狀況：\n${sleepText.trimEnd()}` : '';
};

const formatPhysiologyReport = (formData) => {
    let text = '';
    let bowelText = '';
    if (formData.bowelReferToSchool) bowelText += '   (參考學校聯絡簿)\n';
    if (formData.isNoBowelMovement) bowelText += `   - 本日無排便\n`;
    formData.bowelMovements.forEach((bm, i) => bowelText += `   (${i + 1}) ${bm.time} - ${bm.type}\n`);
    if (bowelText) text += `💩 排便記錄：\n${bowelText.trimEnd()}`;
    
    let emotionText = '';
    if (formData.emotionRecords.length > 0) { formData.emotionRecords.forEach(r => emotionText += `   • ${r.time} ${r.mood} ${r.note ? `(${r.note})` : ''}\n`); }
    if (emotionText) text += `${text ? '\n\n-------------------\n' : ''}😊 情緒與行為：\n${emotionText.trimEnd()}`;
    
    return text;
};

const formatHealthReport = (formData) => {
    let healthText = '';
    if (formData.healthCardStatus) { const statusMap = { 'dad_to_mom': '爸爸交給媽媽', 'mom_to_dad': '媽媽交給爸爸', 'card_at_dad': '卡片在爸爸這', 'card_at_mom': '卡片在媽媽這' }; healthText += `🪪 健保卡：${statusMap[formData.healthCardStatus] || ''}\n`; }
    if (formData.oralCareRecords.length > 0 || formData.oralCareReferToSchool) { healthText += `   - 口腔保健：${formData.oralCareReferToSchool ? ' (參考學校聯絡簿)' : ''}\n`; formData.oralCareRecords.forEach(r => healthText += `     • ${r.time} ${r.type}\n`); }

    if (formData.symptoms.length > 0) { 
        healthText += `   - 不適症狀：\n`; 
        formData.symptoms.forEach(i => { 
            let details = []; if(i.isFever) details.push(`發燒 ${i.feverTemp || '?'}°C${i.isFeverMedication ? ' (已服藥)' : ''}`); if(i.isDoctorVisited) details.push('已就醫'); if(i.isMedicated) details.push('已服藥');
            let detailStr = details.length ? ` (${details.join('、')})` : '';
            let obs = []; if(i.observationTime) obs.push(`觀察:${i.observationTime}`); if(i.isImproved) obs.push('改善'); if(i.isNotImproved) obs.push(`未改善${i.notImprovedReason ? `(${i.notImprovedReason})` : ''}`);
            let obsStr = obs.length ? ` [${obs.join(' ')}]` : '';
            healthText += `     • ${i.isPreviousDay?'(前一天)':''} ${i.time} ${i.desc}${detailStr}${obsStr}\n`; 
        }); 
    }
    if (formData.injuryRecords?.length > 0) { 
        healthText += `   - 受傷記錄：\n`; 
        formData.injuryRecords.forEach(i => { 
            let info = []; 
            if (i.isPreviousDay) info.push('(前一天)');
            if(i.time) info.push(i.time); 
            if(i.location) info.push(`@${i.location}`);
            let content = []; if(i.part) content.push(`部位:${i.part}`); if(i.cause) content.push(`原因:${i.cause}`);
            let actions = []; if(i.isMedicated) actions.push('已擦藥'); if(i.isDoctorVisited) actions.push('已就醫');
            let actionStr = actions.length ? ` (${actions.join('、')})` : '';
            healthText += `     • ${info.join(' ')} ${content.join('，')}${actionStr}\n`; 
        }); 
    }
    if (formData.medications.length > 0) { 
        healthText += `   - 用藥紀錄：\n`; 
        formData.medications.forEach(m => { 
            let type = []; if(m.isInternal) type.push('內服'); if(m.isExternal) type.push('外用');
            let typeStr = type.length ? `(${type.join('/')})` : '';
            let obs = []; if(m.isImproved) obs.push('改善'); if(m.isNotImproved) obs.push(`未改善${m.notImprovedReason ? `(${m.notImprovedReason})` : ''}`);
            let obsStr = obs.length ? ` [${obs.join(' ')}]` : '';
            healthText += `     • ${m.isPreviousDay?'(前一天)':''} ${m.time} ${typeStr} ${m.name} ${obsStr}\n`; 
        }); 
    }
    if (formData.medicalLocations.length > 0) { 
        healthText += `   - 就醫資訊：\n`; 
        formData.medicalLocations.forEach(i => { 
            let treatments = []; if(i.isVaccine) treatments.push(`疫苗:${i.vaccineName}`); if(i.isInjection) treatments.push('打針'); if(i.isIV) treatments.push('點滴'); if(i.isOtherTreatment) treatments.push(`其它:${i.otherTreatmentDesc}`);
            let treatStr = treatments.length ? ` -> ${treatments.join('、')}` : '';
            let reason = i.reason ? ` (${i.reason})` : ''; let note = i.doctorNote ? ` 醫囑:${i.doctorNote}` : ''; let cost = i.cost ? ` $${i.cost}元` : '';
            let followUpDateStr = i.followUpDate ? formatRocDate(i.followUpDate).split(' ')[0] : '未定';
            let followUp = i.isFollowUp ? ` [預約回診: ${followUpDateStr}${i.followUpNumber ? ` (${i.followUpNumber}號)` : ''}]` : '';
            healthText += `     • ${i.time} ${i.desc}${reason}${treatStr}${note}${cost}${followUp}\n`; 
        }); 
    }
    if (formData.healthCheckRecords.length > 0) { 
        healthText += `   - 健康檢查：\n`; 
        formData.healthCheckRecords.forEach(c => { 
            healthText += `     • ${c.time} ${c.checkLocation}\n`; 
            if(c.height || c.weight) healthText += `       數值: 身高${c.height}cm / 體重${c.weight}kg\n`;
            if(c.isVaccine) healthText += `       疫苗: ${c.vaccineName}\n`;
            let eye = []; if(c.leftEyeStatus) eye.push(`左眼:${c.leftEyeStatus==='normal'?'正常':`異常(${c.leftEyeAbnormalReason})`}`); if(c.rightEyeStatus) eye.push(`右眼:${c.rightEyeStatus==='normal'?'正常':`異常(${c.rightEyeAbnormalReason})`}`);
            if(eye.length) healthText += `       視力: ${eye.join(' / ')}\n`;
            let oral = []; if(c.oralStatus) oral.push(`檢查:${c.oralStatus==='normal'?'正常':`異常(${c.oralAbnormalReason})`}`); if(c.isOralCare) oral.push(`保健:${c.oralCareItem}`);
            if(oral.length) healthText += `       牙齒: ${oral.join(' / ')}\n`;
            if(c.cost) healthText += `       費用: $${c.cost}元\n`;
            if(c.doctorNote) healthText += `       醫囑: ${c.doctorNote}\n`;
        }); 
    }

    return healthText ? `💊 健康與醫療：\n${healthText.trimEnd()}` : '';
};

const formatFooterReport = (formData) => {
    let footerText = '';
    if (formData.notes) footerText += `📝 備註：${formData.notes || ''}\n`;
    if (formData.recorder) footerText += `✍ 記錄人：${formData.recorder || ''}`;
    return footerText.trimEnd();
};

const generateReportText = (formData, dateInfo) => {
    const sections = [
        formatBasicReport(formData, dateInfo),
        formatSchoolReport(formData),
        formatSleepReport(formData),
        formatDiningReport(formData),
        formatPhysiologyReport(formData),
        formatHealthReport(formData),
        formatActivityReport(formData)
    ].filter(Boolean); // 過濾掉空白的區塊

    let report = sections.join('\n-------------------\n');
    
    const footer = formatFooterReport(formData);
    if (footer) {
        report += `\n-------------------\n${footer}`;
    }
    
    return report;
};

// --- Hooks ---
const useToast = () => {
    const [toast, setToast] = useState(null);
    const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);
    return { toast, showToast, setToast };
};

let openccConverter = null;
const toTraditionalAsync = async (str) => {
    if (!str) return str;
    try {
        if (!window.OpenCC) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/full.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        if (!openccConverter) {
            openccConverter = window.OpenCC.Converter({ from: 'cn', to: 'tw' });
        }
        return openccConverter(str);
    } catch (e) {
        console.warn("繁簡轉換套件載入失敗，回退至原字串", e);
        return str; 
    }
};

const useWeather = (date, dispatch, showToast) => {
    return useCallback(async (searchQuery = '') => {
        const fetchWeather = async (lat, lon, fallbackName = '') => {
            try {
              const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${date}&end_date=${date}`);
              const data = await res.json();
              
              let locationName = fallbackName;
              try {
                  const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh-TW`);
                  const geoData = await geoRes.json();
                  if (geoData && geoData.address) {
                      const city = geoData.address.city || geoData.address.county || geoData.address.town || '';
                      const district = geoData.address.suburb || geoData.address.city_district || geoData.address.village || geoData.address.neighbourhood || '';
                      if (city || district) {
                          const rawName = city === district ? city : `${city}${district}`;
                          locationName = await toTraditionalAsync(rawName); 
                      }
                  }
              } catch (e) { console.error("Geo fetch failed", e); }
              
              if (data.daily?.temperature_2m_max) {
                 dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name: 'weatherTempMax', value: data.daily.temperature_2m_max[0] } });
                 dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name: 'weatherTempMin', value: data.daily.temperature_2m_min[0] } });
                 if (locationName) dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name: 'weatherLocation', value: locationName } });
                 showToast('氣溫資料已更新', 'success');
              } else showToast("查無該日期的氣溫資料", 'error');
            } catch (error) { showToast("氣象資料取得失敗", 'error'); }
        };

        if (typeof searchQuery === 'string' && searchQuery.trim()) {
            showToast('搜尋地點中...', 'info');
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&accept-language=zh-TW`);
                const geoData = await geoRes.json();
                if (geoData && geoData.length > 0) {
                    const lat = geoData[0].lat;
                    const lon = geoData[0].lon;
                    const traditionalQuery = await toTraditionalAsync(searchQuery.trim());
                    fetchWeather(lat, lon, traditionalQuery); 
                } else {
                    showToast('找不到該地點，請嘗試其他關鍵字', 'error');
                }
            } catch (e) {
                showToast('地點搜尋失敗', 'error');
            }
            return;
        }

        if (!navigator.geolocation) { showToast("無定位功能，使用臺北市松山區", 'info'); fetchWeather(25.058, 121.558, '臺北市松山區'); return; }
        navigator.geolocation.getCurrentPosition(p => fetchWeather(p.coords.latitude, p.coords.longitude), 
            () => { showToast("無法定位，使用臺北市松山區", 'info'); fetchWeather(25.058, 121.558, '臺北市松山區'); }, { timeout: 5000 });
    }, [date, dispatch, showToast]);
};

const useContactBookForm = () => {
    const [formData, dispatch] = useReducer(formReducer, getInitialFormData());
    const [dateInfo, setDateInfo] = useState({});

    const getHolidayInfo = useCallback((dateStr) => {
        if (!dateStr) return {};
        const [y, m, d] = dateStr.split('-');
        const { isHoliday, holidayName, familyName, isMakeUp, weekDay } = getDateStatus(parseInt(y), parseInt(m), parseInt(d));
        const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        return { dayLabel: dayNames[weekDay], holidayName, familyName, isMakeUp, isHoliday, isWeekend: weekDay === 0 || weekDay === 6 };
    }, []);

    useEffect(() => { setDateInfo(getHolidayInfo(formData.date)); }, [formData.date, getHolidayInfo]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name, value: type === 'checkbox' ? checked : value } });
    }, []);

    const handleTimeReset = useCallback((name) => { dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name, value: '' } }); }, []);
    const handleJumpToToday = useCallback(() => { dispatch({ type: ACTIONS.RESET_DATE_TO_TODAY }); }, []);

    const listOps = useMemo(() => ({
        add: (key, item) => {
            const id = Date.now();
            const newItem = { ...item, id };
            dispatch({ type: ACTIONS.ADD_ITEM, key, item: newItem });
            return id;
        },
        remove: (key, id) => dispatch({ type: ACTIONS.REMOVE_ITEM, key, id }),
        update: (key, id, field, value) => dispatch({ type: ACTIONS.UPDATE_ITEM, key, id, field, value }),
        resetFields: (key, id, fields) => dispatch({ type: ACTIONS.RESET_ITEM_FIELDS, payload: { key, id, fields } }),
    }), []);

    const handlers = useMemo(() => ({
        updateBowelType: (id, value) => dispatch({ type: ACTIONS.UPDATE_BOWEL_TYPE, payload: { id, value, time: getCurrentTime() } }),
        toggleWakeUpBreastfeeding: (checked, time) => dispatch({ type: ACTIONS.TOGGLE_WAKE_UP_BREASTFEEDING, payload: { checked, time: time || getCurrentTime() } }),
        toggleAwakeBreastfeeding: (id, checked, time) => dispatch({ type: ACTIONS.TOGGLE_AWAKE_IS_BREASTFEEDING, payload: { id, checked, time } }),
        toggleBedtimeBreastfeeding: (checked, time) => dispatch({ type: ACTIONS.TOGGLE_BEDTIME_BREASTFEEDING, payload: { checked, time: time || getCurrentTime() } }),
        toggleNapBreastfeeding: (id, checked, startTime, isNap) => dispatch({ type: ACTIONS.TOGGLE_NAP_IS_BREASTFEEDING, payload: { id, checked, time: startTime, isNap } }),
        toggleNapIsNap: (id, checked) => dispatch({ type: ACTIONS.TOGGLE_NAP_IS_NAP, payload: { id, checked } }),
        toggleBreastfeedingNap: (id, checked, time) => dispatch({ type: ACTIONS.TOGGLE_BREASTFEEDING_IS_NAP, payload: { id, checked, time } }),
        handleMealReset: (meal) => dispatch({ type: ACTIONS.RESET_MEAL, payload: { meal } }),
        deleteLinkedRecord: (listKey, id) => dispatch({ type: ACTIONS.DELETE_LINKED_RECORD, payload: { listKey, id } })
    }), []);

    return { formData, dispatch, handleChange, handleTimeReset, handleJumpToToday, listOps, handlers, dateInfo };
};

const useFirebaseSync = (formData, dispatch) => {
    const [user, setUser] = useState(null);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    // 🌟 新增：記錄當前的登入模式 (family 或 local)
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

        // 如果選擇單機模式且未登入，執行匿名登入
        if (authMode === 'local' && !user) {
             signInAnonymously(auth).catch((e) => {
                 if (e.code === 'auth/operation-not-allowed') {
                     setAuthMode(null);
                     localStorage.removeItem('contact-book-auth-mode');
                 }
             });
        }
        return () => unsubscribe();
    }, [authMode, user]);

    useEffect(() => {
        if (!user || !formData.date || !db) return;
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
    }, [user, formData.date]); 

    useEffect(() => {
        if (loadedDateRef.current !== formData.date) return;
        if (isRemoteUpdate.current || !user || !db || !isLoaded) return;
        
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
    }, [formData, user, isLoaded]); 

    return { user, syncStatus, isLoaded, isAuthLoading, authMode, setAuthMode };
};

const useRecordedDates = (user) => {
    const [recordedDates, setRecordedDates] = useState([]);
    useEffect(() => {
        if (!user || !db) return;
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
    }, [user]);
    return recordedDates;
};

// 新增：區塊收合/展開 Hook
const useSectionExpand = (sectionId, date, hasData, forceExpand = false) => {
    const [isExpanded, setIsExpanded] = useState(forceExpand || hasData);
    
    // 當日期切換，或是資料的「有無狀態」發生改變時，自動展開或收合
    useEffect(() => {
        setIsExpanded(forceExpand || hasData);
    }, [date, forceExpand, hasData]);

    // 監聽來自上方導覽列的點擊事件，自動展開被點擊的區塊
    useEffect(() => {
        const handleExpand = (e) => {
            if (e.detail === sectionId) setIsExpanded(true);
        };
        window.addEventListener('expandSection', handleExpand);
        return () => window.removeEventListener('expandSection', handleExpand);
    }, [sectionId]);

    const toggle = useCallback(() => setIsExpanded(p => !p), []);
    return [isExpanded, toggle];
};


// --- UI Components ---
const Skeleton = ({ className }) => <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
const FormSkeleton = () => (
    <div className="space-y-8 animate-fade-in">
        <div className="space-y-4"><div className="h-8 w-32 bg-gray-200 rounded mb-2"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div></div></div>
    </div>
);
const Toast = React.memo(({ message, type = 'info', onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-emerald-600' : 'bg-gray-800';
  const Icon = type === 'error' ? AlertCircle : type === 'success' ? Check : Info;
  return (<div className={`fixed bottom-6 right-6 ${bg} text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-slide-up z-[60]`}>
      <Icon className="w-4 h-4" /><span className="font-medium text-sm">{message}</span><button onClick={onClose}><X className="w-3 h-3" /></button></div>);
});
const Modal = ({ children, onClose }) => (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 animate-scale-up">{children}</div></div>);
const ConfirmModal = ({ title, content, onConfirm, onCancel, confirmText="確認", cancelText="取消" }) => (
    <Modal onClose={onCancel}><div className="p-6"><h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2"><Database className="w-6 h-6 text-indigo-600"/>{title}</h3><p className="text-gray-600 mb-6 text-base leading-relaxed">{content}</p><div className="flex justify-end gap-3"><button onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">{cancelText}</button><button onClick={onConfirm} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium">{confirmText}</button></div></div></Modal>
);
const ErrorModal = ({ content, onClose }) => (
    <Modal onClose={onClose}><div className="p-6"><h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2"><AlertCircle className="w-6 h-6 text-red-600"/>無法匯入</h3><p className="text-gray-600 mb-6 text-base leading-relaxed">{content}</p><div className="flex justify-end"><button onClick={onClose} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium">知道了</button></div></div></Modal>
);

// 🌟 新增：登入畫面元件
const LoginScreen = ({ onLoginFamily, onLoginLocal, isAuthenticating, loginError }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password) onLoginFamily(password);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Baby className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">歡迎來到聯絡簿</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">請選擇您的使用模式</p>
                    </div>

                    {loginError && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm flex items-center justify-center gap-2 text-left leading-relaxed">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> 
                            <span>{loginError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2 text-left">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" /> 家庭同步模式
                            </label>
                            <input 
                                type="password" 
                                placeholder="請輸入家庭共同密碼"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isAuthenticating || !password}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {isAuthenticating ? <span className="animate-pulse">登入中...</span> : <><LogIn className="w-4 h-4" /> 登入家庭帳號</>}
                        </button>
                    </form>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                        <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-800 px-4 text-xs text-gray-400">或者</span></div>
                    </div>

                    <button 
                        onClick={onLoginLocal}
                        disabled={isAuthenticating}
                        className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl py-3 font-medium transition-colors flex justify-center items-center gap-2"
                    >
                        <User className="w-4 h-4" /> 單機模式 (不分享資料)
                    </button>
                </div>
            </div>
        </div>
    );
};

const HistoryModal = ({ recordedDates, currentDate, onSelectDate, onClose }) => {
    const grouped = useMemo(() => {
        const sorted = [...recordedDates].sort((a, b) => a.localeCompare(b));
        return sorted.reduce((acc, date) => {
            const ym = date.slice(0, 7);
            if (!acc[ym]) acc[ym] = [];
            acc[ym].push(date);
            return acc;
        }, {});
    }, [recordedDates]);

    const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return (
        <Modal onClose={onClose}>
            <div className="p-6 max-h-[80vh] flex flex-col dark:bg-gray-800 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-blue-600"/>歷史紀錄總覽
                </h3>
                <div className="overflow-y-auto pr-2 space-y-4 flex-1 hide-scrollbar">
                    {sortedMonths.map((ym) => {
                        const [y, m] = ym.split('-');
                        const dates = grouped[ym];
                        return (
                            <div key={ym} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <span>{y-1911}年{m}月</span>
                                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{dates.length} 筆</span>
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {dates.map(date => {
                                        const d = date.split('-')[2];
                                        const isActive = date === currentDate;
                                        return (
                                            <button 
                                                key={date} 
                                                onClick={() => onSelectDate(date)} 
                                                className={`px-3 py-1 border rounded-md transition-colors text-sm font-medium shadow-sm ${
                                                    isActive 
                                                        ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
                                                        : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                                }`}
                                            >
                                                {d}日
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                    {recordedDates.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-4">目前還沒有任何記錄哦！</p>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600">關閉</button>
                </div>
            </div>
        </Modal>
    );
};

// 更新：SectionHeader 加入展開/收合事件與動畫箭頭
const SectionHeader = React.memo(({ id, title, icon: Icon, colorClass, bgClass, onScrollTop, isExpanded, onToggle }) => (
    <div 
        className={`flex items-center justify-between border-b ${colorClass.replace('text', 'border')} pb-2 cursor-pointer select-none group`} 
        onClick={onToggle}
    >
        <h2 className={`flex items-center gap-2 text-lg font-semibold ${colorClass} group-hover:opacity-80 transition-opacity`}>
            <Icon className="w-5 h-5" /> {title}
        </h2>
        <div className="flex items-center gap-2">
            <button 
                onClick={(e) => { e.stopPropagation(); onScrollTop(id); }} 
                className={`p-1.5 rounded-full ${bgClass} ${colorClass.replace('text-600', 'text-400')} hover:${bgClass.replace('50', '100')} transition-colors`} 
                title="回到頂部"
            >
                <ArrowUp className="w-4 h-4" />
            </button>
            {onToggle && (
                <div className={`p-1.5 rounded-full ${bgClass} ${colorClass.replace('text-600', 'text-400')} transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`}>
                    <ChevronUp className="w-4 h-4" />
                </div>
            )}
        </div>
    </div>
));

const TimeSelect = React.memo(({ value, onChange, name, className }) => {
  const [h, m] = (value || ':').split(':');
  const baseClass = `flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-[40px] focus-within:ring-2 focus-within:ring-blue-300 transition-shadow shrink-0 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`;
  return (<div className={className ? `${baseClass} ${className.replace('border ', '')}` : `${baseClass} w-[130px]`}>
      <select value={h||''} onChange={e=>onChange({target:{name, value:`${e.target.value}:${m||'00'}`}})} className="flex-1 h-full text-center bg-transparent outline-none appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200"><option value="" disabled>時</option>{HOURS.map(x=><option key={x} value={x} className="text-gray-700 dark:text-gray-200 dark:bg-gray-700">{x}</option>)}</select>
      <span className="text-gray-400 dark:text-gray-500 font-bold">:</span>
      <select value={m||''} onChange={e=>onChange({target:{name, value:`${h||'00'}:${e.target.value}`}})} className="flex-1 h-full text-center bg-transparent outline-none appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200"><option value="" disabled>分</option>{MINUTES.map(x=><option key={x} value={x} className="text-gray-700 dark:text-gray-200 dark:bg-gray-700">{x}</option>)}</select>
    </div>);
});

// CustomCalendar & RocDateSelect Components
const CustomCalendar = React.memo(({ value, onChange, onClose, recordedDates = [] }) => {
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const handlePrevMonth = () => { if (year === 2023 && month === 10) return; setViewDate(new Date(year, month - 2, 1)); };
  const handleNextMonth = () => setViewDate(new Date(year, month, 1));
  const handleYearChange = (e) => setViewDate(new Date(parseInt(e.target.value), month - 1, 1));
  const handleMonthChange = (e) => { const newMonth = parseInt(e.target.value); if (year === 2023 && newMonth < 10) return; setViewDate(new Date(year, newMonth - 1, 1)); };
  const handleDayClick = (d) => { onChange(`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`); };
  const renderDays = () => {
      const days = [];
      for(let i=0; i<firstDayOfWeek; i++) days.push(<div key={`empty-${i}`} className="h-10"></div>);
      const minDate = new Date(2023, 9, 16);
      for(let d=1; d<=daysInMonth; d++) {
          const currentDate = new Date(year, month - 1, d);
          const isBeforeMin = currentDate < minDate;
          const status = getDateStatus(year, month, d);
          
          const fullDateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const isSelected = value === fullDateStr;
          const isRecorded = recordedDates.includes(fullDateStr);
          
          let textColor = isBeforeMin ? 'text-gray-300 dark:text-gray-600' : (status.isHoliday ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-800 dark:text-gray-200');
          if (isSelected) textColor = 'text-white';
          days.push(
              <button key={d} disabled={isBeforeMin} onClick={(e) => { e.stopPropagation(); if(!isBeforeMin) handleDayClick(d); }} className={`h-10 w-10 mx-auto flex flex-col items-center justify-center rounded-full transition-colors relative ${isSelected ? 'bg-blue-600 shadow-md' : isBeforeMin ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  {isRecorded && !isSelected && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 shadow-sm rounded-full"></span>}
                  <span className={`text-sm ${textColor} leading-none`}>{d}</span>
                  {status.holidayName && !isBeforeMin && (<span className={`text-[8px] leading-tight px-0.5 rounded ${isSelected?'text-blue-100':'text-red-500'} scale-90 origin-top`}>{status.holidayName.slice(0,4)}</span>)}
              </button>
          );
      }
      return days;
  };
  const years = Array.from({length: new Date().getFullYear() + 3 - 2023}, (_, i) => 2023 + i);
  return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-[280px] sm:w-[320px] animate-scale-up">
          <div className="flex justify-between items-center mb-4">
              <button onClick={(e)=>{e.stopPropagation(); handlePrevMonth();}} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeft className="w-5 h-5"/></button>
              <div className="flex gap-2">
                 <select value={year} onChange={handleYearChange} className="font-bold text-gray-800 dark:text-gray-200 text-base bg-transparent border-none outline-none">{years.map(y => (<option key={y} value={y} className="text-gray-800 dark:text-gray-200 dark:bg-gray-800">{y-1911}年</option>))}</select>
                 <select value={month} onChange={handleMonthChange} className="font-bold text-gray-800 dark:text-gray-200 text-base bg-transparent border-none outline-none">{Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m} className="text-gray-800 dark:text-gray-200 dark:bg-gray-800">{m}月</option>)}</select>
              </div>
              <button onClick={(e)=>{e.stopPropagation(); handleNextMonth();}} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ChevronRight className="w-5 h-5"/></button>
          </div>
          <div className="grid grid-cols-7 text-center mb-2 border-b dark:border-gray-700 pb-2">{['一','二','三','四','五','六','日'].map((d,i)=><div key={d} className={`text-xs font-bold ${i>=5?'text-red-500 dark:text-red-400':'text-gray-500 dark:text-gray-400'}`}>{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
      </div>
  );
});

const RocDateSelect = React.memo(({ value, onChange, isHoliday, recordedDates, className, textClass = "text-sm" }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const containerRef = useRef(null);
  const display = useMemo(() => { if(!value) return ''; const [y,m,d] = value.split('-'); return `${y-1911}年${m}月${d}日`; }, [value]);
  
  const handleDateChange = useCallback((newDate) => { onChange({ target: { name: 'date', value: newDate } }); setShowCalendar(false); }, [onChange]);
  
  return (
    <>
      <div ref={containerRef} className={`relative flex items-center justify-center border cursor-pointer hover:shadow-sm transition-all ${isHoliday?'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800':'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'} ${className || 'rounded-lg h-[40px] min-w-[150px]'}`}>
        <div onClick={() => setShowCalendar(true)} className="w-full h-full flex items-center justify-center"><span className={`${textClass} font-bold tracking-widest ${isHoliday?'text-red-700 dark:text-red-300':'text-gray-700 dark:text-gray-200'}`}>{display || '請選擇日期'}</span></div>
      </div>
      {showCalendar && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { e.stopPropagation(); setShowCalendar(false); }}>
              <div onClick={(e) => e.stopPropagation()}>
                  <CustomCalendar value={value} onChange={handleDateChange} onClose={() => setShowCalendar(false)} recordedDates={recordedDates} />
              </div>
          </div>,
          document.body
      )}
    </>
  );
});

const RadioGroup = ({ name, options, value, onChange, color='blue', customInput=false }) => (
    <div className="flex flex-wrap gap-3 items-center">{options.map(opt => { const isObj = typeof opt === 'object'; const val = isObj ? opt.value : opt; const label = isObj ? opt.label : opt; return (<label key={val} className={`flex items-center gap-1 cursor-pointer select-none hover:text-${color}-800 dark:hover:text-${color}-300 text-gray-700 dark:text-gray-300`}><input type="radio" name={name} value={val} checked={value === val} onChange={onChange} onClick={e => value === val && onChange({target:{name, value:''}})} className={`text-${color}-600 focus:ring-${color}-500`} /><span className="text-sm">{label}</span></label>)})}{customInput && value === (typeof options[options.length - 1] === 'object' ? options[options.length - 1].value : options[options.length - 1]) && customInput}</div>
);

// 抽出單一方向 (出發/返程) 的交通資訊區塊元件
const TripDirectionBlock = React.memo(({ title, timeName, timeValue, transName, transValue, customName, customValue, handleChange, handleTimeReset }) => (
    <div className="space-y-3 p-3 bg-white dark:bg-gray-800 rounded border border-slate-100 dark:border-slate-700 shadow-sm">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</span>
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-bold min-w-[3em]">時間：</span>
            <div className="flex items-center gap-1">
                <TimeSelect name={timeName} value={timeValue} onChange={handleChange} />
                <button type="button" onClick={()=>handleTimeReset(timeName)}><RotateCcw className="w-3 h-3 text-gray-400 dark:text-gray-500"/></button>
            </div>
        </div>
        <div className="space-y-1">
            <div className="flex items-start gap-2 w-full">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-bold min-w-[3em] mt-1.5 shrink-0">交通：</span>
                <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 flex-1 min-w-0">
                    {OPTIONS.TRANSPORTATION.map(t => (
                        <label key={`${transName}-${t}`} className={`col-span-1 cursor-pointer px-1 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm tracking-tighter sm:tracking-normal border flex items-center justify-center text-center whitespace-nowrap transition-colors ${transValue?.includes(t) ? 'bg-gray-200 font-bold text-gray-900 border-gray-300 dark:bg-gray-600 dark:text-white dark:border-gray-500' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}>
                            <input type="checkbox" className="hidden" checked={transValue?.includes(t) || false} onChange={() => {
                                const cur = transValue ? transValue.split('、') : [];
                                const next = cur.includes(t) ? cur.filter(i => i !== t) : [...cur, t];
                                handleChange({ target: { name: transName, value: next.join('、') } });
                            }} />
                            {t}
                        </label>
                    ))}
                    {transValue?.includes('其它') && (
                        <div className="col-span-3 sm:col-span-1 flex items-center px-1 sm:px-0 w-full">
                            <input name={customName} value={customValue || ''} onChange={handleChange} maxLength={10} className="border-b border-slate-300 dark:border-slate-700 bg-transparent outline-none w-full sm:w-32 text-xs sm:text-sm dark:text-gray-200" placeholder="說明(最多10字)" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
));

// 共用的交通方式區塊元件
const TransportationBlock = React.memo(({ formData, handleChange, handleTimeReset, prefix = '', className = '', isLocked = false }) => {
    const depTime = prefix ? `${prefix}DepartureTripTime` : 'departureTripTime';
    const depTrans = prefix ? `${prefix}DepartureTripTransportation` : 'departureTripTransportation';
    const depTransCustom = prefix ? `${prefix}DepartureTripTransportationCustom` : 'departureTripTransportationCustom';
    const retTime = prefix ? `${prefix}ReturnTripTime` : 'returnTripTime';
    const retTrans = prefix ? `${prefix}ReturnTripTransportation` : 'returnTripTransportation';
    const retTransCustom = prefix ? `${prefix}ReturnTripTransportationCustom` : 'returnTripTransportationCustom';
    const defaultBg = className || 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800';

    const hasData = !!(formData[depTime] || formData[depTrans] || formData[depTransCustom] || formData[retTime] || formData[retTrans] || formData[retTransCustom]);
    const [isExpanded, setIsExpanded] = useState(hasData);

    return (
        <div className={`p-4 rounded-lg border transition-all duration-300 ${defaultBg}`}>
            <button 
                type="button" 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="w-full flex items-center justify-between outline-none group"
            >
                <label className="block text-base font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1 cursor-pointer group-hover:opacity-80 transition-opacity">🚗 交通方式 <span className="text-sm font-normal text-slate-500">(選填)</span></label>
                <div className={`text-slate-500 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`}>
                    <ChevronUp className="w-4 h-4"/>
                </div>
            </button>
            
            {isExpanded && (
                <div className={`grid md:grid-cols-2 gap-4 mt-3 animate-fade-in transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                    <TripDirectionBlock 
                        title="出發資訊" timeName={depTime} timeValue={formData[depTime]} 
                        transName={depTrans} transValue={formData[depTrans]} 
                        customName={depTransCustom} customValue={formData[depTransCustom]} 
                        handleChange={handleChange} handleTimeReset={handleTimeReset} 
                    />
                    <TripDirectionBlock 
                        title="返程資訊" timeName={retTime} timeValue={formData[retTime]} 
                        transName={retTrans} transValue={formData[retTrans]} 
                        customName={retTransCustom} customValue={formData[retTransCustom]} 
                        handleChange={handleChange} handleTimeReset={handleTimeReset} 
                    />
                </div>
            )}
        </div>
    );
});

// 新增：抽出共用的飲食區塊 (早、午、晚餐)
const MealBlock = React.memo(({ title, mealType, formData, handleChange, handlers, referCheckbox = null, isFaded = false }) => {
    const mealTimeName = `meal${mealType}Time`;
    const appetiteName = `appetite${mealType}`;
    const waterName = `water${mealType}`;
    const mealContentName = `meal${mealType}`;

    return (
        <div className="bg-[#f1f6f3] dark:bg-green-950 p-4 rounded-lg border border-green-100 dark:border-green-900 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <span className="text-base font-bold text-green-800 dark:text-green-300">{title}</span>
                <button type="button" onClick={() => handlers.handleMealReset(mealType)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><RotateCcw className="w-3 h-3"/></button>
                {referCheckbox}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400 block">時間</span>
                    <TimeSelect name={mealTimeName} value={formData[mealTimeName]} onChange={handleChange}/>
                </div>
                <div className="flex flex-nowrap gap-x-6">
                    <div className={`flex flex-col gap-1 ${isFaded ? 'opacity-50' : ''}`}><span className="text-sm font-bold text-gray-600 dark:text-gray-400">食慾</span><select name={appetiteName} value={formData[appetiteName]} onChange={handleChange} className="border rounded-lg h-[40px] w-full min-w-[80px] bg-white dark:bg-gray-800 dark:border-gray-600"><option value="" disabled>請選擇</option>{OPTIONS.APPETITE.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                    <div className={`flex flex-col gap-1 ${isFaded ? 'opacity-50' : ''}`}><span className="text-sm font-bold text-gray-600 dark:text-gray-400">飲水</span><select name={waterName} value={formData[waterName]} onChange={handleChange} className="border rounded-lg h-[40px] w-full min-w-[80px] bg-white dark:bg-gray-800 dark:border-gray-600"><option value="" disabled>請選擇</option>{OPTIONS.WATER.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                </div>
            </div>
            <input name={mealContentName} value={formData[mealContentName]} onChange={handleChange} autoComplete="off" className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 outline-none text-sm focus:border-green-500 transition-colors dark:text-gray-200 ${isFaded ? 'opacity-50' : ''}`} placeholder={`${title}內容`}/>
        </div>
    );
});

// --- Sub-Lists ---
const SymptomList = React.memo(({ symptoms, listOps, showToast, scrollToElement, handlers }) => (
    <div id="symptom-list" className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-100 dark:border-red-900">
        <div className="flex justify-between items-center mb-2"><span className="font-bold text-red-800 dark:text-red-300">不適症狀</span><button type="button" onClick={()=>listOps.add('symptoms', {time:'', desc:'', isFever:false, feverTemp:''})} className="bg-red-200 dark:bg-red-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-red-800 dark:text-red-300"><PlusCircle className="w-3 h-3"/> 新增</button></div>
        {symptoms.map(i => (
            <div key={`item-${i.id}`} id={`item-${i.id}`} className="bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-800/50 mb-2 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600"><input type="checkbox" checked={i.isPreviousDay || false} onChange={e=>listOps.update('symptoms', i.id, 'isPreviousDay', e.target.checked)} className="w-3 h-3"/><span className="text-xs dark:text-gray-300">前一天</span></label>
                    <TimeSelect value={i.time} onChange={e=>listOps.update('symptoms', i.id, 'time', e.target.value)}/>
                    <label className="flex items-center gap-1 cursor-pointer bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded border border-orange-200 dark:border-orange-900"><input type="checkbox" checked={i.isFever || false} onChange={e=>{listOps.update('symptoms', i.id, 'isFever', e.target.checked); }} className="w-3 h-3 text-orange-600"/><span className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1"><Thermometer className="w-3 h-3"/> 發燒</span></label>
                    {i.isFever && (
                        <>
                            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/30 px-1 border border-orange-200 dark:border-orange-900 rounded"><input value={i.feverTemp || ''} onChange={e=>listOps.update('symptoms', i.id, 'feverTemp', e.target.value)} className="w-10 bg-transparent text-center text-sm outline-none dark:text-gray-200" placeholder="溫度"/><span className="text-xs dark:text-gray-300">°C</span></div>
                            <label className="flex items-center gap-1 cursor-pointer bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded border border-red-200 dark:border-red-900">
                                <input type="checkbox" checked={i.isFeverMedication || false} onChange={e=>{
                                    listOps.update('symptoms', i.id, 'isFeverMedication', e.target.checked);
                                    if(e.target.checked) {
                                        const newId = listOps.add('medications', {time:i.time, name:'退燒藥', isInternal:true, source:'symptom-list', sourceId: i.id, linkedField: 'isFeverMedication'});
                                        showToast('已新增退燒藥記錄', 'success');
                                        setTimeout(() => scrollToElement(`item-${newId}`), 100);
                                    }
                                }} className="w-3 h-3 text-red-600"/>
                                <span className="text-xs text-red-700 dark:text-red-400">已服退燒藥</span>
                            </label>
                        </>
                    )}
                </div>
                <input value={i.desc || ''} onChange={e=>listOps.update('symptoms', i.id, 'desc', e.target.value)} className="w-full border-b border-red-300 dark:border-red-800 outline-none text-sm p-1 min-w-0 bg-transparent dark:text-gray-200" placeholder="症狀描述"/>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded flex-wrap">
                    <span className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1"><Activity className="w-3 h-3"/> 情形觀察:</span>
                    <TimeSelect value={i.observationTime} onChange={e=>listOps.update('symptoms', i.id, 'observationTime', e.target.value)} className="w-[120px] h-[32px]"/>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">症狀改善:</span>
                    <label className="flex items-center gap-1 dark:text-gray-300"><input type="checkbox" checked={i.isImproved || false} onChange={e=>listOps.update('symptoms', i.id, 'isImproved', e.target.checked)} className="w-3 h-3"/><span className="text-xs">改善</span></label>
                    <label className="flex items-center gap-1 dark:text-gray-300"><input type="checkbox" checked={i.isNotImproved || false} onChange={e=>listOps.update('symptoms', i.id, 'isNotImproved', e.target.checked)} className="w-3 h-3"/><span className="text-xs">未改善</span></label>
                    {i.isNotImproved && <input value={i.notImprovedReason || ''} onChange={e=>listOps.update('symptoms', i.id, 'notImprovedReason', e.target.value)} className="border-b text-xs w-20 bg-transparent dark:text-gray-200 dark:border-gray-500" placeholder="備註"/>}
                </div>
                <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={i.isMedicated || false} onChange={e=>{
                        listOps.update('symptoms', i.id, 'isMedicated', e.target.checked); 
                        if(e.target.checked){ 
                            const newId = listOps.add('medications', {time:i.time, name:'', isInternal:true, source: 'symptom-list', sourceId: i.id, linkedField: 'isMedicated'}); 
                            showToast('已新增用藥記錄', 'success'); 
                            setTimeout(() => scrollToElement(`item-${newId}`), 100);
                        }
                    }} className="w-3 h-3 text-green-600"/><span className="text-xs text-green-600 dark:text-green-400">服藥</span></label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={i.isDoctorVisited || false} onChange={e=>{
                        listOps.update('symptoms', i.id, 'isDoctorVisited', e.target.checked); 
                        if(e.target.checked){ 
                            const newId = listOps.add('medicalLocations', {time:i.time, reason:i.desc, source: 'symptom-list', sourceId: i.id, linkedField: 'isDoctorVisited'}); 
                            showToast('已新增就醫記錄', 'success'); 
                            setTimeout(() => scrollToElement(`item-${newId}`), 100);
                        }
                    }} className="w-3 h-3 text-blue-600"/><span className="text-xs text-blue-600 dark:text-blue-400">就醫</span></label>
                    <button type="button" onClick={() => {
                        if (i.source === 'bowel-list') {
                            showToast('已同步將排便記錄恢復為「正常」', 'info');
                            scrollToElement('bowel-list');
                        }
                        listOps.remove('symptoms', i.id);
                    }} className="ml-auto text-red-500 dark:text-red-400"><Trash2 className="w-4 h-4"/></button>
                </div>
            </div>
        ))}
    </div>
));

const InjuryList = React.memo(({ injuryRecords, listOps, showToast, scrollToElement, handlers }) => (
    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-100 dark:border-red-900">
         <div className="flex justify-between items-center mb-2"><span className="font-bold text-red-800 dark:text-red-300">受傷記錄</span><button type="button" onClick={()=>listOps.add('injuryRecords', {time:'', location:'', part:'', cause:''})} className="bg-red-200 dark:bg-red-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-red-800 dark:text-red-300"><PlusCircle className="w-3 h-3"/> 新增</button></div>
         {injuryRecords.map(i => (
             <div key={`item-${i.id}`} id={`item-${i.id}`} className="bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-800/50 mb-2 flex flex-col gap-2">
                 <div className="flex flex-wrap items-center gap-2 w-full">
                    <label className="flex items-center gap-1 cursor-pointer bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600"><input type="checkbox" checked={i.isPreviousDay || false} onChange={e=>listOps.update('injuryRecords', i.id, 'isPreviousDay', e.target.checked)} className="w-3 h-3"/><span className="text-xs dark:text-gray-300">前一天</span></label>
                    <div className="flex-1"><TimeSelect value={i.time} onChange={e=>listOps.update('injuryRecords', i.id, 'time', e.target.value)}/></div>
                 </div>
                 <input value={i.location || ''} onChange={e=>listOps.update('injuryRecords', i.id, 'location', e.target.value)} placeholder="地點" className="w-full p-1 text-sm border-b border-red-300 dark:border-red-800 outline-none bg-transparent dark:text-gray-200"/>
                 
                 <div className="flex items-center gap-2">
                    <input value={i.part || ''} onChange={e=>listOps.update('injuryRecords', i.id, 'part', e.target.value)} placeholder="部位" className="flex-1 p-1 text-sm border-b border-red-300 dark:border-red-800 outline-none bg-transparent min-w-0 dark:text-gray-200"/>
                    <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap select-none shrink-0 dark:text-gray-300">
                        <input 
                            type="checkbox" 
                            checked={(i.part || '').includes('未成傷')} 
                            onChange={e => {
                                const isChecked = e.target.checked;
                                let val = i.part || '';
                                if (isChecked) {
                                    val = val ? `${val} (未成傷)` : '未成傷';
                                } else {
                                    val = val.replace(/ ?\(?未成傷\)?/g, '').trim();
                                }
                                listOps.update('injuryRecords', i.id, 'part', val);
                            }}
                            className="w-3 h-3 text-red-600 rounded focus:ring-red-500 border-gray-300"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">未成傷</span>
                    </label>
                 </div>

                 <input value={i.cause || ''} onChange={e=>listOps.update('injuryRecords', i.id, 'cause', e.target.value)} placeholder="原因" className="w-full p-1 text-sm border-b border-red-300 dark:border-red-800 outline-none bg-transparent dark:text-gray-200"/>
                 
                 <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded whitespace-nowrap overflow-x-auto no-scrollbar">
                    <span className="text-xs font-bold text-red-700 dark:text-red-400 shrink-0">後續:</span>
                    <label className="flex items-center gap-1 cursor-pointer bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded shrink-0">
                        <input type="checkbox" checked={i.isMedicated || false} onChange={e=>{
                            listOps.update('injuryRecords', i.id, 'isMedicated', e.target.checked);
                            if(e.target.checked) {
                                const newId = listOps.add('medications', {time:i.time, name:'', isExternal:true, source: 'injury-list', sourceId: i.id, linkedField: 'isMedicated'});
                                showToast('已新增外用藥記錄', 'success');
                                setTimeout(() => scrollToElement(`item-${newId}`), 100);
                            }
                        }} className="w-3 h-3"/><span className="text-xs text-green-600 dark:text-green-400">擦藥</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded shrink-0">
                        <input type="checkbox" checked={i.isDoctorVisited || false} onChange={e=>{
                            listOps.update('injuryRecords', i.id, 'isDoctorVisited', e.target.checked);
                            if(e.target.checked) {
                                const newId = listOps.add('medicalLocations', {time:i.time, reason:`受傷: ${i.part||'未填寫部位'}`, source: 'injury-list', sourceId: i.id, linkedField: 'isDoctorVisited'});
                                showToast('已新增就醫記錄', 'success');
                                setTimeout(() => scrollToElement(`item-${newId}`), 100);
                            }
                        }} className="w-3 h-3"/><span className="text-xs text-blue-600 dark:text-blue-400">就醫</span>
                    </label>
                    <button type="button" onClick={()=>listOps.remove('injuryRecords', i.id)} className="ml-auto text-red-500 dark:text-red-400 shrink-0"><Trash2 className="w-4 h-4"/></button>
                 </div>
             </div>
         ))}
    </div>
));

const MedicationList = React.memo(({ medications, listOps, scrollToElement, handlers }) => {
    const handleDelete = useCallback((id) => {
        const item = medications.find(m => m.id === id);
        if (item && item.sourceId) {
             scrollToElement(`item-${item.sourceId}`);
        } else if (item && item.source) {
             scrollToElement(item.source);
        }
        handlers.deleteLinkedRecord('medications', id);
    }, [medications, handlers, scrollToElement]);

    return (
        <div id="medication-list" className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-100 dark:border-red-900 scroll-mt-28">
            <div className="flex justify-between items-center mb-2"><span className="font-bold text-red-800 dark:text-red-300">用藥紀錄</span><button type="button" onClick={()=>listOps.add('medications', {time:'', name:'', isInternal:true})} className="bg-red-200 dark:bg-red-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-red-800 dark:text-red-300"><PlusCircle className="w-3 h-3"/> 新增</button></div>
            {medications.map(i => (
                <div key={i.id} id={`item-${i.id}`} className="bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-800/50 mb-2 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600"><input type="checkbox" checked={i.isPreviousDay || false} onChange={e=>listOps.update('medications', i.id, 'isPreviousDay', e.target.checked)} className="w-3 h-3"/><span className="text-xs dark:text-gray-300">前一天</span></label>
                        <TimeSelect value={i.time} onChange={e=>listOps.update('medications', i.id, 'time', e.target.value)}/>
                        <label className="flex items-center gap-1 dark:text-gray-300"><input type="checkbox" checked={i.isInternal || false} onChange={e=>listOps.update('medications', i.id, 'isInternal', e.target.checked)} className="w-3 h-3"/><span className="text-xs">內服</span></label>
                        <label className="flex items-center gap-1 dark:text-gray-300"><input type="checkbox" checked={i.isExternal || false} onChange={e=>listOps.update('medications', i.id, 'isExternal', e.target.checked)} className="w-3 h-3"/><span className="text-xs">外用</span></label>
                        <input value={i.name || ''} onChange={e=>listOps.update('medications', i.id, 'name', e.target.value)} placeholder="藥名" className="flex-1 border-b text-sm min-w-[100px] bg-transparent dark:text-gray-200 dark:border-gray-500"/>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded flex-wrap relative">
                        <span className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1"><Activity className="w-3 h-3"/> 情形觀察:</span>
                        <TimeSelect value={i.observationTime} onChange={e=>listOps.update('medications', i.id, 'observationTime', e.target.value)} className="w-[120px] h-[32px]"/>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">症狀改善:</span>
                        <label className="flex items-center gap-1 dark:text-gray-300"><input type="checkbox" checked={i.isImproved || false} onChange={e=>listOps.update('medications', i.id, 'isImproved', e.target.checked)} className="w-3 h-3"/><span className="text-xs">改善</span></label>
                        <label className="flex items-center gap-1 dark:text-gray-300"><input type="checkbox" checked={i.isNotImproved || false} onChange={e=>listOps.update('medications', i.id, 'isNotImproved', e.target.checked)} className="w-3 h-3"/><span className="text-xs">未改善</span></label>
                        {i.isNotImproved && <input value={i.notImprovedReason || ''} onChange={e=>listOps.update('medications', i.id, 'notImprovedReason', e.target.value)} className="border-b text-xs w-20 bg-transparent dark:text-gray-200 dark:border-gray-500" placeholder="備註"/>}
                        <button type="button" onClick={()=>handleDelete(i.id)} className="text-red-500 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded ml-auto"><Trash2 className="w-4 h-4"/></button>
                    </div>
                </div>
            ))}
        </div>
    );
});

const MedicalLocationList = React.memo(({ medicalLocations, listOps, scrollToElement, handlers }) => {
    const handleDelete = useCallback((id) => {
        const item = medicalLocations.find(m => m.id === id);
        if (item && item.sourceId) {
             scrollToElement(`item-${item.sourceId}`);
        } else if (item && item.source) {
             scrollToElement(item.source);
        }
        handlers.deleteLinkedRecord('medicalLocations', id);
    }, [medicalLocations, handlers, scrollToElement]);

    return (
        <div id="medical-location-list" className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-100 dark:border-blue-900 scroll-mt-28">
            <div className="flex justify-between items-center mb-2"><span className="font-bold text-blue-800 dark:text-blue-300">就醫資訊</span><button type="button" onClick={()=>listOps.add('medicalLocations', {time:'', desc:'', reason:'', isFollowUp: false, followUpDate: '', followUpNumber: ''})} className="bg-blue-200 dark:bg-blue-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-blue-800 dark:text-blue-300"><PlusCircle className="w-3 h-3"/> 新增</button></div>
            {medicalLocations.map(i => (
                <div key={i.id} id={`item-${i.id}`} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-900 mb-3 space-y-3 shadow-sm relative">
                    <div className="flex items-center justify-between"><TimeSelect value={i.time} onChange={e=>listOps.update('medicalLocations', i.id, 'time', e.target.value)} className="w-[130px] h-[40px] shrink-0"/><button type="button" onClick={()=>handleDelete(i.id)} className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded shrink-0"><Trash2 className="w-4 h-4"/></button></div>
                    <input value={i.desc || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'desc', e.target.value)} placeholder="醫院/診所" className="w-full p-1 text-sm border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent dark:text-gray-200" />
                    
                    <div className="w-full flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-fit">就醫原因</label>
                        <input value={i.reason || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'reason', e.target.value)} placeholder="" className="w-full p-1 border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent text-sm dark:text-gray-200" />
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2 items-center w-full min-w-0">
                        <label className={`flex items-center justify-center gap-1.5 cursor-pointer select-none border rounded px-2 h-[36px] transition-colors whitespace-nowrap text-xs font-bold ${i.isVaccine ? 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:border-blue-500 dark:text-blue-300' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                            <input type="checkbox" className="hidden" checked={i.isVaccine || false} onChange={e=>listOps.update('medicalLocations', i.id, 'isVaccine', e.target.checked)}/>
                            <span>施打疫苗</span>
                        </label>
                        <label className={`flex items-center justify-center gap-1.5 cursor-pointer select-none border rounded px-2 h-[36px] transition-colors whitespace-nowrap text-xs font-bold ${i.isInjection ? 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                            <input type="checkbox" className="hidden" checked={i.isInjection || false} onChange={e=>listOps.update('medicalLocations', i.id, 'isInjection', e.target.checked)}/>
                            <span>打針</span>
                        </label>
                        <label className={`flex items-center justify-center gap-1.5 cursor-pointer select-none border rounded px-2 h-[36px] transition-colors whitespace-nowrap text-xs font-bold ${i.isIV ? 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                            <input type="checkbox" className="hidden" checked={i.isIV || false} onChange={e=>listOps.update('medicalLocations', i.id, 'isIV', e.target.checked)}/>
                            <span>打點滴</span>
                        </label>
                        
                        <div className="flex items-center gap-2 flex-1 min-w-[100px] max-w-full">
                            <label className={`flex items-center justify-center gap-1.5 cursor-pointer select-none border rounded px-2 h-[36px] transition-colors whitespace-nowrap text-xs font-bold shrink-0 ${i.isOtherTreatment ? 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                                <input type="checkbox" className="hidden" checked={i.isOtherTreatment || false} onChange={e=>listOps.update('medicalLocations', i.id, 'isOtherTreatment', e.target.checked)}/>
                                <span>其它</span>
                            </label>
                            {i.isOtherTreatment && (
                                <input value={i.otherTreatmentDesc || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'otherTreatmentDesc', e.target.value)} placeholder="說明" className="flex-1 p-1 text-xs border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent dark:text-gray-200 w-full min-w-0"/>
                            )}
                        </div>
                    </div>
                    
                    {i.isVaccine && <div className="flex items-center gap-2 mt-2 w-full sm:w-auto"><span className="text-xs font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap min-w-fit">疫苗:</span><input value={i.vaccineName || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'vaccineName', e.target.value)} placeholder="疫苗名稱" className="flex-1 p-1 text-xs border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent dark:text-gray-200 min-w-0"/></div>}

                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">費用</label>
                        <div className="relative w-32">
                            <input value={i.cost || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'cost', e.target.value)} placeholder="" className="w-full p-2 pl-7 pr-8 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-blue-400 outline-none h-[40px] dark:text-gray-200 text-right" />
                            <span className="absolute left-2 top-2.5 text-gray-400 dark:text-gray-500"><DollarSign className="w-4 h-4"/></span>
                            <span className="absolute right-2 top-2.5 text-gray-500 dark:text-gray-400 text-sm">元</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">醫生叮囑</label>
                        <input value={i.doctorNote || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'doctorNote', e.target.value)} placeholder="" className="w-full p-1 border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent text-sm dark:text-gray-200"/>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">預約回診</label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5 shrink-0">
                            <button type="button" onClick={() => listOps.update('medicalLocations', i.id, 'isFollowUp', false)} className={`px-2 py-1 text-xs rounded transition-all ${!i.isFollowUp ? 'bg-white dark:bg-gray-600 shadow text-gray-700 dark:text-gray-200 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>否</button>
                            <button type="button" onClick={() => listOps.update('medicalLocations', i.id, 'isFollowUp', true)} className={`px-2 py-1 text-xs rounded transition-all ${i.isFollowUp ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>是</button>
                        </div>
                        {i.isFollowUp && (
                            <div className="flex items-center gap-2 flex-1 min-w-[150px] animate-fade-in">
                                <RocDateSelect 
                                    value={i.followUpDate} 
                                    onChange={e=>listOps.update('medicalLocations', i.id, 'followUpDate', e.target.value)} 
                                    className="rounded h-[32px] w-[120px] shrink-0"
                                    textClass="text-xs"
                                />
                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">號碼</span>
                                    <input value={i.followUpNumber || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'followUpNumber', e.target.value)} className="w-12 p-1 text-xs border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent dark:text-gray-200 text-center"/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
});

const HealthCheckList = React.memo(({ records, listOps }) => (
    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-100 dark:border-green-900">
        <div className="flex justify-between items-center mb-2"><span className="font-bold text-green-800 dark:text-green-300">健康檢查</span><button type="button" onClick={()=>listOps.add('healthCheckRecords', {time:'', checkLocation:'', height:'', weight:''})} className="bg-green-200 dark:bg-green-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-green-800 dark:text-green-300"><PlusCircle className="w-3 h-3"/> 新增</button></div>
        {records.length === 0 && <div className="text-gray-400 dark:text-gray-500 text-sm text-left pl-2 py-2 italic">目前無記錄</div>}
        {records.map(i => (
            <div key={i.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-200 dark:border-green-800/50 mb-3 space-y-3 shadow-sm relative">
                <div className="flex items-center justify-between"><TimeSelect value={i.time} onChange={e=>listOps.update('healthCheckRecords', i.id, 'time', e.target.value)} className="w-[130px] h-[40px] shrink-0 focus-within:ring-green-300"/><button type="button" onClick={()=>listOps.remove('healthCheckRecords', i.id)} className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded shrink-0"><Trash2 className="w-4 h-4"/></button></div>
                <div className="flex items-center gap-2 w-full"><input value={i.checkLocation || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'checkLocation', e.target.value)} placeholder="醫院/診所" className="w-full p-1 text-sm border-b border-green-300 dark:border-green-700 outline-none bg-transparent dark:text-gray-200" /></div>

                <div className="flex flex-wrap sm:flex-nowrap gap-4">
                    <div className="flex items-center gap-2"><label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">身高</label><div className="relative w-24"><input value={i.height || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'height', e.target.value)} className="w-full p-2 pr-11 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-green-400 outline-none h-[40px] text-right dark:text-gray-200" /><span className="absolute right-2 top-2.5 text-gray-500 dark:text-gray-400 text-sm">公分</span></div></div>
                    <div className="flex items-center gap-2"><label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">體重</label><div className="relative w-24"><input value={i.weight || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'weight', e.target.value)} className="w-full p-2 pr-11 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-green-400 outline-none h-[40px] text-right dark:text-gray-200" /><span className="absolute right-2 top-2.5 text-gray-500 dark:text-gray-400 text-sm">公斤</span></div></div>
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                    <label className={`flex items-center justify-center gap-1.5 cursor-pointer select-none border rounded px-2 h-[36px] transition-colors whitespace-nowrap text-xs font-bold w-fit ${i.isVaccine ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/50 dark:border-green-500 dark:text-green-300' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                        <input type="checkbox" className="hidden" checked={i.isVaccine || false} onChange={e=>listOps.update('healthCheckRecords', i.id, 'isVaccine', e.target.checked)} />
                        <span>施打疫苗</span>
                    </label>
                    {i.isVaccine && (
                        <div className="flex items-center gap-2 w-full">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">名稱</label>
                            <input value={i.vaccineName || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'vaccineName', e.target.value)} placeholder="疫苗名稱" className="w-full p-1 text-xs border-b border-green-300 dark:border-green-700 outline-none bg-transparent dark:text-gray-200"/>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                <div className="flex flex-col sm:flex-row gap-4">
                     <div className="flex items-center gap-2 flex-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">左眼</label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5 shrink-0">
                            <button type="button" onClick={() => listOps.update('healthCheckRecords', i.id, 'leftEyeStatus', i.leftEyeStatus === 'normal' ? '' : 'normal')} className={`px-2 py-1 text-xs rounded transition-all ${i.leftEyeStatus === 'normal' ? 'bg-white dark:bg-gray-600 shadow text-green-600 dark:text-green-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>正常</button>
                            <button type="button" onClick={() => listOps.update('healthCheckRecords', i.id, 'leftEyeStatus', i.leftEyeStatus === 'abnormal' ? '' : 'abnormal')} className={`px-2 py-1 text-xs rounded transition-all ${i.leftEyeStatus === 'abnormal' ? 'bg-white dark:bg-gray-600 shadow text-red-500 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>異常</button>
                        </div>
                        {i.leftEyeStatus==='abnormal' && <input value={i.leftEyeAbnormalReason || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'leftEyeAbnormalReason', e.target.value)} placeholder="原因" className="flex-1 min-w-0 p-1 text-xs border-b border-green-300 dark:border-green-700 outline-none bg-transparent dark:text-gray-200"/>}
                     </div>
                     <div className="flex items-center gap-2 flex-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">右眼</label>
                         <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5 shrink-0">
                            <button type="button" onClick={() => listOps.update('healthCheckRecords', i.id, 'rightEyeStatus', i.rightEyeStatus === 'normal' ? '' : 'normal')} className={`px-2 py-1 text-xs rounded transition-all ${i.rightEyeStatus === 'normal' ? 'bg-white dark:bg-gray-600 shadow text-green-600 dark:text-green-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>正常</button>
                            <button type="button" onClick={() => listOps.update('healthCheckRecords', i.id, 'rightEyeStatus', i.rightEyeStatus === 'abnormal' ? '' : 'abnormal')} className={`px-2 py-1 text-xs rounded transition-all ${i.rightEyeStatus === 'abnormal' ? 'bg-white dark:bg-gray-600 shadow text-red-500 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>異常</button>
                        </div>
                        {i.rightEyeStatus==='abnormal' && <input value={i.rightEyeAbnormalReason || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'rightEyeAbnormalReason', e.target.value)} placeholder="原因" className="flex-1 min-w-0 p-1 text-xs border-b border-green-300 dark:border-green-700 outline-none bg-transparent dark:text-gray-200"/>}
                     </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                         <label className="text-xs font-bold text-green-700 dark:text-green-400 whitespace-nowrap min-w-[3em]">牙齒</label>
                         <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5 shrink-0">
                            <button type="button" onClick={() => listOps.update('healthCheckRecords', i.id, 'oralStatus', i.oralStatus === 'normal' ? '' : 'normal')} className={`px-2 py-1 text-xs rounded transition-all ${i.oralStatus === 'normal' ? 'bg-white dark:bg-gray-600 shadow text-green-600 dark:text-green-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>正常</button>
                            <button type="button" onClick={() => listOps.update('healthCheckRecords', i.id, 'oralStatus', i.oralStatus === 'abnormal' ? '' : 'abnormal')} className={`px-2 py-1 text-xs rounded transition-all ${i.oralStatus === 'abnormal' ? 'bg-white dark:bg-gray-600 shadow text-red-500 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>異常</button>
                        </div>
                         {i.oralStatus==='abnormal' && <input value={i.oralAbnormalReason || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'oralAbnormalReason', e.target.value)} placeholder="原因" className="flex-1 min-w-0 p-1 text-xs border-b border-green-300 dark:border-green-700 outline-none bg-transparent dark:text-gray-200"/>}
                    </div>
                    <div className="flex items-center gap-2 pl-[3em]">
                        <label className="flex items-center gap-1 cursor-pointer select-none whitespace-nowrap shrink-0"><input type="checkbox" checked={i.isOralCare || false} onChange={e=>listOps.update('healthCheckRecords', i.id, 'isOralCare', e.target.checked)} className="w-3 h-3 text-green-600 rounded focus:ring-green-50 border-gray-300"/><span className="text-xs text-green-700 dark:text-green-400">保健</span></label>
                        {i.isOralCare && <input value={i.oralCareItem || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'oralCareItem', e.target.value)} placeholder="項目" className="flex-1 min-w-0 p-1 text-xs border-b border-green-300 dark:border-green-700 outline-none bg-transparent dark:text-gray-200"/>}
                    </div>
                </div>

                 <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">費用</label>
                    <div className="relative w-32">
                        <input value={i.cost || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'cost', e.target.value)} placeholder="" className="w-full p-2 pl-7 pr-8 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-green-400 outline-none h-[40px] dark:text-gray-200 text-right" />
                        <span className="absolute left-2 top-2.5 text-gray-400 dark:text-gray-500"><DollarSign className="w-4 h-4"/></span>
                        <span className="absolute right-2 top-2.5 text-gray-500 dark:text-gray-400 text-sm">元</span>
                    </div>
                </div>

                 <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">醫生叮囑</label>
                    <input value={i.doctorNote || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'doctorNote', e.target.value)} placeholder="" className="w-full p-1 border-b border-green-300 dark:border-green-700 outline-none bg-transparent text-sm dark:text-gray-200"/>
                 </div>
            </div>
        ))}
    </div>
));
// --- End Sub-Lists ---

const BasicSection = React.memo(({ formData, handleChange, dateInfo, handleJumpToToday, handleAutoWeather, handleTimeReset, listOps, onScrollTop, handlers, isLocked, recordedDates }) => {
    const handleWeather = (w) => {
        const cur = formData.weather ? formData.weather.split('、') : [];
        const next = cur.includes(w) ? cur.filter(i=>i!==w) : [...cur, w];
        handleChange({ target: { name: 'weather', value: next.join('、') } });
    };

    const [isExpanded, toggle] = useSectionExpand('basic', formData.date, true, true);

    return (
        <section id="basic" className="scroll-mt-28">
            <SectionHeader id="basic" title="基本資訊" icon={Calendar} colorClass="text-gray-600" bgClass="bg-gray-50" onScrollTop={onScrollTop} isExpanded={isExpanded} onToggle={toggle}/>
            {isExpanded && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2"><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">日期</label><button type="button" onClick={handleJumpToToday} className="text-[10px] bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600 dark:text-gray-300">今日</button></div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <RocDateSelect value={formData.date} onChange={e => handleChange({ target: { name: 'date', value: e.target.value } })} isHoliday={dateInfo.isHoliday} recordedDates={recordedDates} />
                            <span className={`font-bold text-sm px-2 py-1 rounded border ${dateInfo.isHoliday ? 'text-red-600 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' : dateInfo.isMakeUp ? 'text-gray-600 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300' : 'text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'}`}>
                                {dateInfo.dayLabel}
                            </span>
                            {dateInfo.holidayName && (
                                <span className="font-bold text-sm px-2 py-1 rounded border text-red-600 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
                                    {dateInfo.holidayName}
                                </span>
                            )}
                            {dateInfo.isMakeUp && (
                                <span className="font-bold text-sm px-2 py-1 rounded border text-gray-600 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                                    補班日
                                </span>
                            )}
                            {dateInfo.familyName && (
                                <span className="font-bold text-sm px-2 py-1 rounded border text-purple-600 bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400">
                                    {dateInfo.familyName}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={`transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                        <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">時間</label>
                        <div className="flex items-center gap-1"><TimeSelect name="time" value={formData.time} onChange={handleChange} /><button type="button" onClick={()=>handleTimeReset('time')}><RotateCcw className="w-3 h-3 text-gray-400 dark:text-gray-500"/></button></div>
                    </div>
                </div>
                <div className={`bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-4 transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">天氣與氣溫</label>
                            {formData.weatherLocation && <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">({formData.weatherLocation})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => handleAutoWeather(formData.weatherSearchQuery)} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1.5 rounded border dark:border-gray-600 flex items-center gap-1 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shrink-0"><CloudSun className="w-3 h-3"/>自動抓取</button>
                            <input name="weatherSearchQuery" value={formData.weatherSearchQuery || ''} onChange={handleChange} placeholder="請輸入地名" className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs w-[100px] bg-white dark:bg-gray-700 dark:text-gray-200 outline-none focus:border-blue-400" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2 overflow-x-auto pb-1">{OPTIONS.WEATHER.map(w=><label key={w} className={`shrink-0 cursor-pointer px-3 py-1.5 rounded-md text-sm border ${formData.weather?.includes(w)?'bg-gray-200 font-bold text-gray-900 border-gray-300 dark:bg-gray-600 dark:text-white dark:border-gray-500':'bg-white dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}`}><input type="checkbox" className="hidden" checked={formData.weather?.includes(w)} onChange={()=>handleWeather(w)}/>{w}</label>)}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                                氣溫：
                            </span>
                            <div className="flex items-center gap-1 bg-white dark:bg-gray-700 p-1 rounded-lg border dark:border-gray-600 h-[40px]"><input name="weatherTempMin" value={formData.weatherTempMin} onChange={handleChange} className="w-14 text-center text-sm outline-none bg-transparent h-full dark:text-gray-200" placeholder="低"/><span>~</span><input name="weatherTempMax" value={formData.weatherTempMax} onChange={handleChange} className="w-14 text-center text-sm outline-none bg-transparent h-full dark:text-gray-200" placeholder="高"/><span className="text-xs pr-2 dark:text-gray-400">°C</span></div>
                        </div>
                    </div>
                </div>
                <div className={`md:col-span-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-4 transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                    <div className="space-y-2"><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">交接情形</label><RadioGroup name="handoverSituation" options={OPTIONS.HANDOVER} value={formData.handoverSituation} onChange={handleChange} color="gray" customInput={<input name="handoverSituationCustom" value={formData.handoverSituationCustom} onChange={handleChange} className="border-b border-gray-300 dark:border-gray-600 bg-transparent outline-none w-48 text-sm dark:text-gray-200" placeholder="說明" />}/></div>
                    <div className="space-y-2"><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">交接地點</label><RadioGroup name="location" options={OPTIONS.LOCATIONS} value={formData.location} onChange={handleChange} color="gray" customInput={<input name="locationCustom" value={formData.locationCustom} onChange={handleChange} className="border-b border-gray-300 dark:border-gray-600 bg-transparent outline-none w-48 text-sm dark:text-gray-200" placeholder="輸入地點" />}/></div>
                    <div><label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">交接物品</label><input name="handoverItems" value={formData.handoverItems} onChange={handleChange} className="w-full p-1 border-b border-gray-300 dark:border-gray-600 bg-transparent outline-none text-sm dark:text-gray-200"/></div>
                    <div>
                        <div className="flex gap-4 items-center"><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">包含過夜？</label><RadioGroup name="isOvernight" options={OPTIONS.IS_OVERNIGHT} value={formData.isOvernight} onChange={handleChange} color="gray"/></div>
                        {formData.isOvernight === '是' && (
                            <div className="mt-3">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">過夜日期</label>
                                <div className="flex flex-wrap items-center gap-2">
                                    <RocDateSelect value={formData.overnightStartDate} onChange={e=>handleChange({target:{name:'overnightStartDate',value:e.target.value}})} recordedDates={recordedDates}/>
                                    <span className="text-gray-400 dark:text-gray-500">~</span>
                                    <RocDateSelect value={formData.overnightEndDate} onChange={e=>handleChange({target:{name:'overnightEndDate',value:e.target.value}})} recordedDates={recordedDates}/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <TransportationBlock formData={formData} handleChange={handleChange} handleTimeReset={handleTimeReset} prefix="" className="md:col-span-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" isLocked={isLocked} />

                <div className={`md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                     <div className="flex justify-between items-center mb-2"><label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">🏠 小孩抵達記錄</label><button type="button" onClick={()=>listOps.add('childArrivalRecordsBasic', {time:'', location:'', locationCustom:''})} className="text-xs flex items-center gap-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded border dark:border-gray-600"><PlusCircle className="w-3 h-3"/> 新增</button></div>
                     <div className="space-y-3">
                        {formData.childArrivalRecordsBasic.length === 0 && <div className="text-gray-400 dark:text-gray-500 text-sm text-left pl-2 py-2 italic">目前無記錄</div>}
                        {formData.childArrivalRecordsBasic.map(r => (
                        <div key={r.id} className="relative bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                             <button type="button" onClick={()=>listOps.remove('childArrivalRecordsBasic', r.id)} className="absolute bottom-2 right-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-full z-10"><Trash2 className="w-4 h-4"/></button>
                             <div className="flex flex-wrap items-center gap-2 pr-8">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">小孩已於</span>
                                <TimeSelect value={r.time} onChange={e=>listOps.update('childArrivalRecordsBasic', r.id, 'time', e.target.value)} className="shrink-0 w-[130px]"/>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">抵達</span>
                                <div className="flex flex-wrap gap-2 items-center flex-1 w-full sm:w-auto mt-1 sm:mt-0">
                                    {OPTIONS.LOCATIONS.map(l=>(
                                        <React.Fragment key={l}>
                                            <label className="flex gap-1 items-center cursor-pointer dark:text-gray-300 whitespace-nowrap"><input type="radio" checked={r.location===l} onChange={()=>listOps.update('childArrivalRecordsBasic',r.id,'location',l)} onClick={e=>{if(r.location===l){listOps.update('childArrivalRecordsBasic',r.id,'location','');e.target.checked=false}}} className="text-gray-600 focus:ring-gray-500"/><span className="text-xs">{l}</span></label>
                                            {l === '其它' && r.location === '其它' && (
                                                <input value={r.locationCustom || ''} onChange={e=>listOps.update('childArrivalRecordsBasic', r.id, 'locationCustom', e.target.value)} placeholder="地點" className="flex-1 min-w-[80px] p-1 text-sm border-b border-gray-300 dark:border-gray-600 outline-none bg-transparent dark:text-gray-200"/>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                             </div>
                        </div>
                     ))}</div>
                </div>
            </div>
            )}
        </section>
    );
});

const SchoolSection = React.memo(({ formData, handleChange, handleTimeReset, listOps, onScrollTop, isLocked }) => {
    const hasData = Boolean(formData.schoolLeaveType || formData.schoolNotes || formData.schoolArrivalTime || formData.schoolDepartureTime || formData.childArrivalRecordsSchool?.length > 0 || formData.schoolDepartureTripTime || formData.schoolReturnTripTime || formData.schoolDepartureTripTransportation || formData.schoolReturnTripTransportation);
    const [isExpanded, toggle] = useSectionExpand('school', formData.date, hasData);

    return (
        <section id="school" className="scroll-mt-28 pt-4 border-t-2 border-gray-500">
            <SectionHeader id="school" title="學校接送資訊" icon={School} colorClass="text-indigo-600" bgClass="bg-indigo-50" onScrollTop={onScrollTop} isExpanded={isExpanded} onToggle={toggle}/>
            {isExpanded && (
            <div className={`mt-4 space-y-4 animate-fade-in transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900 space-y-4">
                    <div><label className="block font-bold text-indigo-900 dark:text-indigo-300 mb-2">假別</label><RadioGroup name="schoolLeaveType" options={OPTIONS.LEAVE_TYPES} value={formData.schoolLeaveType} onChange={handleChange} color="indigo" 
                        customInput={<input name="schoolLeaveOther" value={formData.schoolLeaveOther} onChange={handleChange} className="border-b border-indigo-300 dark:border-indigo-700 bg-transparent outline-none w-28 text-sm dark:text-gray-200" placeholder="說明"/>} />
                        {formData.schoolLeaveType==='事假'&&<input name="schoolLeavePersonalDesc" value={formData.schoolLeavePersonalDesc} onChange={handleChange} className="ml-2 border-b border-indigo-300 dark:border-indigo-700 bg-transparent outline-none w-28 text-sm dark:text-gray-200" placeholder="說明"/>}
                        {formData.schoolLeaveType==='病假'&&<input name="schoolLeaveSickDesc" value={formData.schoolLeaveSickDesc} onChange={handleChange} className="ml-2 border-b border-indigo-300 dark:border-indigo-700 bg-transparent outline-none w-28 text-sm dark:text-gray-200" placeholder="說明"/>}
                        {formData.schoolLeaveType==='半天'&&<input name="schoolLeaveHalfDayDesc" value={formData.schoolLeaveHalfDayDesc} onChange={handleChange} className="ml-2 border-b border-indigo-300 dark:border-indigo-700 bg-transparent outline-none w-28 text-sm dark:text-gray-200" placeholder="說明"/>}
                    </div>
                    <div className="border-t border-indigo-200 dark:border-indigo-800"></div>
                    <div className="grid md:grid-cols-2 gap-6 relative">
                        <div className="space-y-3"><div className="flex items-center gap-4"><span className="font-bold text-indigo-900 dark:text-indigo-300">到校上學</span><div className="flex items-center gap-1"><TimeSelect name="schoolArrivalTime" value={formData.schoolArrivalTime} onChange={handleChange}/><button type="button" onClick={()=>handleTimeReset('schoolArrivalTime')}><RotateCcw className="w-3 h-3 text-gray-400 dark:text-gray-500"/></button></div></div><RadioGroup name="schoolArrivalCompanion" options={OPTIONS.COMPANIONS} value={formData.schoolArrivalCompanion} onChange={handleChange} color="indigo"/></div>
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-indigo-200 dark:bg-indigo-800"></div>
                        <div className="space-y-3"><div className="flex items-center gap-4"><span className="font-bold text-indigo-900 dark:text-indigo-300">放學離開</span><div className="flex items-center gap-1"><TimeSelect name="schoolDepartureTime" value={formData.schoolDepartureTime} onChange={handleChange}/><button type="button" onClick={()=>handleTimeReset('schoolDepartureTime')}><RotateCcw className="w-3 h-3 text-gray-400 dark:text-gray-500"/></button></div></div><RadioGroup name="schoolDepartureCompanion" options={OPTIONS.COMPANIONS} value={formData.schoolDepartureCompanion} onChange={handleChange} color="indigo"/></div>
                    </div>
                    <div className="border-t border-indigo-200 dark:border-indigo-800"></div>
                    <div><label className="block font-bold text-indigo-900 dark:text-indigo-300 mb-2">校方的話</label><input name="schoolNotes" value={formData.schoolNotes} onChange={handleChange} className="w-full p-1 border-b border-indigo-300 dark:border-indigo-700 bg-transparent outline-none text-sm placeholder-gray-400 dark:text-gray-200" placeholder="老師交代事項"/></div>
                </div>
                
                <TransportationBlock formData={formData} handleChange={handleChange} handleTimeReset={handleTimeReset} prefix="school" className="bg-indigo-50 dark:bg-indigo-950 border-indigo-100 dark:border-indigo-900" isLocked={isLocked} />
                
                <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900">
                    <div className="flex justify-between items-center mb-2"><label className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">🏠 小孩抵達記錄</label><button type="button" onClick={()=>listOps.add('childArrivalRecordsSchool', {time:'', location:'', locationCustom:''})} className="text-xs flex items-center gap-1 bg-indigo-200 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded"><PlusCircle className="w-3 h-3"/> 新增</button></div>
                    <div className="space-y-3">{formData.childArrivalRecordsSchool.map(r => (
                        <div key={r.id} className="relative bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-800/50">
                            <button type="button" onClick={()=>listOps.remove('childArrivalRecordsSchool', r.id)} className="absolute bottom-2 right-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-full z-10"><Trash2 className="w-4 h-4"/></button>
                            <div className="flex flex-wrap items-center gap-2 pr-8">
                                <span className="text-sm font-bold text-blue-900 dark:text-blue-300 whitespace-nowrap">小孩已於</span>
                                <TimeSelect value={r.time} onChange={e=>listOps.update('childArrivalRecordsSchool', r.id, 'time', e.target.value)} className="shrink-0 w-[130px]"/>
                                <span className="text-sm font-bold text-blue-900 dark:text-blue-300 whitespace-nowrap">抵達</span>
                                <div className="flex flex-wrap gap-2 items-center flex-1 w-full sm:w-auto mt-1 sm:mt-0">
                                    {OPTIONS.LOCATIONS.map(l=>(
                                        <React.Fragment key={l}>
                                            <label className="flex gap-1 items-center cursor-pointer dark:text-gray-300 whitespace-nowrap"><input type="radio" checked={r.location===l} onChange={()=>listOps.update('childArrivalRecordsSchool',r.id,'location',l)} onClick={e=>{if(r.location===l){listOps.update('childArrivalRecordsSchool',r.id,'location','');e.target.checked=false}}} className="text-blue-600"/><span className="text-xs">{l}</span></label>
                                            {l === '其它' && r.location === '其它' && (
                                                <input value={r.locationCustom || ''} onChange={e=>listOps.update('childArrivalRecordsSchool', r.id, 'locationCustom', e.target.value)} placeholder="地點" className="flex-1 min-w-[80px] p-1 text-sm border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent dark:text-gray-200"/>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>))}
                    </div>
                </div>
            </div>
            )}
        </section>
    );
});

const ActivitySection = React.memo(({ formData, handleChange, handleTimeReset, listOps, onScrollTop, isLocked }) => {
    const hasOutdoor = Array.isArray(formData.activityRecords) && formData.activityRecords.some(a => a.type === '戶外');
    const hasData = Boolean(formData.activityRecords?.length > 0 || formData.childArrivalRecordsActivity?.length > 0 || formData.activityDepartureTripTime || formData.activityDepartureTripTransportation || formData.activityReturnTripTime || formData.activityReturnTripTransportation);
    const [isExpanded, toggle] = useSectionExpand('activity', formData.date, hasData);
    
    return (
        <section id="activity" className="scroll-mt-28 pt-4 border-t-2 border-gray-500">
            <SectionHeader id="activity" title="活動記錄" icon={PawPrint} colorClass="text-fuchsia-600" bgClass="bg-fuchsia-50" onScrollTop={onScrollTop} isExpanded={isExpanded} onToggle={toggle}/>
            {isExpanded && (
            <div className={`mt-4 space-y-4 animate-fade-in transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                <div className="bg-fuchsia-50 dark:bg-fuchsia-950 p-4 rounded-lg border border-fuchsia-100 dark:border-fuchsia-900">
                    <div className="flex justify-between items-center mb-2"><span className="font-bold text-fuchsia-800 dark:text-fuchsia-200">活動列表</span><button type="button" onClick={()=>listOps.add('activityRecords', {time:getCurrentTime(), location:'', type:'室內', content:''})} className="bg-fuchsia-200 dark:bg-fuchsia-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-fuchsia-900 dark:text-fuchsia-200"><PlusCircle className="w-3 h-3"/> 新增</button></div>
                    {(formData.activityRecords || []).map(i => (
                        <div key={i.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-fuchsia-200 dark:border-fuchsia-900/50 mb-3 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between">
                                <TimeSelect value={i.time} onChange={e=>listOps.update('activityRecords', i.id, 'time', e.target.value)} className="w-[130px] flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-[40px] focus-within:ring-2 focus-within:ring-fuchsia-300"/>
                                <button type="button" onClick={()=>listOps.remove('activityRecords', i.id)} className="text-red-500 hover:bg-red-50 p-2 rounded shrink-0"><Trash2 className="w-4 h-4"/></button>
                            </div>
                            <input value={i.location || ''} onChange={e=>listOps.update('activityRecords', i.id, 'location', e.target.value)} placeholder="地點" className="w-full p-1 text-sm border-b border-fuchsia-300 dark:border-fuchsia-700 outline-none bg-transparent dark:text-gray-200" />
                            <div className="flex flex-col gap-2">
                                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-[40px] shrink-0 self-start">{OPTIONS.ACTIVITY_TYPES.map(type => (<button type="button" key={type} onClick={() => listOps.update('activityRecords', i.id, 'type', type)} className={`px-3 text-xs rounded-md transition-all h-full ${i.type === type ? 'bg-white dark:bg-gray-600 shadow text-fuchsia-600 dark:text-fuchsia-300 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{type}</button>))}</div>
                                <input value={i.content || ''} onChange={e=>listOps.update('activityRecords', i.id, 'content', e.target.value)} placeholder="活動內容" className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-fuchsia-400 outline-none h-[40px] min-w-0 dark:text-gray-200" />
                            </div>
                        </div>
                    ))}
                </div>
                
                {hasOutdoor && (
                    <div className="space-y-4 animate-fade-in">
                        <TransportationBlock formData={formData} handleChange={handleChange} handleTimeReset={handleTimeReset} prefix="activity" className="bg-fuchsia-50 dark:bg-fuchsia-950 border-fuchsia-100 dark:border-fuchsia-900" isLocked={isLocked} />
                        <div className="bg-fuchsia-50 dark:bg-fuchsia-950 p-4 rounded-lg border border-fuchsia-100 dark:border-fuchsia-900">
                             <div className="flex justify-between items-center mb-2"><label className="font-bold text-fuchsia-900 dark:text-fuchsia-200 flex items-center gap-1">🏠 小孩抵達記錄</label><button type="button" onClick={()=>listOps.add('childArrivalRecordsActivity', {time:'', location:'', locationCustom:''})} className="text-xs flex items-center gap-1 bg-fuchsia-200 dark:bg-fuchsia-900/50 text-fuchsia-800 dark:text-fuchsia-300 px-2 py-1 rounded"><PlusCircle className="w-3 h-3"/> 新增</button></div>
                             <div className="space-y-3">
                                {(formData.childArrivalRecordsActivity || []).length === 0 && <div className="text-gray-400 dark:text-gray-500 text-sm text-left pl-2 py-2 italic">目前無記錄</div>}
                                {(formData.childArrivalRecordsActivity || []).map(r => (
                                <div key={r.id} className="relative bg-white dark:bg-gray-800 p-2 rounded border border-fuchsia-200 dark:border-fuchsia-800/50">
                                     <button type="button" onClick={()=>listOps.remove('childArrivalRecordsActivity', r.id)} className="absolute bottom-2 right-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-full z-10"><Trash2 className="w-4 h-4"/></button>
                                     <div className="flex flex-wrap items-center gap-2 pr-8">
                                        <span className="text-sm font-bold text-fuchsia-900 dark:text-fuchsia-300 whitespace-nowrap">小孩已於</span>
                                        <TimeSelect value={r.time} onChange={e=>listOps.update('childArrivalRecordsActivity', r.id, 'time', e.target.value)} className="shrink-0 w-[130px] focus-within:ring-fuchsia-300"/>
                                        <span className="text-sm font-bold text-fuchsia-900 dark:text-fuchsia-300 whitespace-nowrap">抵達</span>
                                        <div className="flex flex-wrap gap-2 items-center flex-1 w-full sm:w-auto mt-1 sm:mt-0">
                                            {OPTIONS.LOCATIONS.map(l=>(
                                                <React.Fragment key={l}>
                                                    <label className="flex gap-1 items-center cursor-pointer dark:text-gray-300 whitespace-nowrap"><input type="radio" checked={r.location===l} onChange={()=>listOps.update('childArrivalRecordsActivity',r.id,'location',l)} onClick={e=>{if(r.location===l){listOps.update('childArrivalRecordsActivity',r.id,'location','');e.target.checked=false}}} className="text-fuchsia-600 focus:ring-fuchsia-500"/><span className="text-xs">{l}</span></label>
                                                    {l === '其它' && r.location === '其它' && (
                                                        <input value={r.locationCustom || ''} onChange={e=>listOps.update('childArrivalRecordsActivity', r.id, 'locationCustom', e.target.value)} placeholder="地點" className="flex-1 min-w-[80px] p-1 text-sm border-b border-fuchsia-300 dark:border-fuchsia-700 outline-none bg-transparent dark:text-gray-200"/>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                     </div>
                                </div>
                             ))}</div>
                        </div>
                    </div>
                )}
            </div>
            )}
        </section>
    );
});

const DiningSection = React.memo(({ formData, handleChange, listOps, onScrollTop, handlers, isLocked }) => {
    const hasData = Boolean(formData.mealBreakfast || formData.mealLunch || formData.mealDinner || formData.snackRecords?.length > 0 || formData.lunchReferToSchool || formData.snackReferToSchool || formData.appetiteBreakfast || formData.waterBreakfast || formData.appetiteLunch || formData.waterLunch || formData.appetiteDinner || formData.waterDinner);
    const [isExpanded, toggle] = useSectionExpand('food', formData.date, hasData);

    return (
        <section id="food" className="scroll-mt-28 pt-4 border-t-2 border-gray-500">
            <SectionHeader id="food" title="飲食與點心" icon={Utensils} colorClass="text-green-600" bgClass="bg-green-50" onScrollTop={onScrollTop} isExpanded={isExpanded} onToggle={toggle}/>
            {isExpanded && (
            <div className={`mt-4 space-y-4 animate-fade-in transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                
                <MealBlock title="早餐" mealType="Breakfast" formData={formData} handleChange={handleChange} handlers={handlers} />
                
                <MealBlock 
                    title="午餐" 
                    mealType="Lunch" 
                    formData={formData} 
                    handleChange={handleChange} 
                    handlers={handlers} 
                    isFaded={formData.lunchReferToSchool}
                    referCheckbox={
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" name="lunchReferToSchool" checked={formData.lunchReferToSchool} onChange={handleChange} className="w-3 h-3 text-green-600"/>
                            <span className="text-xs text-blue-600 dark:text-blue-400">參考學校聯絡簿</span>
                        </label>
                    }
                />
                
                <MealBlock title="晚餐" mealType="Dinner" formData={formData} handleChange={handleChange} handlers={handlers} />

                {/* 點心區塊 */}
                <div className="bg-[#f1f6f3] dark:bg-green-950 p-4 rounded-lg border border-green-100 dark:border-green-900">
                    <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-3"><span className="text-base font-bold text-green-800 dark:text-green-300">點心</span><label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" name="snackReferToSchool" checked={formData.snackReferToSchool} onChange={handleChange} className="w-3 h-3 text-green-600"/><span className="text-xs text-blue-600 dark:text-blue-400">參考學校聯絡簿</span></label></div><button type="button" onClick={()=>listOps.add('snackRecords', {time:'', content:'', appetite:'', water:''})} className="bg-green-200 dark:bg-green-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-green-800 dark:text-green-300"><PlusCircle className="w-3 h-3"/> 新增</button></div>
                    {formData.snackRecords.map(s => (
                        <div key={s.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-800/50 mb-3 flex flex-col gap-3 relative shadow-sm">
                            <button type="button" onClick={()=>listOps.resetFields('snackRecords', s.id, ['time', 'content', 'appetite', 'water'])} className="absolute top-3 right-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full transition-colors"><RotateCcw className="w-4 h-4"/></button>
                            <button type="button" onClick={()=>listOps.remove('snackRecords', s.id)} className="absolute top-3 right-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-full transition-colors"><Trash2 className="w-4 h-4"/></button>
                            
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pr-16">
                                <div className="flex flex-col gap-1"><span className="text-sm font-bold text-gray-600 dark:text-gray-400 block">時間</span><TimeSelect value={s.time} onChange={e=>listOps.update('snackRecords', s.id, 'time', e.target.value)}/></div>
                                <div className="flex flex-nowrap gap-x-6">
                                     <div className="flex flex-col gap-1"><span className="text-sm font-bold text-gray-600 dark:text-gray-400">食慾</span><select value={s.appetite || ''} onChange={e=>listOps.update('snackRecords', s.id, 'appetite', e.target.value)} className="border rounded-lg h-[40px] w-full min-w-[80px] bg-white dark:bg-gray-800 dark:border-gray-600"><option value="" disabled>請選擇</option>{OPTIONS.APPETITE.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                                     <div className="flex flex-col gap-1"><span className="text-sm font-bold text-gray-600 dark:text-gray-400">飲水</span><select value={s.water || ''} onChange={e=>listOps.update('snackRecords', s.id, 'water', e.target.value)} className="border rounded-lg h-[40px] w-full min-w-[80px] bg-white dark:bg-gray-800 dark:border-gray-600"><option value="" disabled>請选择</option>{OPTIONS.WATER.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                                </div>
                            </div>
                            <input value={s.content || ''} onChange={e=>listOps.update('snackRecords', s.id, 'content', e.target.value)} autoComplete="off" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 outline-none text-sm focus:border-green-500 transition-colors dark:text-gray-200" placeholder="點心內容"/>
                        </div>
                    ))}
                </div>
            </div>
            )}
        </section>
    );
});

const SleepSection = React.memo(({ formData, handleChange, handleTimeReset, listOps, showToast, scrollToElement, onScrollTop, handlers, isLocked }) => {
    const hasData = Boolean(formData.sleepLastNight || formData.sleepWakeUp || formData.sleepBedtime || formData.sleepAwakeRecords?.length > 0 || formData.napRecords?.length > 0 || formData.breastfeedingTimes?.length > 0 || formData.sleepActualTime || formData.sleepActualReason || formData.isWakeUpBreastfeeding || formData.isBedtimeBreastfeeding || formData.napReferToSchool);
    const [isExpanded, toggle] = useSectionExpand('sleep', formData.date, hasData);

    return (
        <section id="sleep" className="scroll-mt-28 pt-4 border-t-2 border-gray-500">
            <SectionHeader id="sleep" title="睡眠與哺乳" icon={Moon} colorClass="text-purple-600" bgClass="bg-purple-50" onScrollTop={onScrollTop} isExpanded={isExpanded} onToggle={toggle}/>
            {isExpanded && (
            <div className={`mt-4 grid md:grid-cols-2 gap-4 animate-fade-in transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                 <div className="md:col-span-2 bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-100 dark:border-purple-900 flex flex-col gap-4">
                    <div><span className="font-bold text-purple-800 dark:text-purple-200 block mb-1">昨晚就寢時間</span><div className="flex gap-1"><TimeSelect name="sleepLastNight" value={formData.sleepLastNight} onChange={handleChange}/><button type="button" onClick={()=>handleTimeReset('sleepLastNight')}><RotateCcw className="w-3 h-3 text-gray-400 dark:text-gray-500"/></button></div></div>
                    <div className="border-t border-purple-200 dark:border-purple-800"></div>
                    <div>
                        <div className="flex justify-between items-center mb-2"><span className="font-bold text-purple-800 dark:text-purple-200">夜醒記錄</span><button type="button" onClick={()=>listOps.add('sleepAwakeRecords', {time:'', asleepTime:'', reason:'', isBreastfeeding:false})} className="bg-purple-200 dark:bg-purple-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-purple-800 dark:text-purple-200"><PlusCircle className="w-3 h-3"/> 新增</button></div>
                        {formData.sleepAwakeRecords.length === 0 && <div className="text-gray-400 dark:text-gray-500 text-sm text-left pl-2 py-2 italic">目前無記錄</div>}
                        {formData.sleepAwakeRecords.map(i => (
                            <div key={i.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-800/50 mb-2">
                                <div className="flex flex-wrap gap-2 items-center min-w-0"><div className="flex items-center gap-1"><span className="text-sm dark:text-gray-300">醒</span><TimeSelect value={i.time} onChange={e=>listOps.update('sleepAwakeRecords', i.id, 'time', e.target.value)}/></div><div className="flex items-center gap-1"><span className="text-sm dark:text-gray-300">睡</span><TimeSelect value={i.asleepTime} onChange={e=>listOps.update('sleepAwakeRecords', i.id, 'asleepTime', e.target.value)}/></div></div>
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:flex-1">
                                    <input value={i.reason || ''} onChange={e=>listOps.update('sleepAwakeRecords', i.id, 'reason', e.target.value)} className="flex-1 border-b text-sm outline-none min-w-[100px] bg-transparent dark:text-gray-200 dark:border-gray-600" placeholder="原因"/>
                                    <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                                        <input type="checkbox" checked={i.isBreastfeeding || false} onChange={e => { 
                                            handlers.toggleAwakeBreastfeeding(i.id, e.target.checked, i.time || getCurrentTime()); 
                                            if(e.target.checked) { showToast('已自動新增親餵記錄', 'success'); scrollToElement('breastfeeding-list'); }
                                            else { showToast('已移除關聯的親餵記錄', 'info'); } 
                                        }} className="w-3 h-3 text-pink-500"/>
                                        <span className="text-xs text-pink-600 dark:text-pink-300">親餵</span>
                                    </label>
                                    <button type="button" onClick={()=>listOps.remove('sleepAwakeRecords', i.id)} className="text-red-400 dark:text-red-300 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
                 <div className="md:col-span-2 bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900 flex flex-col gap-4">
                     <div>
                         <div className="flex gap-4 mb-1">
                             <span className="font-bold text-yellow-800 dark:text-yellow-200">早上起床時間</span>
                             <label className="flex items-center gap-1 cursor-pointer">
                                 <input type="checkbox" name="isWakeUpBreastfeeding" checked={formData.isWakeUpBreastfeeding} onChange={(e) => { 
                                     handlers.toggleWakeUpBreastfeeding(e.target.checked, formData.sleepWakeUp); 
                                     if(e.target.checked) { showToast('已自動新增親餵記錄', 'success'); scrollToElement('breastfeeding-list'); } 
                                     else { showToast('已移除關聯的親餵記錄', 'info'); } 
                                 }} className="w-3 h-3 text-pink-500"/>
                                 <span className="text-xs text-pink-600 dark:text-pink-300">親餵</span>
                             </label>
                         </div>
                         <TimeSelect name="sleepWakeUp" value={formData.sleepWakeUp} onChange={handleChange}/>
                     </div>
                     <div className="border-t border-yellow-200 dark:border-yellow-800"></div>
                     <div id="nap-list" className="scroll-mt-32">
                         <div className="flex flex-row items-center justify-between gap-2 mb-2"><div className="flex items-center gap-3"><span className="font-bold text-yellow-800 dark:text-yellow-200">午休、小睡時間</span></div><button type="button" onClick={()=>listOps.add('napRecords', {startTime:'', endTime:'', isNotAsleep:false, isBreastfeeding:false, reason:''})} className="bg-yellow-200 dark:bg-yellow-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-yellow-900 dark:text-yellow-200 shrink-0"><PlusCircle className="w-3 h-3"/> 新增</button></div>
                         {formData.napRecords.map(i => (
                             <div key={i.id} className="relative bg-white dark:bg-gray-800 p-2 rounded border border-yellow-200 dark:border-yellow-900/50 mb-2 flex flex-col gap-2">
                                 <button type="button" onClick={() => { if(i.source === 'breastfeeding-list') scrollToElement('breastfeeding-list'); listOps.remove('napRecords', i.id); }} className="absolute top-2 right-2 text-red-400 dark:text-red-300 z-10"><Trash2 className="w-4 h-4"/></button>
                                 <div className="flex items-center gap-2 flex-wrap pr-8"><div className="flex items-center gap-2"><span className="text-sm text-gray-500 dark:text-gray-400">起</span><TimeSelect value={i.startTime} onChange={e=>listOps.update('napRecords', i.id, 'startTime', e.target.value)}/></div><div className="flex items-center gap-2"><span className="text-sm text-gray-500 dark:text-gray-400">迄</span><TimeSelect value={i.endTime} onChange={e=>listOps.update('napRecords', i.id, 'endTime', e.target.value)}/></div></div>
                                 <div className="flex items-center justify-between w-full flex-wrap gap-2">
                                     <div className="flex items-center gap-3 flex-wrap">
                                         <label className="flex items-center gap-1 cursor-pointer">
                                             <input type="checkbox" checked={i.isBreastfeeding || false} onChange={e => { 
                                                 handlers.toggleNapBreastfeeding(i.id, e.target.checked, i.startTime || getCurrentTime(), i.isNap); 
                                                 if (e.target.checked) { showToast('已自動新增親餵記錄', 'success'); scrollToElement('breastfeeding-list'); } 
                                                 else { showToast('已移除關聯的親餵記錄', 'info'); } 
                                         }} className="w-3 h-3 text-pink-500"/>
                                         <span className="text-xs text-pink-600 dark:text-pink-300">親餵</span>
                                         </label>
                                         <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={i.isNap || false} onChange={e => { handlers.toggleNapIsNap(i.id, e.target.checked); if (i.isBreastfeeding) { showToast(e.target.checked ? '同步勾選親餵列表的「小睡」' : '同步取消親餵列表的「小睡」', 'info'); } }} className="w-3 h-3 text-yellow-600"/><span className="text-xs text-yellow-600 dark:text-yellow-400">小睡</span></label>
                                         <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={i.isNotAsleep || false} onChange={e=>listOps.update('napRecords', i.id, 'isNotAsleep', e.target.checked)} className="w-3 h-3"/><span className="text-xs text-gray-500 dark:text-gray-400">沒睡著</span></label>
                                         {i.isNotAsleep && <input value={i.reason || ''} onChange={e=>listOps.update('napRecords', i.id, 'reason', e.target.value)} className="w-24 border-b text-xs outline-none bg-transparent dark:text-gray-200 dark:border-gray-500 min-w-[60px]" placeholder="原因"/>}
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
                 
                 <div className="md:col-span-2 bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-100 dark:border-purple-900 flex flex-col gap-4 min-w-0">
                     <div className="flex flex-col md:flex-row gap-6">
                         <div>
                             <div className="flex gap-4 mb-1">
                                 <span className="font-bold text-purple-800 dark:text-purple-200">晚上就寢時間</span>
                                 <label className="flex items-center gap-1 cursor-pointer">
                                     <input type="checkbox" name="isBedtimeBreastfeeding" checked={formData.isBedtimeBreastfeeding} onChange={(e) => { 
                                         handlers.toggleBedtimeBreastfeeding(e.target.checked, formData.sleepBedtime); 
                                         if(e.target.checked) { showToast('已自動新增親餵記錄', 'success'); scrollToElement('breastfeeding-list'); } 
                                         else { showToast('已移除關聯的親餵記錄', 'info'); } 
                                     }} className="w-3 h-3 text-pink-500"/>
                                     <span className="text-xs text-pink-600 dark:text-pink-300">親餵</span>
                                 </label>
                             </div>
                             <TimeSelect name="sleepBedtime" value={formData.sleepBedtime} onChange={handleChange}/>
                         </div>
                         <div><span className="font-bold text-purple-800 dark:text-purple-200 block mb-1">實際入睡時間</span><div className="flex gap-2 flex-wrap"><TimeSelect name="sleepActualTime" value={formData.sleepActualTime} onChange={handleChange}/><input name="sleepActualReason" value={formData.sleepActualReason} onChange={handleChange} className="border-b border-purple-300 dark:border-purple-700 bg-transparent outline-none w-24 text-sm dark:text-gray-200 min-w-[100px]" placeholder="原因"/></div></div>
                     </div>
                 </div>

                 <div id="breastfeeding-list" className="md:col-span-2 bg-pink-50 dark:bg-pink-950 p-4 rounded-lg border border-pink-100 dark:border-pink-900">
                    <div className="flex justify-between items-center mb-2"><span className="font-bold text-pink-600 dark:text-pink-300">親餵哺乳</span><button type="button" onClick={()=>listOps.add('breastfeedingTimes', {time:getCurrentTime(), isNap:false})} className="bg-pink-200 dark:bg-pink-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-pink-900 dark:text-pink-200"><PlusCircle className="w-3 h-3"/> 新增</button></div>
                    <div className="flex flex-wrap gap-3">{formData.breastfeedingTimes.map(i => (
                        <div key={i.id} className="flex items-center bg-white dark:bg-gray-800 rounded-full px-3 py-1.5 shadow-sm border border-pink-200 dark:border-pink-900/50">
                            <TimeSelect value={i.time} onChange={e=>listOps.update('breastfeedingTimes', i.id, 'time', e.target.value)} className="border-none w-[120px] text-sm"/>
                            <label className="flex items-center gap-1 cursor-pointer ml-2">
                                <input type="checkbox" checked={i.isNap || false} onChange={e => { 
                                    handlers.toggleBreastfeedingNap(i.id, e.target.checked, i.time); 
                                    if (i.source === 'nap-list') {
                                        showToast(e.target.checked ? '同步勾選午休列表的「小睡」' : '同步取消午休列表的「小睡」', 'info');
                                    } else {
                                        if (e.target.checked) { 
                                            showToast('已自動新增小睡記錄', 'success'); 
                                            scrollToElement('nap-list'); 
                                        } else { 
                                            showToast('同步取消午休列表中的「小睡」標記', 'info'); 
                                        }
                                    }
                                }} className="w-3 h-3 text-pink-500"/>
                                <span className="text-xs text-pink-600 dark:text-pink-300">小睡</span>
                            </label>
                            <button type="button" onClick={() => { if(i.source === 'nap-list') scrollToElement('nap-list'); listOps.remove('breastfeedingTimes', i.id); }} className="ml-2 text-pink-400 dark:text-pink-300"><X className="w-3 h-3"/></button>
                        </div>
                    ))}</div>
                 </div>
            </div>
            )}
        </section>
    );
});

const PhysiologySection = React.memo(({ formData, handleChange, listOps, showToast, scrollToElement, onScrollTop, handlers, isLocked }) => {
    const hasData = Boolean(formData.bowelMovements?.length > 0 || formData.emotionRecords?.length > 0 || formData.bowelReferToSchool || formData.isNoBowelMovement);
    const [isExpanded, toggle] = useSectionExpand('physiology', formData.date, hasData);

    return (
        <section id="physiology" className="scroll-mt-28 pt-4 border-t-2 border-gray-500">
            <SectionHeader id="physiology" title="生理與情緒" icon={Smile} colorClass="text-amber-600" bgClass="bg-amber-50" onScrollTop={onScrollTop} isExpanded={isExpanded} onToggle={toggle}/>
            {isExpanded && (
            <div className={`mt-4 space-y-4 animate-fade-in transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                {/* 排便記錄區塊 */}
                <div id="bowel-list" className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-100 dark:border-orange-900">
                    <div className="flex flex-col gap-2 mb-2">
                        <div className="flex justify-between items-center w-full"><span className="font-bold text-orange-800 dark:text-orange-200 flex items-center gap-1"><span className="text-xl">💩</span>排便記錄</span><button type="button" onClick={()=>listOps.add('bowelMovements', {time:'', type:'正常'})} className="bg-orange-200 dark:bg-orange-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-orange-900 dark:text-orange-200"><PlusCircle className="w-3 h-3"/> 新增</button></div>
                        <div className="w-full text-left">
                             <label className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" name="bowelReferToSchool" checked={formData.bowelReferToSchool} onChange={handleChange} className="w-3 h-3 text-orange-600"/>
                                <span className="text-xs text-blue-600 dark:text-blue-300">參考學校聯絡簿</span>
                            </label>
                        </div>
                        <div className="w-full text-left"><label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" name="isNoBowelMovement" checked={formData.isNoBowelMovement} onChange={handleChange} className="w-3 h-3 text-red-600"/><span className="text-xs text-red-500 dark:text-red-400">本日無排便</span></label></div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">{formData.bowelMovements.map(i => (
                        <div key={i.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border border-orange-200 dark:border-orange-900/50">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <TimeSelect value={i.time} onChange={e=>listOps.update('bowelMovements', i.id, 'time', e.target.value)} className="w-[130px] shrink-0 flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-[40px] focus-within:ring-2 focus-within:ring-orange-300"/>
                                <button type="button" onClick={() => listOps.remove('bowelMovements', i.id)} className="text-red-500 dark:text-red-400 sm:hidden ml-auto"><Trash2 className="w-4 h-4"/></button>
                            </div>
                            <div className="grid grid-cols-[90px_1fr] sm:flex sm:flex-wrap gap-x-1 gap-y-3 sm:gap-3 items-center flex-1 py-1 w-full min-w-0">
                                {OPTIONS.BOWEL_TYPES.map(type => (
                                    <label key={type} className="flex items-center gap-1 cursor-pointer select-none hover:text-orange-800 dark:hover:text-orange-300 text-gray-700 dark:text-gray-300 min-w-0">
                                        <input 
                                            type="radio" 
                                            name={`bowel-${i.id}`} 
                                            value={type} 
                                            checked={i.type === type} 
                                            onChange={() => {
                                                const prevType = i.type;
                                                handlers.updateBowelType(i.id, type); 
                                                if (type === '拉肚子/腸胃炎') { 
                                                    showToast('已自動新增不適症狀：拉肚子/腸胃炎', 'success'); 
                                                    scrollToElement('symptom-list'); 
                                                } else if (prevType === '拉肚子/腸胃炎' && type !== '拉肚子/腸胃炎') {
                                                    showToast('已自動移除關聯的不適症狀', 'info');
                                                }
                                            }} 
                                            className="text-orange-600 focus:ring-orange-500 shrink-0" 
                                        />
                                        <span className="text-[13px] sm:text-sm tracking-tight sm:tracking-normal leading-tight">{type}</span>
                                    </label>
                                ))}
                            </div>
                            <button type="button" onClick={() => listOps.remove('bowelMovements', i.id)} className="text-red-500 dark:text-red-400 hidden sm:block ml-auto shrink-0"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    ))}</div>
                </div>

                {/* 情緒記錄區塊 */}
                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-100 dark:border-amber-900">
                    <div className="flex justify-between items-center mb-2"><span className="font-bold text-amber-800 dark:text-amber-200">情緒與行為</span><button type="button" onClick={()=>listOps.add('emotionRecords', {time:getCurrentTime(), mood:'開心', note:''})} className="bg-amber-200 dark:bg-amber-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-amber-900 dark:text-amber-200"><PlusCircle className="w-3 h-3"/> 新增</button></div>
                    {formData.emotionRecords.length === 0 && <div className="text-gray-400 dark:text-gray-500 text-sm text-left pl-2 py-2 italic">目前無記錄</div>}
                    {formData.emotionRecords.map(i => (
                        <div key={i.id} className="flex flex-col sm:flex-row gap-2 items-start bg-white dark:bg-gray-800 p-2 rounded border border-amber-200 dark:border-amber-900/50 mb-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <TimeSelect 
                                    value={i.time} 
                                    onChange={e=>listOps.update('emotionRecords', i.id, 'time', e.target.value)}
                                    className="w-[130px] h-[40px] shrink-0" 
                                />
                                <select value={i.mood} onChange={e=>listOps.update('emotionRecords', i.id, 'mood', e.target.value)} className="p-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 w-[130px] h-[40px]">
                                    {OPTIONS.MOODS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-1 items-center gap-2 w-full min-w-0"><input value={i.note || ''} onChange={e=>listOps.update('emotionRecords', i.id, 'note', e.target.value)} className="flex-1 border-b outline-none text-sm p-1 min-w-0 bg-transparent dark:text-gray-200 dark:border-gray-600" placeholder="備註"/><button type="button" onClick={()=>listOps.remove('emotionRecords', i.id)} className="text-red-500 dark:text-red-400 ml-auto shrink-0"><Trash2 className="w-4 h-4"/></button></div>
                        </div>
                    ))}
                </div>
            </div>
            )}
        </section>
    );
});

const HealthSection = React.memo(({ formData, handleChange, listOps, showToast, scrollToElement, onScrollTop, handlers, isLocked }) => {
    const hasData = Boolean(formData.healthCardStatus || formData.oralCareRecords?.length > 0 || formData.symptoms?.length > 0 || formData.injuryRecords?.length > 0 || formData.medications?.length > 0 || formData.medicalLocations?.length > 0 || formData.healthCheckRecords?.length > 0 || formData.oralCareReferToSchool);
    const [isExpanded, toggle] = useSectionExpand('health', formData.date, hasData);

    return (
        <section id="health" className="scroll-mt-28 pt-4 border-t-2 border-gray-500">
            <SectionHeader id="health" title="健康與醫療" icon={HeartPlus} colorClass="text-teal-600" bgClass="bg-teal-50" onScrollTop={onScrollTop} isExpanded={isExpanded} onToggle={toggle}/>
            {isExpanded && (
            <div className={`mt-4 space-y-4 animate-fade-in transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"><label className="block text-sm font-bold mb-2 dark:text-gray-200">健保卡確認</label><RadioGroup name="healthCardStatus" options={OPTIONS.HEALTH_CARD} value={formData.healthCardStatus} onChange={handleChange} /></div>
                
                <div className="bg-teal-50 dark:bg-teal-950 p-4 rounded-lg border border-teal-100 dark:border-teal-900">
                    <div className="flex justify-between items-start sm:items-center mb-2 gap-2 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-bold text-teal-800 dark:text-teal-200">口腔保健</span>
                            <label className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" name="oralCareReferToSchool" checked={formData.oralCareReferToSchool} onChange={handleChange} className="w-3 h-3"/>
                                <span className="text-xs text-blue-600 dark:text-blue-300">參考學校聯絡簿</span>
                            </label>
                        </div>
                        <button type="button" onClick={()=>listOps.add('oralCareRecords', {time:'晚上', type:'刷牙'})} className="bg-teal-200 dark:bg-teal-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-teal-800 dark:text-teal-200 shrink-0"><PlusCircle className="w-3 h-3"/> 新增</button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">{formData.oralCareRecords.map(i => (<div key={i.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border border-teal-200 dark:border-teal-900/50"><select value={i.time} onChange={e=>listOps.update('oralCareRecords', i.id, 'time', e.target.value)} className="border rounded text-sm p-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 flex-1 min-w-[4rem]">
                            {OPTIONS.ORAL_TIMES.map(o=><option key={o} value={o}>{o}</option>)}
                        </select><select value={i.type} onChange={e=>listOps.update('oralCareRecords', i.id, 'type', e.target.value)} className="border rounded text-sm p-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 flex-1 min-w-[4rem]">{OPTIONS.ORAL_TYPES.map(o=><option key={o} value={o}>{o}</option>)}</select><button type="button" onClick={()=>listOps.remove('oralCareRecords', i.id)} className="text-red-500 dark:text-red-400 ml-auto"><Trash2 className="w-4 h-4"/></button></div>))}</div>
                </div>
                <SymptomList symptoms={formData.symptoms} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} handlers={handlers} />
                <InjuryList injuryRecords={formData.injuryRecords} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} handlers={handlers} />
                <MedicationList medications={formData.medications} listOps={listOps} scrollToElement={scrollToElement} handlers={handlers}/>
                <MedicalLocationList medicalLocations={formData.medicalLocations} listOps={listOps} scrollToElement={scrollToElement} handlers={handlers}/>
                <HealthCheckList records={formData.healthCheckRecords} listOps={listOps} />
            </div>
            )}
        </section>
    );
});

const NotesSection = React.memo(({ formData, handleChange, onScrollTop, generatedText, onCopy, copySuccess, isLocked }) => {
    // 全域資料判斷：只要整個表單有任何輸入，就回傳 true
    const globalHasData = useMemo(() => {
        const ignoredKeys = ['date', 'weatherSearchQuery', 'isLocked', 'lastUpdated'];
        for (const key in formData) {
            if (ignoredKeys.includes(key)) continue;
            const val = formData[key];
            if (Array.isArray(val) && val.length > 0) return true;
            if (typeof val === 'string' && val.trim() !== '') return true;
            if (typeof val === 'boolean' && val === true) return true;
        }
        return false;
    }, [formData]);

    const [isExpanded, toggle] = useSectionExpand('notes', formData.date, globalHasData);

    // --- 新增：備註欄位的防抖 (Debounce) 處理 ---
    const [localNotes, setLocalNotes] = useState(formData.notes || '');

    // 當外部資料改變時 (例如切換日期、或是剛載入雲端資料)，同步更新本地狀態
    useEffect(() => {
        setLocalNotes(formData.notes || '');
    }, [formData.notes]);

    // 當本地打字時，延遲 500 毫秒後才更新到全域 formData (觸發重新渲染與存檔)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localNotes !== (formData.notes || '')) {
                handleChange({ target: { name: 'notes', value: localNotes } });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localNotes, formData.notes, handleChange]);

    const handleLocalNotesChange = useCallback((e) => {
        setLocalNotes(e.target.value);
    }, []);
    // -------------------------------------------

    return (
        <section id="notes" className="scroll-mt-28 pt-4 border-t-2 border-gray-500">
            <SectionHeader id="notes" title="備註/日記" icon={FileText} colorClass="text-gray-600" bgClass="bg-gray-50" onScrollTop={onScrollTop} isExpanded={isExpanded} onToggle={toggle}/>
            {isExpanded && (
            <div className="mt-4 space-y-4 animate-fade-in">
                <div className={`space-y-4 transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                    <textarea name="notes" rows="3" value={localNotes} onChange={handleLocalNotesChange} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-gray-300 outline-none transition-shadow" />
                    <div className="mt-2"><label className="text-base font-bold flex gap-2 items-center dark:text-gray-300"><NotebookPen className="w-5 h-5"/> 記錄人</label><div className="flex gap-4 mt-2">{OPTIONS.RECORDERS.map(r=><label key={r} className="flex gap-1.5 cursor-pointer items-center dark:text-gray-300"><input type="radio" name="recorder" value={r} checked={formData.recorder===r} onChange={handleChange} className="text-blue-600 w-4 h-4"/><span className="text-base">{r}</span></label>)}</div></div>
                </div>
                <div id="capture-text" className="mt-6 border border-slate-700 rounded-xl overflow-hidden shadow-lg bg-slate-900 text-slate-200">
                    <div data-html2canvas-ignore="true" className="flex justify-between items-center bg-slate-950/50 px-3 sm:px-4 py-3 sm:py-4 border-b border-slate-700">
                        <h3 id="capture-header-text" className="text-base sm:text-xl font-bold text-slate-200 flex items-center gap-2 sm:gap-3 shrink-0">
                            <div className="bg-slate-800 p-1.5 sm:p-2 rounded-md border border-slate-700 shadow-sm">
                                <ClipboardList className="w-4 h-4 sm:w-6 sm:h-6 text-slate-300"/>
                            </div>
                            文字預覽
                        </h3>
                        <button 
                            type="button"
                            onClick={onCopy} 
                            className={`
                                flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-bold transition-all transform active:scale-95 shadow-sm whitespace-nowrap shrink-0
                                ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}
                            `}
                        >
                            {copySuccess ? <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5"/> : <Copy className="w-4 h-4 sm:w-5 sm:h-5"/>}
                            {copySuccess ? '已複製' : '複製'}
                        </button>
                    </div>
                    <div className="p-3 sm:p-5 bg-slate-900 overflow-x-auto">
                        <pre id="report-text" className="whitespace-pre-wrap font-mono text-sm sm:text-base leading-relaxed text-slate-300 min-w-[280px]">
                            {generatedText || '尚無內容'}
                        </pre>
                    </div>
                </div>
            </div>
            )}
        </section>
    );
});

const FileSection = React.memo(({ onExportJSON, onImportJSON, onClearToday, onClearAll, isBulkExporting, processBulkImport, onBulkExportJSON, onExportImage, onBulkExportImage }) => {
    return (
        <section id="files" className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 scroll-mt-28">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                <Database className="w-5 h-5"/> 資料管理
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 單日資料區塊 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex flex-col h-full shadow-sm">
                    <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-4"><Calendar className="w-5 h-5"/>單日資料</h3>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        <button type="button" onClick={onExportJSON} className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm font-semibold shadow-sm h-full text-center">
                            <Upload className="w-5 h-5 sm:w-6 sm:h-6"/> 匯出 JSON
                        </button>
                        <label className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 p-3 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm font-semibold shadow-sm h-full text-center">
                            <Download className="w-5 h-5 sm:w-6 sm:h-6"/> 匯入 JSON
                            <input type="file" accept=".json" onChange={onImportJSON} className="hidden" />
                        </label>
                        <button type="button" onClick={onExportImage} className="flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-transform active:scale-95 shadow-sm font-bold text-xs sm:text-sm h-full text-center">
                            <ImageUp className="w-5 h-5 sm:w-6 sm:h-6"/> 匯出圖片
                        </button>
                        <button type="button" onClick={onClearToday} className="flex flex-col items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 p-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs sm:text-sm font-bold shadow-sm h-full text-center">
                            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6"/> 刪除單日
                        </button>
                    </div>
                </div>

                {/* 歷史資料區塊 */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col h-full shadow-sm">
                    <h3 className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 mb-4"><Database className="w-5 h-5"/>歷史資料</h3>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        <button type="button" onClick={onBulkExportJSON} disabled={isBulkExporting} className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 p-3 rounded-xl transition-colors disabled:opacity-50 hover:bg-indigo-50 dark:hover:bg-gray-700 text-xs sm:text-sm font-semibold shadow-sm h-full text-center">
                            {isBulkExporting ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin"/> : <Upload className="w-5 h-5 sm:w-6 sm:h-6"/>} 
                            匯出 JSON
                        </button>
                        <label className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 p-3 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm font-semibold shadow-sm h-full text-center">
                            <Download className="w-5 h-5 sm:w-6 sm:h-6"/> 匯入 JSON
                            <input type="file" accept=".json" onChange={(e) => processBulkImport(e.target.files[0])} className="hidden" />
                        </label>
                        <button type="button" onClick={onBulkExportImage} disabled={isBulkExporting} className="flex flex-col items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-transform active:scale-95 shadow-sm font-bold text-xs sm:text-sm disabled:opacity-50 disabled:active:scale-100 h-full text-center">
                            {isBulkExporting ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin"/> : <ImageUp className="w-5 h-5 sm:w-6 sm:h-6"/>} 
                            批次圖片
                        </button>
                        <button type="button" onClick={onClearAll} className="flex flex-col items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 p-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs sm:text-sm font-bold shadow-sm h-full text-center">
                            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6"/> 清空歷史
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
});

const App = () => {
  const { toast, showToast, setToast } = useToast();
  const { formData, dispatch, handleChange, handleTimeReset, handleJumpToToday, listOps, handlers, dateInfo } = useContactBookForm();
  const { user, syncStatus, isLoaded, isAuthLoading, authMode, setAuthMode } = useFirebaseSync(formData, dispatch);
  const recordedDates = useRecordedDates(user);
  
  const [copySuccess, setCopySuccess] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const [bulkImportConfirm, setBulkImportConfirm] = useState(null);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('contact-book-theme');
          if (saved) return saved === 'dark';
          return false;
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
          if (error.code === 'auth/operation-not-allowed') {
              setLoginError('⚠️ 尚未啟用「電子郵件/密碼」登入！請至 Firebase 後台的 Authentication 啟用此功能。');
          } else if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
              setLoginError('⚠️ 尚未建立共用帳號或密碼錯誤！請確認 Firebase 後台設定。');
          } else {
              setLoginError('密碼錯誤，請重新確認');
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
          if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } 
          else if (currentRetries > 0) { setTimeout(() => attemptScroll(currentRetries - 1), 100); }
      };
      attemptScroll(retries);
  }, []);

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
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Contact_backup_${getRocFileNameDate(formData.date)}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); showToast('匯出成功', 'success');
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
          const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Contact_FullBackup_${getRocFileNameDate(new Date().toISOString().slice(0,10))}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); showToast(`成功匯出 ${allData.length} 筆資料`, 'success');
      } catch (error) { console.error(error); showToast("匯出失敗，請檢查網路", 'error'); }
      setIsBulkExporting(false);
  };

  const handleImageExport = async () => {
      showToast('正在產生圖片，請稍候...', 'info');
      try {
          if (!window.html2canvas) {
              await new Promise((resolve, reject) => {
                  const script = document.createElement('script');
                  script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
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
          const canvas = await window.html2canvas(element, { scale: 2, backgroundColor: '#0f172a' });
          const link = document.createElement('a');
          link.download = `ContactBook_${getRocFileNameDate(formData.date)}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          showToast('圖片匯出成功', 'success');
      } catch (error) {
          console.error(error);
          showToast('圖片匯出失敗', 'error');
      }
  };

  const handleBulkImageExport = async () => {
      setIsBulkExporting(true);
      showToast('準備批次匯出圖片，這可能需要一點時間...', 'info');
      try {
          if (!window.html2canvas) {
              await new Promise(r => { const s = document.createElement('script'); s.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js'; s.onload = r; document.head.appendChild(s); });
          }
          if (!window.JSZip) {
              await new Promise(r => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; s.onload = r; document.head.appendChild(s); });
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
              setIsBulkExporting(false);
              return;
          }

          const zip = new window.JSZip();
          const imgFolder = zip.folder("ContactBook_Images");

          const originalCaptureText = document.getElementById('capture-text');
          if (!originalCaptureText) throw new Error("找不到預覽區塊");

          const hiddenContainer = document.createElement('div');
          hiddenContainer.style.position = 'absolute';
          hiddenContainer.style.left = '-9999px';
          hiddenContainer.style.top = '-9999px';
          hiddenContainer.style.width = originalCaptureText.offsetWidth + 'px'; 
          document.body.appendChild(hiddenContainer);

          for (let i = 0; i < allData.length; i++) {
              const data = allData[i];
              if (!data.date) continue;
              
              const [y, m, d] = data.date.split('-');
              const mockDateInfo = getDateStatus(parseInt(y), parseInt(m), parseInt(d));
              const text = generateReportText(data, mockDateInfo);
              
              const clonedNode = originalCaptureText.cloneNode(true);
              const preElement = clonedNode.querySelector('#report-text');
              if (preElement) preElement.innerText = text || '尚無內容';

              hiddenContainer.innerHTML = '';
              hiddenContainer.appendChild(clonedNode);

              const canvas = await window.html2canvas(clonedNode, { scale: 2, backgroundColor: '#0f172a' });
              const imgData = canvas.toDataURL('image/png').split(',')[1];
              imgFolder.file(`ContactBook_${getRocFileNameDate(data.date)}.png`, imgData, {base64: true});
              
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
      setIsBulkExporting(false);
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

  if (!isAuthLoading && !authMode) {
      return <LoginScreen onLoginFamily={handleLoginFamily} onLoginLocal={handleLoginLocal} isAuthenticating={isAuthenticating} loginError={loginError} />;
  }
  
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans text-gray-700 dark:text-gray-200 transition-colors duration-200`}>
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white flex flex-col gap-2">
             <div className="flex justify-between items-start w-full"><div className="flex-1"><h1 className="text-2xl font-bold flex items-center gap-3 whitespace-nowrap"><Baby className="w-8 h-8 shrink-0"/> 親子成長聯絡簿</h1><div className="mt-2 space-y-1 w-full"><p className="text-blue-100 text-xs opacity-80">雲端代碼: {appId.slice(0,5)}***{appId.slice(-3)}</p>{formData.lastUpdated && <p className="text-blue-100 text-xs opacity-80">最後更新: {new Date(formData.lastUpdated).toLocaleString('zh-TW', { hour12: false })}</p>}</div></div></div>
             <div className="flex justify-between items-end mt-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border w-fit ${syncStatus==='saved'?'bg-green-500/20 border-green-400':'bg-white/20'}`}>{syncStatus==='saving'?<Loader2 className="w-3 h-3 animate-spin"/>:syncStatus==='saved'?<Cloud className="w-3 h-3"/>:<Wifi className="w-3 h-3"/>}<span>{syncStatus==='saving'?'儲存中':syncStatus==='saved'?'已同步':'準備中'}</span></div>
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
            {!isAuthLoading && !user && authMode === 'local' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-fade-in">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
                        <strong className="text-base mb-1 block">⚠️ 無法連線至雲端資料庫 (未獲得授權)</strong>
                        您目前處於「唯讀/離線」模式。如果您已經佈署到 GitHub Pages，請務必至 Firebase 後台的 <b>Authentication &gt; Settings &gt; Authorized domains</b> 加入您的網址，否則資料無法儲存！
                    </div>
                </div>
            )}

            {!formData.date ? ( <FormSkeleton /> ) : (
                <div className="space-y-8">
                    <BasicSection formData={formData} handleChange={handleChange} dateInfo={dateInfo} handleJumpToToday={handleJumpToToday} handleAutoWeather={fetchWeather} handleTimeReset={handleTimeReset} listOps={listOps} onScrollTop={scrollToElement} handlers={handlers} isLocked={isLocked} recordedDates={recordedDates} />
                    <SchoolSection formData={formData} handleChange={handleChange} handleTimeReset={handleTimeReset} listOps={listOps} onScrollTop={scrollToElement} handlers={handlers} isLocked={isLocked}/>
                    <SleepSection formData={formData} handleChange={handleChange} handleTimeReset={handleTimeReset} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} onScrollTop={scrollToElement} handlers={handlers} isLocked={isLocked}/>
                    <DiningSection formData={formData} handleChange={handleChange} listOps={listOps} onScrollTop={scrollToElement} handlers={handlers} isLocked={isLocked}/>
                    <PhysiologySection formData={formData} handleChange={handleChange} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} onScrollTop={scrollToElement} handlers={handlers} isLocked={isLocked}/>
                    <HealthSection formData={formData} handleChange={handleChange} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} onScrollTop={scrollToElement} handlers={handlers} isLocked={isLocked}/>
                    <ActivitySection formData={formData} handleChange={handleChange} handleTimeReset={handleTimeReset} listOps={listOps} onScrollTop={scrollToElement} handlers={handlers} isLocked={isLocked}/>
                    <NotesSection formData={formData} handleChange={handleChange} onScrollTop={scrollToElement} generatedText={generatedText} onCopy={handleCopy} copySuccess={copySuccess} isLocked={isLocked} />
                    <FileSection onExportJSON={handleJsonExport} onImportJSON={(e) => processImport(e.target.files[0])} onClearToday={handleClearToday} onClearAll={handleClearAllData} isBulkExporting={isBulkExporting} processBulkImport={processBulkImport} onBulkExportJSON={handleBulkExport} onExportImage={handleImageExport} onBulkExportImage={handleBulkImageExport} />
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