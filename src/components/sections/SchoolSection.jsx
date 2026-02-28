import React from 'react';
import { School, RotateCcw, PlusCircle, Trash2 } from 'lucide-react';
import { SectionHeader } from '../common/SectionHeader';
import { TimeSelect, RadioGroup } from '../common/FormElements';
import { TransportationBlock } from '../common/SharedBlocks';
import { OPTIONS } from '../../constants/config';
import { useSectionExpand } from '../../hooks/useSectionExpand';

export const SchoolSection = React.memo(({ formData, handleChange, handleTimeReset, listOps, onScrollTop, isLocked }) => {
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
