import React, { useState } from 'react';
import { RotateCcw, ChevronUp } from 'lucide-react';
import { TimeSelect } from './FormElements';
import { OPTIONS } from '../../constants/config';
import { useSectionExpand } from '../../hooks/useSectionExpand';

export const TripDirectionBlock = React.memo(({ title, timeName, timeValue, transName, transValue, customName, customValue, handleChange, handleTimeReset }) => (
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

export const TransportationBlock = React.memo(({ formData, handleChange, handleTimeReset, prefix = '', className = '', isLocked = false }) => {
    const depTime = prefix ? `${prefix}DepartureTripTime` : 'departureTripTime';
    const depTrans = prefix ? `${prefix}DepartureTripTransportation` : 'departureTripTransportation';
    const depTransCustom = prefix ? `${prefix}DepartureTripTransportationCustom` : 'departureTripTransportationCustom';
    const retTime = prefix ? `${prefix}ReturnTripTime` : 'returnTripTime';
    const retTrans = prefix ? `${prefix}ReturnTripTransportation` : 'returnTripTransportation';
    const retTransCustom = prefix ? `${prefix}ReturnTripTransportationCustom` : 'returnTripTransportationCustom';
    const defaultBg = className || 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800';

    const hasData = !!(formData[depTime] || formData[depTrans] || formData[depTransCustom] || formData[retTime] || formData[retTrans] || formData[retTransCustom]);
    const [isExpanded, setIsExpanded] = useSectionExpand(prefix || 'basic', formData.date, hasData);

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

export const MealBlock = React.memo(({ title, mealType, formData, handleChange, handlers, referCheckbox = null, isFaded = false }) => {
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