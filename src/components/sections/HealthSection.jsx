import React, { useCallback } from 'react';
import { HeartPlus, PlusCircle, Trash2, Thermometer, Activity, DollarSign } from 'lucide-react';
import { SectionHeader } from '../common/SectionHeader';
import { TimeSelect, RadioGroup, RocDateSelect } from '../common/FormElements';
import { OPTIONS } from '../../constants/config';
import { useSectionExpand } from '../../hooks/useSectionExpand';

const SymptomList = React.memo(({ symptoms, listOps, showToast, scrollToElement, handlers }) => (
    <div id="symptom-list" className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-100 dark:border-red-900">
        <div className="flex justify-between items-center mb-2"><span className="font-bold text-red-800 dark:text-red-300">不適症狀</span><button type="button" onClick={()=>listOps.add('symptoms', {time:'', desc:'', isFever:false, feverTemp:''})} className="bg-red-200 dark:bg-red-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-red-800 dark:text-red-300"><PlusCircle className="w-3 h-3"/> 新增</button></div>
        {symptoms.map(i => (
            <div key={`item-${i.id}`} id={`item-${i.id}`} className="bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-800/50 mb-2 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600"><input type="checkbox" checked={i.isPreviousDay || false} onChange={e=>listOps.update('symptoms', i.id, 'isPreviousDay', e.target.checked)} className="w-3 h-3"/><span className="text-xs dark:text-gray-300">前一天</span></label>
                    <TimeSelect value={i.time} onChange={e=>listOps.update('symptoms', i.id, 'time', e.target.value)}/>
                    <label className="flex items-center gap-1 cursor-pointer bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded border border-orange-200 dark:border-orange-900"><input type="checkbox" checked={i.isFever || false} onChange={e=>{listOps.update('symptoms', i.id, 'isFever', e.target.checked); }} className="w-3 h-3 text-orange-600"/><span className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1"><Thermometer className="w-3 h-3"/> 發燒</span></label>
                    {i.isFever && (
                        <>
                            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/30 px-1 border border-orange-200 dark:border-orange-900 rounded"><input value={i.feverTemp || ''} onChange={e=>listOps.update('symptoms', i.id, 'feverTemp', e.target.value)} className="w-10 bg-transparent text-center text-sm outline-none dark:text-gray-200" placeholder="溫度"/><span className="text-xs dark:text-gray-300">°C</span></div>
                            <label className="flex items-center gap-1 cursor-pointer bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded border border-red-200 dark:border-red-900">
                                <input type="checkbox" checked={i.isFeverMedication || false} onChange={e=>{
                                    listOps.update('symptoms', i.id, 'isFeverMedication', e.target.checked);
                                    if(e.target.checked) {
                                        const newId = listOps.add('medications', {time:i.time, name:'退燒藥', isInternal:true, source:'symptom-list', sourceId: i.id, linkedField: 'isFeverMedication'});
                                        showToast('已新增退燒藥記錄', 'success');
                                        setTimeout(() => scrollToElement(`item-${newId}`), 100);
                                    }
                                }} className="w-3 h-3 text-red-600"/>
                                <span className="text-xs text-red-700 dark:text-red-400">已服退燒藥</span>
                            </label>
                        </>
                    )}
                </div>
                <input value={i.desc || ''} onChange={e=>listOps.update('symptoms', i.id, 'desc', e.target.value)} className="w-full border-b border-red-300 dark:border-red-800 outline-none text-sm p-1 min-w-0 bg-transparent dark:text-gray-200" placeholder="症狀描述"/>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded flex-wrap">
                    <span className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1"><Activity className="w-3 h-3"/> 情形觀察:</span>
                    <TimeSelect value={i.observationTime} onChange={e=>listOps.update('symptoms', i.id, 'observationTime', e.target.value)} className="w-[120px] h-[32px]"/>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">症狀改善:</span>
                    <label className="flex items-center gap-1 dark:text-gray-300"><input type="checkbox" checked={i.isImproved || false} onChange={e=>listOps.update('symptoms', i.id, 'isImproved', e.target.checked)} className="w-3 h-3"/><span className="text-xs">改善</span></label>
                    <label className="flex items-center gap-1 dark:text-gray-300"><input type="checkbox" checked={i.isNotImproved || false} onChange={e=>listOps.update('symptoms', i.id, 'isNotImproved', e.target.checked)} className="w-3 h-3"/><span className="text-xs">未改善</span></label>
                    {i.isNotImproved && <input value={i.notImprovedReason || ''} onChange={e=>listOps.update('symptoms', i.id, 'notImprovedReason', e.target.value)} className="border-b text-xs w-20 bg-transparent dark:text-gray-200 dark:border-gray-500" placeholder="備註"/>}
                </div>
                <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={i.isMedicated || false} onChange={e=>{
                        listOps.update('symptoms', i.id, 'isMedicated', e.target.checked); 
                        if(e.target.checked){ 
                            const newId = listOps.add('medications', {time:i.time, name:'', isInternal:true, source: 'symptom-list', sourceId: i.id, linkedField: 'isMedicated'}); 
                            showToast('已新增用藥記錄', 'success'); 
                            setTimeout(() => scrollToElement(`item-${newId}`), 100);
                        }
                    }} className="w-3 h-3 text-green-600"/><span className="text-xs text-green-600 dark:text-green-400">服藥</span></label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={i.isDoctorVisited || false} onChange={e=>{
                        listOps.update('symptoms', i.id, 'isDoctorVisited', e.target.checked); 
                        if(e.target.checked){ 
                            const newId = listOps.add('medicalLocations', {time:i.time, reason:i.desc, source: 'symptom-list', sourceId: i.id, linkedField: 'isDoctorVisited'}); 
                            showToast('已新增就醫記錄', 'success'); 
                            setTimeout(() => scrollToElement(`item-${newId}`), 100);
                        }
                    }} className="w-3 h-3 text-blue-600"/><span className="text-xs text-blue-600 dark:text-blue-400">就醫</span></label>
                    <button type="button" onClick={() => {
                        if (i.source === 'bowel-list') {
                            showToast('已同步將排便記錄恢復為「正常」', 'info');
                            scrollToElement('bowel-list');
                        }
                        listOps.remove('symptoms', i.id);
                    }} className="ml-auto text-red-500 dark:text-red-400"><Trash2 className="w-4 h-4"/></button>
                </div>
            </div>
        ))}
    </div>
));

const InjuryList = React.memo(({ injuryRecords, listOps, showToast, scrollToElement, handlers }) => (
    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-100 dark:border-red-900">
         <div className="flex justify-between items-center mb-2"><span className="font-bold text-red-800 dark:text-red-300">受傷記錄</span><button type="button" onClick={()=>listOps.add('injuryRecords', {time:'', location:'', part:'', cause:''})} className="bg-red-200 dark:bg-red-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-red-800 dark:text-red-300"><PlusCircle className="w-3 h-3"/> 新增</button></div>
         {injuryRecords.map(i => (
             <div key={`item-${i.id}`} id={`item-${i.id}`} className="bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-800/50 mb-2 flex flex-col gap-2">
                 <div className="flex flex-wrap items-center gap-2 w-full">
                    <label className="flex items-center gap-1 cursor-pointer bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600"><input type="checkbox" checked={i.isPreviousDay || false} onChange={e=>listOps.update('injuryRecords', i.id, 'isPreviousDay', e.target.checked)} className="w-3 h-3"/><span className="text-xs dark:text-gray-300">前一天</span></label>
                    <div className="flex-1"><TimeSelect value={i.time} onChange={e=>listOps.update('injuryRecords', i.id, 'time', e.target.value)}/></div>
                 </div>
                 <input value={i.location || ''} onChange={e=>listOps.update('injuryRecords', i.id, 'location', e.target.value)} placeholder="地點" className="w-full p-1 text-sm border-b border-red-300 dark:border-red-800 outline-none bg-transparent dark:text-gray-200"/>
                 
                 <div className="flex items-center gap-2">
                    <input value={i.part || ''} onChange={e=>listOps.update('injuryRecords', i.id, 'part', e.target.value)} placeholder="部位" className="flex-1 p-1 text-sm border-b border-red-300 dark:border-red-800 outline-none bg-transparent min-w-0 dark:text-gray-200"/>
                    <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap select-none shrink-0 dark:text-gray-300">
                        <input 
                            type="checkbox" 
                            checked={(i.part || '').includes('未成傷')} 
                            onChange={e => {
                                const isChecked = e.target.checked;
                                let val = i.part || '';
                                if (isChecked) {
                                    val = val ? `${val} (未成傷)` : '未成傷';
                                } else {
                                    val = val.replace(/ ?\(?未成傷\)?/g, '').trim();
                                }
                                listOps.update('injuryRecords', i.id, 'part', val);
                            }}
                            className="w-3 h-3 text-red-600 rounded focus:ring-red-500 border-gray-300"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">未成傷</span>
                    </label>
                 </div>

                 <input value={i.cause || ''} onChange={e=>listOps.update('injuryRecords', i.id, 'cause', e.target.value)} placeholder="原因" className="w-full p-1 text-sm border-b border-red-300 dark:border-red-800 outline-none bg-transparent dark:text-gray-200"/>
                 
                 <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded whitespace-nowrap overflow-x-auto no-scrollbar">
                    <span className="text-xs font-bold text-red-700 dark:text-red-400 shrink-0">後續:</span>
                    <label className="flex items-center gap-1 cursor-pointer bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded shrink-0">
                        <input type="checkbox" checked={i.isMedicated || false} onChange={e=>{
                            listOps.update('injuryRecords', i.id, 'isMedicated', e.target.checked);
                            if(e.target.checked) {
                                const newId = listOps.add('medications', {time:i.time, name:'', isExternal:true, source: 'injury-list', sourceId: i.id, linkedField: 'isMedicated'});
                                showToast('已新增外用藥記錄', 'success');
                                setTimeout(() => scrollToElement(`item-${newId}`), 100);
                            }
                        }} className="w-3 h-3"/><span className="text-xs text-green-600 dark:text-green-400">擦藥</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded shrink-0">
                        <input type="checkbox" checked={i.isDoctorVisited || false} onChange={e=>{
                            listOps.update('injuryRecords', i.id, 'isDoctorVisited', e.target.checked);
                            if(e.target.checked) {
                                const newId = listOps.add('medicalLocations', {time:i.time, reason:`受傷: ${i.part||'未填寫部位'}`, source: 'injury-list', sourceId: i.id, linkedField: 'isDoctorVisited'});
                                showToast('已新增就醫記錄', 'success');
                                setTimeout(() => scrollToElement(`item-${newId}`), 100);
                            }
                        }} className="w-3 h-3"/><span className="text-xs text-blue-600 dark:text-blue-400">就醫</span>
                    </label>
                    <button type="button" onClick={()=>listOps.remove('injuryRecords', i.id)} className="ml-auto text-red-500 dark:text-red-400 shrink-0"><Trash2 className="w-4 h-4"/></button>
                 </div>
             </div>
         ))}
    </div>
));

const MedicationList = React.memo(({ medications, listOps, scrollToElement, handlers }) => {
    const handleDelete = useCallback((id) => {
        const item = medications.find(m => m.id === id);
        if (item && item.sourceId) {
             scrollToElement(`item-${item.sourceId}`);
        } else if (item && item.source) {
             scrollToElement(item.source);
        }
        handlers.deleteLinkedRecord('medications', id);
    }, [medications, handlers, scrollToElement]);

    return (
        <div id="medication-list" className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-100 dark:border-red-900 scroll-mt-28">
            <div className="flex justify-between items-center mb-2"><span className="font-bold text-red-800 dark:text-red-300">用藥紀錄</span><button type="button" onClick={()=>listOps.add('medications', {time:'', name:'', isInternal:true})} className="bg-red-200 dark:bg-red-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-red-800 dark:text-red-300"><PlusCircle className="w-3 h-3"/> 新增</button></div>
            {medications.map(i => (
                <div key={i.id} id={`item-${i.id}`} className="bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-800/50 mb-2 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600"><input type="checkbox" checked={i.isPreviousDay || false} onChange={e=>listOps.update('medications', i.id, 'isPreviousDay', e.target.checked)} className="w-3 h-3"/><span className="text-xs dark:text-gray-300">前一天</span></label>
                        <TimeSelect value={i.time} onChange={e=>listOps.update('medications', i.id, 'time', e.target.value)}/>
                        <label className="flex items-center gap-1 dark:text-gray-300"><input type="checkbox" checked={i.isInternal || false} onChange={e=>listOps.update('medications', i.id, 'isInternal', e.target.checked)} className="w-3 h-3"/><span className="text-xs">內服</span></label>
                        <label className="flex items-center gap-1 dark:text-gray-300"><input type="checkbox" checked={i.isExternal || false} onChange={e=>listOps.update('medications', i.id, 'isExternal', e.target.checked)} className="w-3 h-3"/><span className="text-xs">外用</span></label>
                        <input value={i.name || ''} onChange={e=>listOps.update('medications', i.id, 'name', e.target.value)} placeholder="藥名" className="flex-1 border-b text-sm min-w-[100px] bg-transparent dark:text-gray-200 dark:border-gray-500"/>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded flex-wrap relative">
                        <span className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1"><Activity className="w-3 h-3"/> 情形觀察:</span>
                        <TimeSelect value={i.observationTime} onChange={e=>listOps.update('medications', i.id, 'observationTime', e.target.value)} className="w-[120px] h-[32px]"/>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">症狀改善:</span>
                        <label className="flex items-center gap-1 dark:text-gray-300"><input type="checkbox" checked={i.isImproved || false} onChange={e=>listOps.update('medications', i.id, 'isImproved', e.target.checked)} className="w-3 h-3"/><span className="text-xs">改善</span></label>
                        <label className="flex items-center gap-1 dark:text-gray-300"><input type="checkbox" checked={i.isNotImproved || false} onChange={e=>listOps.update('medications', i.id, 'isNotImproved', e.target.checked)} className="w-3 h-3"/><span className="text-xs">未改善</span></label>
                        {i.isNotImproved && <input value={i.notImprovedReason || ''} onChange={e=>listOps.update('medications', i.id, 'notImprovedReason', e.target.value)} className="border-b text-xs w-20 bg-transparent dark:text-gray-200 dark:border-gray-500" placeholder="備註"/>}
                        <button type="button" onClick={()=>handleDelete(i.id)} className="text-red-500 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded ml-auto"><Trash2 className="w-4 h-4"/></button>
                    </div>
                </div>
            ))}
        </div>
    );
});

const MedicalLocationList = React.memo(({ medicalLocations, listOps, scrollToElement, handlers }) => {
    const handleDelete = useCallback((id) => {
        const item = medicalLocations.find(m => m.id === id);
        if (item && item.sourceId) {
             scrollToElement(`item-${item.sourceId}`);
        } else if (item && item.source) {
             scrollToElement(item.source);
        }
        handlers.deleteLinkedRecord('medicalLocations', id);
    }, [medicalLocations, handlers, scrollToElement]);

    return (
        <div id="medical-location-list" className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-100 dark:border-blue-900 scroll-mt-28">
            <div className="flex justify-between items-center mb-2"><span className="font-bold text-blue-800 dark:text-blue-300">就醫資訊</span><button type="button" onClick={()=>listOps.add('medicalLocations', {time:'', desc:'', reason:'', isFollowUp: false, followUpDate: '', followUpNumber: ''})} className="bg-blue-200 dark:bg-blue-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-blue-800 dark:text-blue-300"><PlusCircle className="w-3 h-3"/> 新增</button></div>
            {medicalLocations.map(i => (
                <div key={i.id} id={`item-${i.id}`} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-900 mb-3 space-y-3 shadow-sm relative">
                    <div className="flex items-center justify-between"><TimeSelect value={i.time} onChange={e=>listOps.update('medicalLocations', i.id, 'time', e.target.value)} className="w-[130px] h-[40px] shrink-0"/><button type="button" onClick={()=>handleDelete(i.id)} className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded shrink-0"><Trash2 className="w-4 h-4"/></button></div>
                    <input value={i.desc || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'desc', e.target.value)} placeholder="醫院/診所" className="w-full p-1 text-sm border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent dark:text-gray-200" />
                    
                    <div className="w-full flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-fit">就醫原因</label>
                        <input value={i.reason || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'reason', e.target.value)} placeholder="" className="w-full p-1 border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent text-sm dark:text-gray-200" />
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2 items-center w-full min-w-0">
                        <label className={`flex items-center justify-center gap-1.5 cursor-pointer select-none border rounded px-2 h-[36px] transition-colors whitespace-nowrap text-xs font-bold ${i.isVaccine ? 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:border-blue-500 dark:text-blue-300' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                            <input type="checkbox" className="hidden" checked={i.isVaccine || false} onChange={e=>listOps.update('medicalLocations', i.id, 'isVaccine', e.target.checked)}/>
                            <span>施打疫苗</span>
                        </label>
                        <label className={`flex items-center justify-center gap-1.5 cursor-pointer select-none border rounded px-2 h-[36px] transition-colors whitespace-nowrap text-xs font-bold ${i.isInjection ? 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                            <input type="checkbox" className="hidden" checked={i.isInjection || false} onChange={e=>listOps.update('medicalLocations', i.id, 'isInjection', e.target.checked)}/>
                            <span>打針</span>
                        </label>
                        <label className={`flex items-center justify-center gap-1.5 cursor-pointer select-none border rounded px-2 h-[36px] transition-colors whitespace-nowrap text-xs font-bold ${i.isIV ? 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                            <input type="checkbox" className="hidden" checked={i.isIV || false} onChange={e=>listOps.update('medicalLocations', i.id, 'isIV', e.target.checked)}/>
                            <span>打點滴</span>
                        </label>
                        
                        <div className="flex items-center gap-2 flex-1 min-w-[100px] max-w-full">
                            <label className={`flex items-center justify-center gap-1.5 cursor-pointer select-none border rounded px-2 h-[36px] transition-colors whitespace-nowrap text-xs font-bold shrink-0 ${i.isOtherTreatment ? 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                                <input type="checkbox" className="hidden" checked={i.isOtherTreatment || false} onChange={e=>listOps.update('medicalLocations', i.id, 'isOtherTreatment', e.target.checked)}/>
                                <span>其它</span>
                            </label>
                            {i.isOtherTreatment && (
                                <input value={i.otherTreatmentDesc || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'otherTreatmentDesc', e.target.value)} placeholder="說明" className="flex-1 p-1 text-xs border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent dark:text-gray-200 w-full min-w-0"/>
                            )}
                        </div>
                    </div>
                    
                    {i.isVaccine && <div className="flex items-center gap-2 mt-2 w-full sm:w-auto"><span className="text-xs font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap min-w-fit">疫苗:</span><input value={i.vaccineName || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'vaccineName', e.target.value)} placeholder="疫苗名稱" className="flex-1 p-1 text-xs border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent dark:text-gray-200 min-w-0"/></div>}

                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">費用</label>
                        <div className="relative w-32">
                            <input value={i.cost || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'cost', e.target.value)} placeholder="" className="w-full p-2 pl-7 pr-8 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-blue-400 outline-none h-[40px] dark:text-gray-200 text-right" />
                            <span className="absolute left-2 top-2.5 text-gray-400 dark:text-gray-500"><DollarSign className="w-4 h-4"/></span>
                            <span className="absolute right-2 top-2.5 text-gray-500 dark:text-gray-400 text-sm">元</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">醫生叮囑</label>
                        <input value={i.doctorNote || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'doctorNote', e.target.value)} placeholder="" className="w-full p-1 border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent text-sm dark:text-gray-200"/>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">預約回診</label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5 shrink-0">
                            <button type="button" onClick={() => listOps.update('medicalLocations', i.id, 'isFollowUp', false)} className={`px-2 py-1 text-xs rounded transition-all ${!i.isFollowUp ? 'bg-white dark:bg-gray-600 shadow text-gray-700 dark:text-gray-200 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>否</button>
                            <button type="button" onClick={() => listOps.update('medicalLocations', i.id, 'isFollowUp', true)} className={`px-2 py-1 text-xs rounded transition-all ${i.isFollowUp ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>是</button>
                        </div>
                        {i.isFollowUp && (
                            <div className="flex items-center gap-2 flex-1 min-w-[150px] animate-fade-in">
                                <RocDateSelect 
                                    value={i.followUpDate} 
                                    onChange={e=>listOps.update('medicalLocations', i.id, 'followUpDate', e.target.value)} 
                                    className="rounded h-[32px] w-[120px] shrink-0"
                                    textClass="text-xs"
                                />
                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">號碼</span>
                                    <input value={i.followUpNumber || ''} onChange={e=>listOps.update('medicalLocations', i.id, 'followUpNumber', e.target.value)} className="w-12 p-1 text-xs border-b border-blue-300 dark:border-blue-700 outline-none bg-transparent dark:text-gray-200 text-center"/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
});

const HealthCheckList = React.memo(({ records, listOps }) => (
    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-100 dark:border-green-900">
        <div className="flex justify-between items-center mb-2"><span className="font-bold text-green-800 dark:text-green-300">健康檢查</span><button type="button" onClick={()=>listOps.add('healthCheckRecords', {time:'', checkLocation:'', height:'', weight:''})} className="bg-green-200 dark:bg-green-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-green-800 dark:text-green-300"><PlusCircle className="w-3 h-3"/> 新增</button></div>
        {records.length === 0 && <div className="text-gray-400 dark:text-gray-500 text-sm text-left pl-2 py-2 italic">目前無記錄</div>}
        {records.map(i => (
            <div key={i.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-200 dark:border-green-800/50 mb-3 space-y-3 shadow-sm relative">
                <div className="flex items-center justify-between"><TimeSelect value={i.time} onChange={e=>listOps.update('healthCheckRecords', i.id, 'time', e.target.value)} className="w-[130px] h-[40px] shrink-0 focus-within:ring-green-300"/><button type="button" onClick={()=>listOps.remove('healthCheckRecords', i.id)} className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded shrink-0"><Trash2 className="w-4 h-4"/></button></div>
                <div className="flex items-center gap-2 w-full"><input value={i.checkLocation || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'checkLocation', e.target.value)} placeholder="醫院/診所" className="w-full p-1 text-sm border-b border-green-300 dark:border-green-700 outline-none bg-transparent dark:text-gray-200" /></div>

                <div className="flex flex-wrap sm:flex-nowrap gap-4">
                    <div className="flex items-center gap-2"><label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">身高</label><div className="relative w-24"><input value={i.height || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'height', e.target.value)} className="w-full p-2 pr-11 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-green-400 outline-none h-[40px] text-right dark:text-gray-200" /><span className="absolute right-2 top-2.5 text-gray-500 dark:text-gray-400 text-sm">公分</span></div></div>
                    <div className="flex items-center gap-2"><label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">體重</label><div className="relative w-24"><input value={i.weight || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'weight', e.target.value)} className="w-full p-2 pr-11 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-green-400 outline-none h-[40px] text-right dark:text-gray-200" /><span className="absolute right-2 top-2.5 text-gray-500 dark:text-gray-400 text-sm">公斤</span></div></div>
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                    <label className={`flex items-center justify-center gap-1.5 cursor-pointer select-none border rounded px-2 h-[36px] transition-colors whitespace-nowrap text-xs font-bold w-fit ${i.isVaccine ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/50 dark:border-green-500 dark:text-green-300' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                        <input type="checkbox" className="hidden" checked={i.isVaccine || false} onChange={e=>listOps.update('healthCheckRecords', i.id, 'isVaccine', e.target.checked)} />
                        <span>施打疫苗</span>
                    </label>
                    {i.isVaccine && (
                        <div className="flex items-center gap-2 w-full">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">名稱</label>
                            <input value={i.vaccineName || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'vaccineName', e.target.value)} placeholder="疫苗名稱" className="w-full p-1 text-xs border-b border-green-300 dark:border-green-700 outline-none bg-transparent dark:text-gray-200"/>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                <div className="flex flex-col sm:flex-row gap-4">
                     <div className="flex items-center gap-2 flex-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">左眼</label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5 shrink-0">
                            <button type="button" onClick={() => listOps.update('healthCheckRecords', i.id, 'leftEyeStatus', i.leftEyeStatus === 'normal' ? '' : 'normal')} className={`px-2 py-1 text-xs rounded transition-all ${i.leftEyeStatus === 'normal' ? 'bg-white dark:bg-gray-600 shadow text-green-600 dark:text-green-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>正常</button>
                            <button type="button" onClick={() => listOps.update('healthCheckRecords', i.id, 'leftEyeStatus', i.leftEyeStatus === 'abnormal' ? '' : 'abnormal')} className={`px-2 py-1 text-xs rounded transition-all ${i.leftEyeStatus === 'abnormal' ? 'bg-white dark:bg-gray-600 shadow text-red-500 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>異常</button>
                        </div>
                        {i.leftEyeStatus==='abnormal' && <input value={i.leftEyeAbnormalReason || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'leftEyeAbnormalReason', e.target.value)} placeholder="原因" className="flex-1 min-w-0 p-1 text-xs border-b border-green-300 dark:border-green-700 outline-none bg-transparent dark:text-gray-200"/>}
                     </div>
                     <div className="flex items-center gap-2 flex-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">右眼</label>
                         <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5 shrink-0">
                            <button type="button" onClick={() => listOps.update('healthCheckRecords', i.id, 'rightEyeStatus', i.rightEyeStatus === 'normal' ? '' : 'normal')} className={`px-2 py-1 text-xs rounded transition-all ${i.rightEyeStatus === 'normal' ? 'bg-white dark:bg-gray-600 shadow text-green-600 dark:text-green-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>正常</button>
                            <button type="button" onClick={() => listOps.update('healthCheckRecords', i.id, 'rightEyeStatus', i.rightEyeStatus === 'abnormal' ? '' : 'abnormal')} className={`px-2 py-1 text-xs rounded transition-all ${i.rightEyeStatus === 'abnormal' ? 'bg-white dark:bg-gray-600 shadow text-red-500 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>異常</button>
                        </div>
                        {i.rightEyeStatus==='abnormal' && <input value={i.rightEyeAbnormalReason || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'rightEyeAbnormalReason', e.target.value)} placeholder="原因" className="flex-1 min-w-0 p-1 text-xs border-b border-green-300 dark:border-green-700 outline-none bg-transparent dark:text-gray-200"/>}
                     </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                         <label className="text-xs font-bold text-green-700 dark:text-green-400 whitespace-nowrap min-w-[3em]">牙齒</label>
                         <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5 shrink-0">
                            <button type="button" onClick={() => listOps.update('healthCheckRecords', i.id, 'oralStatus', i.oralStatus === 'normal' ? '' : 'normal')} className={`px-2 py-1 text-xs rounded transition-all ${i.oralStatus === 'normal' ? 'bg-white dark:bg-gray-600 shadow text-green-600 dark:text-green-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>正常</button>
                            <button type="button" onClick={() => listOps.update('healthCheckRecords', i.id, 'oralStatus', i.oralStatus === 'abnormal' ? '' : 'abnormal')} className={`px-2 py-1 text-xs rounded transition-all ${i.oralStatus === 'abnormal' ? 'bg-white dark:bg-gray-600 shadow text-red-500 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>異常</button>
                        </div>
                         {i.oralStatus==='abnormal' && <input value={i.oralAbnormalReason || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'oralAbnormalReason', e.target.value)} placeholder="原因" className="flex-1 min-w-0 p-1 text-xs border-b border-green-300 dark:border-green-700 outline-none bg-transparent dark:text-gray-200"/>}
                    </div>
                    <div className="flex items-center gap-2 pl-[3em]">
                        <label className="flex items-center gap-1 cursor-pointer select-none whitespace-nowrap shrink-0"><input type="checkbox" checked={i.isOralCare || false} onChange={e=>listOps.update('healthCheckRecords', i.id, 'isOralCare', e.target.checked)} className="w-3 h-3 text-green-600 rounded focus:ring-green-50 border-gray-300"/><span className="text-xs text-green-700 dark:text-green-400">保健</span></label>
                        {i.isOralCare && <input value={i.oralCareItem || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'oralCareItem', e.target.value)} placeholder="項目" className="flex-1 min-w-0 p-1 text-xs border-b border-green-300 dark:border-green-700 outline-none bg-transparent dark:text-gray-200"/>}
                    </div>
                </div>

                 <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">費用</label>
                    <div className="relative w-32">
                        <input value={i.cost || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'cost', e.target.value)} placeholder="" className="w-full p-2 pl-7 pr-8 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-green-400 outline-none h-[40px] dark:text-gray-200 text-right" />
                        <span className="absolute left-2 top-2.5 text-gray-400 dark:text-gray-500"><DollarSign className="w-4 h-4"/></span>
                        <span className="absolute right-2 top-2.5 text-gray-500 dark:text-gray-400 text-sm">元</span>
                    </div>
                </div>

                 <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[3em]">醫生叮囑</label>
                    <input value={i.doctorNote || ''} onChange={e=>listOps.update('healthCheckRecords', i.id, 'doctorNote', e.target.value)} placeholder="" className="w-full p-1 border-b border-green-300 dark:border-green-700 outline-none bg-transparent text-sm dark:text-gray-200"/>
                 </div>
            </div>
        ))}
    </div>
));

export const HealthSection = React.memo(({ formData, handleChange, listOps, showToast, scrollToElement, onScrollTop, handlers, isLocked }) => {
    const hasData = Boolean(formData.healthCardStatus || formData.oralCareRecords?.length > 0 || formData.symptoms?.length > 0 || formData.injuryRecords?.length > 0 || formData.medications?.length > 0 || formData.medicalLocations?.length > 0 || formData.healthCheckRecords?.length > 0 || formData.oralCareReferToSchool);
    const [isExpanded, toggle] = useSectionExpand('health', formData.date, hasData);

    return (
        <section id="health" className="scroll-mt-28 pt-4 border-t-2 border-gray-500">
            <SectionHeader id="health" title="健康與醫療" icon={HeartPlus} colorClass="text-teal-600" bgClass="bg-teal-50" onScrollTop={onScrollTop} isExpanded={isExpanded} onToggle={toggle}/>
            {isExpanded && (
            <div className={`mt-4 space-y-4 animate-fade-in transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"><label className="block text-sm font-bold mb-2 dark:text-gray-200">健保卡確認</label><RadioGroup name="healthCardStatus" options={OPTIONS.HEALTH_CARD} value={formData.healthCardStatus} onChange={handleChange} /></div>
                
                <div className="bg-teal-50 dark:bg-teal-950 p-4 rounded-lg border border-teal-100 dark:border-teal-900">
                    <div className="flex justify-between items-start sm:items-center mb-2 gap-2 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-bold text-teal-800 dark:text-teal-200">口腔保健</span>
                            <label className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" name="oralCareReferToSchool" checked={formData.oralCareReferToSchool} onChange={handleChange} className="w-3 h-3"/>
                                <span className="text-xs text-blue-600 dark:text-blue-300">參考學校聯絡簿</span>
                            </label>
                        </div>
                        <button type="button" onClick={()=>listOps.add('oralCareRecords', {time:'晚上', type:'刷牙'})} className="bg-teal-200 dark:bg-teal-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-teal-800 dark:text-teal-200 shrink-0"><PlusCircle className="w-3 h-3"/> 新增</button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">{formData.oralCareRecords.map(i => (<div key={i.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border border-teal-200 dark:border-teal-900/50"><select value={i.time} onChange={e=>listOps.update('oralCareRecords', i.id, 'time', e.target.value)} className="border rounded text-sm p-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 flex-1 min-w-[4rem]">
                            {OPTIONS.ORAL_TIMES.map(o=><option key={o} value={o}>{o}</option>)}
                        </select><select value={i.type} onChange={e=>listOps.update('oralCareRecords', i.id, 'type', e.target.value)} className="border rounded text-sm p-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 flex-1 min-w-[4rem]">{OPTIONS.ORAL_TYPES.map(o=><option key={o} value={o}>{o}</option>)}</select><button type="button" onClick={()=>listOps.remove('oralCareRecords', i.id)} className="text-red-500 dark:text-red-400 ml-auto"><Trash2 className="w-4 h-4"/></button></div>))}</div>
                </div>
                <SymptomList symptoms={formData.symptoms} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} handlers={handlers} />
                <InjuryList injuryRecords={formData.injuryRecords} listOps={listOps} showToast={showToast} scrollToElement={scrollToElement} handlers={handlers} />
                <MedicationList medications={formData.medications} listOps={listOps} scrollToElement={scrollToElement} handlers={handlers}/>
                <MedicalLocationList medicalLocations={formData.medicalLocations} listOps={listOps} scrollToElement={scrollToElement} handlers={handlers}/>
                <HealthCheckList records={formData.healthCheckRecords} listOps={listOps} />
            </div>
            )}
        </section>
    );
});
