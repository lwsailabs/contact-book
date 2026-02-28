import React from 'react';
import { Moon, RotateCcw, PlusCircle, Trash2, X } from 'lucide-react';
import { SectionHeader } from '../common/SectionHeader';
import { TimeSelect } from '../common/FormElements';
import { useSectionExpand } from '../../hooks/useSectionExpand';
import { getCurrentTime } from '../../utils/helpers';

export const SleepSection = React.memo(({ formData, handleChange, handleTimeReset, listOps, showToast, scrollToElement, onScrollTop, handlers, isLocked }) => {
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
                         <div className="flex flex-row items-center justify-between gap-2 mb-2">
                             <div className="flex items-center gap-3">
                                 <span className="font-bold text-yellow-800 dark:text-yellow-200">午休、小睡時間</span>
                                 <label className="flex items-center gap-1 cursor-pointer">
                                     <input type="checkbox" name="napReferToSchool" checked={formData.napReferToSchool || false} onChange={handleChange} className="w-3 h-3 text-yellow-600"/>
                                     <span className="text-xs text-blue-600 dark:text-blue-300">參考學校聯絡簿</span>
                                 </label>
                             </div>
                             <button type="button" onClick={()=>listOps.add('napRecords', {startTime:'', endTime:'', isNotAsleep:false, isBreastfeeding:false, reason:''})} className="bg-yellow-200 dark:bg-yellow-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-yellow-900 dark:text-yellow-200 shrink-0"><PlusCircle className="w-3 h-3"/> 新增</button>
                         </div>
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
