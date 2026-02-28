import { HOLIDAYS_CONFIG, MAKE_UP_DAYS } from '../constants/config';

export const getDateStatus = (year, month, day) => {
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

export const getTaiwanTimeParts = (date = new Date()) => {
  const formatter = (options) => date.toLocaleString('en-US', { timeZone: 'Asia/Taipei', ...options });
  return {
    year: parseInt(formatter({ year: 'numeric' })),
    month: formatter({ month: '2-digit' }).padStart(2, '0'),
    day: formatter({ day: '2-digit' }).padStart(2, '0'),
    hour: formatter({ hour: '2-digit', hour12: false }).replace(/^24/, '00').padStart(2, '0'),
    minute: formatter({ minute: '2-digit' }).padStart(2, '0')
  };
};

export const formatRocDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const dateObj = new Date(dateStr);
  const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const weekDay = weekDays[dateObj.getDay()];
  const { holidayName, familyName } = getDateStatus(parseInt(y), parseInt(m), parseInt(d));
  let info = weekDay;
  if (holidayName) info += ` / ${holidayName}`;
  else if (familyName) info += ` / ${familyName}`;
  return `${parseInt(y) - 1911}年${m}月${d}日 ${info}`;
};

export const getCurrentTime = () => {
    const t = getTaiwanTimeParts();
    return `${t.hour}:${t.minute}`;
};

export const sortListHelper = (list) => {
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

export const getInitialFormData = () => {
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
