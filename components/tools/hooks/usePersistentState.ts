import { useState, useEffect } from 'react';

export const usePersistentState = <T>(key: string, initialValue: T) => {
    const [state, setState] = useState<T>(() => {
        const item = localStorage.getItem(`tool_${key}`);
        if (item === null) return initialValue;
        try {
            const parsed = JSON.parse(item);
            // Handle legacy raw strings that look like numbers (e.g. timestamps "1738...")
            if (typeof initialValue === 'string' && typeof parsed !== 'string') {
                return item as unknown as T;
            }
            return parsed;
        } catch {
            return item as unknown as T;
        }
    });

    useEffect(() => {
        localStorage.setItem(`tool_${key}`, JSON.stringify(state));
    }, [state, key]);

    return [state, setState] as const;
};
