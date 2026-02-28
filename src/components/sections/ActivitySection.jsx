import React from 'react';
import { PawPrint, PlusCircle, Trash2 } from 'lucide-react';
import { SectionHeader } from '../common/SectionHeader';
import { TimeSelect } from '../common/FormElements';
import { TransportationBlock } from '../common/SharedBlocks';
import { OPTIONS } from '../../constants/config';
import { useSectionExpand } from '../../hooks/useSectionExpand';
import { getCurrentTime } from '../../utils/helpers';

export const ActivitySection = React.memo(({ formData, handleChange, handleTimeReset, listOps, onScrollTop, isLocked }) => {
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
