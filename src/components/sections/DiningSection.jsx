import React from 'react';
import { Utensils, RotateCcw, PlusCircle, Trash2 } from 'lucide-react';
import { SectionHeader } from '../common/SectionHeader';
import { TimeSelect } from '../common/FormElements';
import { MealBlock } from '../common/SharedBlocks';
import { OPTIONS } from '../../constants/config';
import { useSectionExpand } from '../../hooks/useSectionExpand';

export const DiningSection = React.memo(({ formData, handleChange, listOps, onScrollTop, handlers, isLocked }) => {
    const hasData = Boolean(formData.mealBreakfast || formData.mealLunch || formData.mealDinner || formData.snackRecords?.length > 0 || formData.lunchReferToSchool || formData.snackReferToSchool || formData.appetiteBreakfast || formData.waterBreakfast || formData.appetiteLunch || formData.waterLunch || formData.appetiteDinner || formData.waterDinner);
    const [isExpanded, toggle] = useSectionExpand('food', formData.date, hasData);

    return (
        <section id="food" className="scroll-mt-28 pt-4 border-t-2 border-gray-500">
            <SectionHeader id="food" title="飲食與點心" icon={Utensils} colorClass="text-green-600" bgClass="bg-green-50" onScrollTop={onScrollTop} isExpanded={isExpanded} onToggle={toggle}/>
            {isExpanded && (
            <div className={`mt-4 space-y-4 animate-fade-in transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                
                <MealBlock title="早餐" mealType="Breakfast" formData={formData} handleChange={handleChange} handlers={handlers} />
                
                <MealBlock 
                    title="午餐" 
                    mealType="Lunch" 
                    formData={formData} 
                    handleChange={handleChange} 
                    handlers={handlers} 
                    isFaded={formData.lunchReferToSchool}
                    referCheckbox={
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" name="lunchReferToSchool" checked={formData.lunchReferToSchool} onChange={handleChange} className="w-3 h-3 text-green-600"/>
                            <span className="text-xs text-blue-600 dark:text-blue-400">參考學校聯絡簿</span>
                        </label>
                    }
                />
                
                <MealBlock title="晚餐" mealType="Dinner" formData={formData} handleChange={handleChange} handlers={handlers} />

                {/* 點心區塊 */}
                <div className="bg-[#f1f6f3] dark:bg-green-950 p-4 rounded-lg border border-green-100 dark:border-green-900">
                    <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-3"><span className="text-base font-bold text-green-800 dark:text-green-300">點心</span><label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" name="snackReferToSchool" checked={formData.snackReferToSchool} onChange={handleChange} className="w-3 h-3 text-green-600"/><span className="text-xs text-blue-600 dark:text-blue-400">參考學校聯絡簿</span></label></div><button type="button" onClick={()=>listOps.add('snackRecords', {time:'', content:'', appetite:'', water:''})} className="bg-green-200 dark:bg-green-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 text-green-800 dark:text-green-300"><PlusCircle className="w-3 h-3"/> 新增</button></div>
                    {formData.snackRecords.map(s => (
                        <div key={s.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-800/50 mb-3 flex flex-col gap-3 relative shadow-sm">
                            <button type="button" onClick={()=>listOps.resetFields('snackRecords', s.id, ['time', 'content', 'appetite', 'water'])} className="absolute top-3 right-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full transition-colors"><RotateCcw className="w-4 h-4"/></button>
                            <button type="button" onClick={()=>listOps.remove('snackRecords', s.id)} className="absolute top-3 right-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-full transition-colors"><Trash2 className="w-4 h-4"/></button>
                            
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pr-16">
                                <div className="flex flex-col gap-1"><span className="text-sm font-bold text-gray-600 dark:text-gray-400 block">時間</span><TimeSelect value={s.time} onChange={e=>listOps.update('snackRecords', s.id, 'time', e.target.value)}/></div>
                                <div className="flex flex-nowrap gap-x-6">
                                     <div className="flex flex-col gap-1"><span className="text-sm font-bold text-gray-600 dark:text-gray-400">食慾</span><select value={s.appetite || ''} onChange={e=>listOps.update('snackRecords', s.id, 'appetite', e.target.value)} className="border rounded-lg h-[40px] w-full min-w-[80px] bg-white dark:bg-gray-800 dark:border-gray-600"><option value="" disabled>請選擇</option>{OPTIONS.APPETITE.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                                     <div className="flex flex-col gap-1"><span className="text-sm font-bold text-gray-600 dark:text-gray-400">飲水</span><select value={s.water || ''} onChange={e=>listOps.update('snackRecords', s.id, 'water', e.target.value)} className="border rounded-lg h-[40px] w-full min-w-[80px] bg-white dark:bg-gray-800 dark:border-gray-600"><option value="" disabled>請选择</option>{OPTIONS.WATER.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                                </div>
                            </div>
                            <input value={s.content || ''} onChange={e=>listOps.update('snackRecords', s.id, 'content', e.target.value)} autoComplete="off" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 outline-none text-sm focus:border-green-500 transition-colors dark:text-gray-200" placeholder="點心內容"/>
                        </div>
                    ))}
                </div>
            </div>
            )}
        </section>
    );
});
