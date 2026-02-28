import React from 'react';
import { ArrowUp, ChevronUp } from 'lucide-react';

export const SectionHeader = React.memo(({ id, title, icon: Icon, colorClass, bgClass, onScrollTop, isExpanded, onToggle }) => (
    <div 
        className={`flex items-center justify-between border-b ${colorClass.replace('text', 'border')} pb-2 cursor-pointer select-none group`} 
        onClick={onToggle}
    >
        <h2 className={`flex items-center gap-2 text-lg font-semibold ${colorClass} group-hover:opacity-80 transition-opacity`}>
            <Icon className="w-5 h-5" /> {title}
        </h2>
        <div className="flex items-center gap-2">
            <button 
                onClick={(e) => { e.stopPropagation(); onScrollTop(id); }} 
                className={`p-1.5 rounded-full ${bgClass} ${colorClass.replace('text-600', 'text-400')} hover:${bgClass.replace('50', '100')} transition-colors`} 
                title="回到頂部"
            >
                <ArrowUp className="w-4 h-4" />
            </button>
            {onToggle && (
                <div className={`p-1.5 rounded-full ${bgClass} ${colorClass.replace('text-600', 'text-400')} transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`}>
                    <ChevronUp className="w-4 h-4" />
                </div>
            )}
        </div>
    </div>
));