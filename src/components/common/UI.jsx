import React, { useEffect } from 'react';
import { AlertCircle, Check, Info, X } from 'lucide-react';

export const Skeleton = ({ className }) => <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;

export const FormSkeleton = () => (
    <div className="space-y-8 animate-fade-in">
        <div className="space-y-4">
            <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    </div>
);

export const Toast = React.memo(({ message, type = 'info', onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-emerald-600' : 'bg-gray-800';
  const Icon = type === 'error' ? AlertCircle : type === 'success' ? Check : Info;
  return (
    <div className={`fixed bottom-6 right-6 ${bg} text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-slide-up z-[60]`}>
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose}><X className="w-3 h-3" /></button>
    </div>
  );
});