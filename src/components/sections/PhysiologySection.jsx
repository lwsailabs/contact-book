import React from 'react';
import { Smile, PlusCircle, Trash2, Thermometer, Activity } from 'lucide-react';
import { SectionHeader } from '../common/SectionHeader';
import { TimeSelect } from '../common/FormElements';
import { OPTIONS } from '../../constants/config';
import { useSectionExpand } from '../../hooks/useSectionExpand';
import { getCurrentTime } from '../../utils/helpers';

export const PhysiologySection = React.memo(({ formData, handleChange, listOps, showToast, scrollToElement, onScrollTop, handlers, isLocked }) => {
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