import React from 'react';
import { Save, Calendar, Database, Upload, Download, ImageUp, Trash2, Loader2 } from 'lucide-react';
import { useSectionExpand } from '../../hooks/useSectionExpand';

export const FileSection = React.memo(({ onExportJSON, onImportJSON, onClearToday, onClearAll, isBulkExporting, isBatchImageExporting, processBulkImport, onBulkExportJSON, onExportImage, onBulkExportImage }) => {
    const [isExpanded, toggle] = useSectionExpand('files', null, true, true);
    
    return (
        <section id="files" className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 scroll-mt-28">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                <Save className="w-5 h-5"/> 檔案管理
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 單日資料區塊 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex flex-col h-full shadow-sm">
                    <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-4"><Calendar className="w-5 h-5"/>單筆資料</h3>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        <button type="button" onClick={onExportJSON} className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm font-semibold shadow-sm h-full text-center">
                            <Upload className="w-5 h-5 sm:w-6 sm:h-6"/> 匯出單筆
                        </button>
                        <label className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 p-3 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm font-semibold shadow-sm h-full text-center">
                            <Download className="w-5 h-5 sm:w-6 sm:h-6"/> 匯入單筆
                            <input type="file" accept=".json" onChange={onImportJSON} className="hidden" />
                        </label>
                        <button type="button" onClick={onExportImage} className="flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-transform active:scale-95 shadow-sm font-bold text-xs sm:text-sm h-full text-center">
                            <ImageUp className="w-5 h-5 sm:w-6 sm:h-6"/> 匯出圖片
                        </button>
                        <button type="button" onClick={onClearToday} className="flex flex-col items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 p-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs sm:text-sm font-bold shadow-sm h-full text-center">
                            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6"/> 刪除單筆
                        </button>
                    </div>
                </div>

                {/* 歷史資料區塊 */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col h-full shadow-sm">
                    <h3 className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 mb-4"><Database className="w-5 h-5"/>歷史資料</h3>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        <button type="button" onClick={onBulkExportJSON} disabled={isBulkExporting || isBatchImageExporting} className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 p-3 rounded-xl transition-colors disabled:opacity-50 hover:bg-indigo-50 dark:hover:bg-gray-700 text-xs sm:text-sm font-semibold shadow-sm h-full text-center">
                            {isBulkExporting ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin"/> : <Upload className="w-5 h-5 sm:w-6 sm:h-6"/>} 
                            匯出所有
                        </button>
                        <label className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 p-3 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm font-semibold shadow-sm h-full text-center">
                            <Download className="w-5 h-5 sm:w-6 sm:h-6"/> 匯入所有
                            <input type="file" accept=".json" onChange={(e) => processBulkImport(e.target.files[0])} className="hidden" />
                        </label>
                        <button type="button" onClick={onBulkExportImage} disabled={isBulkExporting || isBatchImageExporting} className="flex flex-col items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-transform active:scale-95 shadow-sm font-bold text-xs sm:text-sm disabled:opacity-50 disabled:active:scale-100 h-full text-center">
                            {isBatchImageExporting ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin"/> : <ImageUp className="w-5 h-5 sm:w-6 sm:h-6"/>} 
                            批次圖片
                        </button>
                        <button type="button" onClick={onClearAll} className="flex flex-col items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 p-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs sm:text-sm font-bold shadow-sm h-full text-center">
                            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6"/> 刪除歷史
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
});
