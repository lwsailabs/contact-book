import React, { useState, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HOURS, MINUTES } from '../../constants/config';
import { getDateStatus } from '../../utils/helpers';

export const TimeSelect = React.memo(({ value, onChange, name, className }) => {
  const [h, m] = (value || ':').split(':');
  const baseClass = `flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-[40px] focus-within:ring-2 focus-within:ring-blue-300 transition-shadow shrink-0 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`;
  return (<div className={className ? `${baseClass} ${className.replace('border ', '')}` : `${baseClass} w-[130px]`}>
      <select value={h||''} onChange={e=>onChange({target:{name, value:`${e.target.value}:${m||'00'}`}})} className="flex-1 h-full text-center bg-transparent outline-none appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200"><option value="" disabled>時</option>{HOURS.map(x=><option key={x} value={x} className="text-gray-700 dark:text-gray-200 dark:bg-gray-700">{x}</option>)}</select>
      <span className="text-gray-400 dark:text-gray-500 font-bold">:</span>
      <select value={m||''} onChange={e=>onChange({target:{name, value:`${h||'00'}:${e.target.value}`}})} className="flex-1 h-full text-center bg-transparent outline-none appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200"><option value="" disabled>分</option>{MINUTES.map(x=><option key={x} value={x} className="text-gray-700 dark:text-gray-200 dark:bg-gray-700">{x}</option>)}</select>
    </div>);
});

export const CustomCalendar = React.memo(({ value, onChange, onClose, recordedDates = [] }) => {
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

export const RocDateSelect = React.memo(({ value, onChange, isHoliday, recordedDates, className, textClass = "text-sm" }) => {
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

export const RadioGroup = ({ name, options, value, onChange, color='blue', customInput=false }) => (
    <div className="flex flex-wrap gap-3 items-center">{options.map(opt => { const isObj = typeof opt === 'object'; const val = isObj ? opt.value : opt; const label = isObj ? opt.label : opt; return (<label key={val} className={`flex items-center gap-1 cursor-pointer select-none hover:text-${color}-800 dark:hover:text-${color}-300 text-gray-700 dark:text-gray-300`}><input type="radio" name={name} value={val} checked={value === val} onChange={onChange} onClick={e => value === val && onChange({target:{name, value:''}})} className={`text-${color}-600 focus:ring-${color}-500`} /><span className="text-sm">{label}</span></label>)})}{customInput && value === (typeof options[options.length - 1] === 'object' ? options[options.length - 1].value : options[options.length - 1]) && customInput}</div>
);