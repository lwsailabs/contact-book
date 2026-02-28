import { useState, useEffect, useCallback } from 'react';

export const useSectionExpand = (sectionId, date, hasData, forceExpand = false) => {
    const [isExpanded, setIsExpanded] = useState(forceExpand || hasData);
    
    useEffect(() => {
        setIsExpanded(forceExpand || hasData);
    }, [date, forceExpand, hasData]);

    useEffect(() => {
        const handleExpand = (e) => {
            if (e.detail === sectionId) setIsExpanded(true);
        };
        window.addEventListener('expandSection', handleExpand);
        return () => window.removeEventListener('expandSection', handleExpand);
    }, [sectionId]);

    const toggle = useCallback(() => setIsExpanded(p => !p), []);
    return [isExpanded, toggle];
};