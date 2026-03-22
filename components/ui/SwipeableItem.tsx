import React, { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableItemProps {
    children: React.ReactNode;
    onSwipeLeft: () => void;
    threshold?: number;
    enabled?: boolean;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({ children, onSwipeLeft, threshold = 100, enabled = true }) => {
    const [offsetX, setOffsetX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const itemRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!enabled) return;
        touchStartX.current = e.touches[0].clientX;
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!enabled || touchStartX.current === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartX.current;

        // Only allow swiping left (negative diff)
        if (diff < 0) {
            setOffsetX(diff);
        }
    };

    const handleTouchEnd = () => {
        if (!enabled) return;
        setIsSwiping(false);
        if (offsetX < -threshold) {
            // Swiped far enough
            onSwipeLeft();
            setOffsetX(0); // Reset or keep it open? Reset for now as action triggers delete
        } else {
            // Snap back
            setOffsetX(0);
        }
        touchStartX.current = null;
    };

    return (
        <div className="relative overflow-hidden mb-3 select-none">
            {/* Background Action (Delete) */}
            <div className="absolute inset-y-0 right-0 w-full bg-red-500 flex items-center justify-end px-6 rounded-xl">
                <Trash2 className="text-white" size={20} />
            </div>

            {/* Content */}
            <div
                ref={itemRef}
                className="relative bg-white transition-transform duration-200 ease-out"
                style={{ transform: `translateX(${offsetX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
};
