// ──────────────────────────────────────────────────
// Golden Leaf Finance — Tabs Component
// Accessible WAI-ARIA tablist with ArrowLeft / ArrowRight / Home / End
// keyboard navigation, smooth animated indicator, and touch-target standards.
// ──────────────────────────────────────────────────

import React, { useState, useRef } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  className,
  variant = 'default',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const tabButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = -1;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    }

    if (nextIndex >= 0 && nextIndex < tabs.length) {
      const nextTab = tabs[nextIndex];
      handleTabChange(nextTab.id);
      const btn = tabButtonRefs.current.get(nextTab.id);
      btn?.focus();
    }
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={clsx('w-full min-w-0', className)}>
      {/* Tab Headers */}
      <div
        className={clsx(
          'flex overflow-x-auto custom-scrollbar overscroll-x-contain',
          variant === 'default' && 'border-b border-surface-muted gap-0',
          variant === 'pills' && 'bg-surface-cream rounded-xl p-1 gap-1'
        )}
        role="tablist"
        aria-orientation="horizontal"
      >
        {tabs.map((tab, index) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabButtonRefs.current.set(tab.id, el);
                else tabButtonRefs.current.delete(tab.id);
              }}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => handleTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={clsx(
                'relative flex items-center gap-2 font-medium text-sm font-body transition-all whitespace-nowrap flex-shrink-0 min-h-[44px] cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-lg',
                variant === 'default' && [
                  'px-4 py-2.5 -mb-px border-b-2',
                  isSelected
                    ? 'border-gold-500 text-gold-600 font-semibold'
                    : 'border-transparent text-rich-silver hover:text-rich-charcoal hover:border-gold-200',
                ],
                variant === 'pills' && [
                  'px-4 py-2 rounded-lg flex-1 justify-center',
                  isSelected
                    ? 'bg-white text-rich-black shadow-card font-semibold'
                    : 'text-rich-silver hover:text-rich-charcoal',
                ]
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gold-100 text-gold-700 text-xs font-semibold">
                  {tab.badge}
                </span>
              )}
              {variant === 'default' && isSelected && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500"
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        className="mt-4 focus-visible:outline-none"
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
      >
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {activeContent}
        </motion.div>
      </div>
    </div>
  );
};
