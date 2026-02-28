import React, { useMemo } from 'react';
import { Database, AlertCircle, CalendarDays } from 'lucide-react';

export const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 animate-scale-up">
            {children}
        </div>
    </div>
);

export const ConfirmModal = ({ title, content, onConfirm, onCancel, confirmText="確認", cancelText="取消" }) => (
    <Modal onClose={onCancel}>
        <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400"/>
                {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-base leading-relaxed">{content}</p>
            <div className="flex justify-end gap-3">
                <button onClick={onCancel} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium">{cancelText}</button>
                <button onClick={onConfirm} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium">{confirmText}</button>
            </div>
        </div>
    </Modal>
);

export const ErrorModal = ({ content, onClose }) => (
    <Modal onClose={onClose}>
        <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400"/>無法匯入
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-base leading-relaxed">{content}</p>
            <div className="flex justify-end">
                <button onClick={onClose} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium">知道了</button>
            </div>
        </div>
    </Modal>
);

export const HistoryModal = ({ recordedDates, currentDate, onSelectDate, onClose }) => {
    const grouped = useMemo(() => {
        const sorted = [...recordedDates].sort((a, b) => a.localeCompare(b));
        return sorted.reduce((acc, date) => {
            const ym = date.slice(0, 7);
            if (!acc[ym]) acc[ym] = [];
            acc[ym].push(date);
            return acc;
        }, {});
    }, [recordedDates]);

    const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return (
        <Modal onClose={onClose}>
            <div className="p-6 max-h-[80vh] flex flex-col dark:bg-gray-800 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-blue-600"/>歷史紀錄總覽
                </h3>
                <div className="overflow-y-auto pr-2 space-y-4 flex-1 hide-scrollbar">
                    {sortedMonths.map((ym) => {
                        const [y, m] = ym.split('-');
                        const dates = grouped[ym];
                        return (
                            <div key={ym} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <span>{y-1911}年{m}月</span>
                                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{dates.length} 筆</span>
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {dates.map(date => {
                                        const d = date.split('-')[2];
                                        const isActive = date === currentDate;
                                        return (
                                            <button 
                                                key={date} 
                                                onClick={() => onSelectDate(date)} 
                                                className={`px-3 py-1 border rounded-md transition-colors text-sm font-medium shadow-sm ${
                                                    isActive 
                                                        ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
                                                        : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                                }`}
                                            >
                                                {d}日
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                    {recordedDates.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-4">目前還沒有任何記錄哦！</p>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600">關閉</button>
                </div>
            </div>
        </Modal>
    );
};