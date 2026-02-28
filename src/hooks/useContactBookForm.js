import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import { ACTIONS } from '../constants/config';
import { getInitialFormData, getDateStatus, sortListHelper, getCurrentTime } from '../utils/helpers';

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
        const t = getInitialFormData().date;
        return { ...getInitialFormData(), date: t };
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

export const useContactBookForm = () => {
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