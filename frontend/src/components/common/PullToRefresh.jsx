import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Native-feeling Pull-to-Refresh component for PWA & mobile devices
 */
export default function PullToRefresh({ children, onRefresh }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const TRIGGER_DISTANCE = 70;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0 && !refreshing) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!isPullingRef.current || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0 && window.scrollY === 0) {
      // Apply dampening formula for natural resistance
      const distance = Math.min(diff * 0.45, 110);
      setPullDistance(distance);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current || refreshing) return;
    isPullingRef.current = false;

    if (pullDistance >= TRIGGER_DISTANCE) {
      setRefreshing(true);
      setPullDistance(50);
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Default reload
          window.location.reload();
        }
      } catch (e) {
        console.error('Refresh error:', e);
      } finally {
        setTimeout(() => {
          setRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-screen"
    >
      {/* Pull down indicator container */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance > 0 ? pullDistance : -60}px)`,
          opacity: pullDistance > 10 ? 1 : 0
        }}
      >
        <div className="bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 p-2.5 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
            style={{
              transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)`
            }}
          />
        </div>
      </div>

      {children}
    </div>
  );
}
