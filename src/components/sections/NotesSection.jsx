import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText, NotebookPen, ClipboardList } from 'lucide-react';
import { SectionHeader } from '../common/SectionHeader';
import { OPTIONS } from '../../constants/config';
import { useSectionExpand } from '../../hooks/useSectionExpand';

export const NotesSection = React.memo(({ formData, handleChange, onScrollTop, generatedText, onCopy, copySuccess, isLocked }) => {
    const globalHasData = useMemo(() => {
        const ignoredKeys = ['date', 'weatherSearchQuery', 'isLocked', 'lastUpdated'];
        for (const key in formData) {
            if (ignoredKeys.includes(key)) continue;
            const val = formData[key];
            if (Array.isArray(val) && val.length > 0) return true;
            if (typeof val === 'string' && val.trim() !== '') return true;
            if (typeof val === 'boolean' && val === true) return true;
        }
        return false;
    }, [formData]);

    const [isExpanded, toggle] = useSectionExpand('notes', formData.date, globalHasData);
    const [localNotes, setLocalNotes] = useState(formData.notes || '');

    useEffect(() => {
        setLocalNotes(formData.notes || '');
    }, [formData.notes]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localNotes !== (formData.notes || '')) {
                handleChange({ target: { name: 'notes', value: localNotes } });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localNotes, formData.notes, handleChange]);

    const handleLocalNotesChange = useCallback((e) => {
        setLocalNotes(e.target.value);
    }, []);

    return (
        <section id="notes" className="scroll-mt-28 pt-4 border-t-2 border-gray-500">
            <SectionHeader id="notes" title="備註/日記" icon={FileText} colorClass="text-gray-600" bgClass="bg-gray-50" onScrollTop={onScrollTop} isExpanded={isExpanded} onToggle={toggle}/>
            {isExpanded && (
            <div className="mt-4 space-y-4 animate-fade-in">
                <div className={`space-y-4 transition-all duration-300 ${isLocked ? 'pointer-events-none opacity-70 select-none' : ''}`}>
                    <textarea name="notes" rows="3" value={localNotes} onChange={handleLocalNotesChange} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-gray-300 outline-none transition-shadow" />
                    <div className="mt-2"><label className="text-base font-bold flex gap-2 items-center dark:text-gray-300"><NotebookPen className="w-5 h-5"/> 記錄人</label><div className="flex gap-4 mt-2">{OPTIONS.RECORDERS.map(r=><label key={r} className="flex gap-1.5 cursor-pointer items-center dark:text-gray-300"><input type="radio" name="recorder" value={r} checked={formData.recorder===r} onChange={handleChange} className="text-blue-600 w-4 h-4"/><span className="text-base">{r}</span></label>)}</div></div>
                </div>
                <div id="capture-text" className="mt-6 border border-slate-700 rounded-xl overflow-hidden shadow-lg bg-slate-900 text-slate-200">
                    <div data-html2canvas-ignore="true" className="flex justify-between items-center bg-slate-950/50 px-3 sm:px-4 py-3 sm:py-4 border-b border-slate-700">
                        <h3 id="capture-header-text" className="text-base sm:text-xl font-bold text-slate-200 flex items-center gap-2 sm:gap-3 shrink-0">
                            <div className="bg-slate-800 p-1.5 sm:p-2 rounded-md border border-slate-700 shadow-sm">
                                <ClipboardList className="w-4 h-4 sm:w-6 sm:h-6 text-slate-300"/>
                            </div>
                            文字預覽
                        </h3>
                        <button 
                            type="button"
                            onClick={onCopy} 
                            className={`
                                flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-bold transition-all transform active:scale-95 shadow-sm whitespace-nowrap shrink-0
                                ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}
                            `}
                        >
                            {copySuccess ? '複製成功' : '一鍵複製'}
                        </button>
                    </div>
                    
                    <div className="p-3 sm:p-6 bg-slate-900">
                        <div id="preview-text-container" className="font-mono text-sm sm:text-[18px] leading-relaxed sm:leading-[32px] text-slate-300 min-h-[200px] w-full">
                        {generatedText ? generatedText.split('\n').map((line, index) => {
                            let prefix = '';
                            const headerMatch = line.match(/^([^：\n(]{1,30}：)/);
                            if (headerMatch) {
                                prefix = headerMatch[1];
                            } else {
                                const listMatch = line.match(/^(\s+(?:[-•]\s|\(\d+\)\s)?)/);
                                if (listMatch) prefix = listMatch[1];
                            }

                            if (prefix) {
                                const content = line.substring(prefix.length);
                                return (
                                    <div key={index} className="flex min-h-[1.5em] w-full">
                                        <span className="whitespace-pre shrink-0">{prefix}</span>
                                        <span className="break-words flex-1 whitespace-pre-wrap">{content}</span>
                                    </div>
                                );
                            }
                            return <div key={index} className="break-words min-h-[1.5em] whitespace-pre-wrap w-full">{line}</div>;
                        }) : <div className="whitespace-pre-wrap">尚無內容</div>}
                        </div>
                    </div>
                </div>
            </div>
            )}
        </section>
    );
});
