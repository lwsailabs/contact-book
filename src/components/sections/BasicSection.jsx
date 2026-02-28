import React from 'react';
import { Calendar, CloudSun, RotateCcw, PlusCircle, Trash2 } from 'lucide-react';
import { SectionHeader } from '../common/SectionHeader';
import { TimeSelect, RocDateSelect, RadioGroup } from '../common/FormElements';
import { TransportationBlock } from '../common/SharedBlocks';
import { OPTIONS } from '../../constants/config';
import { useSectionExpand } from '../../hooks/useSectionExpand';

export const BasicSection = React.memo(({ formData, handleChange, dateInfo, handleJumpToToday, handleAutoWeather, handleTimeReset, listOps, onScrollTop, handlers, isLocked, recordedDates }) => {
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