export const HOLIDAYS_CONFIG = {
    '01-01': '元旦', '02-16': '除夕', '02-17': '春節(初一)', '02-18': '春節(初二)', 
    '02-19': '春節(初三)', '02-20': '春節(初四)', '02-27': '補假', '02-28': '和平紀念日',
    '04-03': '補假', '04-04': '兒童/清明', '04-05': '清明節', '04-06': '補假', 
    '05-01': '勞動節', '06-19': '端午節', '09-25': '中秋節', '10-09': '補假', 
    '10-10': '國慶日', '10-25': '光復節', '10-26': '補假',
};

export const MAKE_UP_DAYS = [];

export const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
export const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const ACTIONS = {
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

export const OPTIONS = {
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