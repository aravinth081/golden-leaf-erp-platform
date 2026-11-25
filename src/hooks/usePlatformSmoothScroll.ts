// ──────────────────────────────────────────────────
// Golden Leaf Finance — Platform Smooth Scroll & Keyboard Navigation
// Zero scroll-jacking, natural trackpad/mouse-wheel physics,
// 4-way keyboard navigation, and full accessibility support.
// ──────────────────────────────────────────────────

import { useEffect } from 'react';

export function usePlatformSmoothScroll() {
  useEffect(() => {
    // ── Helper: Check if user prefers reduced motion ──────────────────────
    const prefersReducedMotion = (): boolean => {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };

    // ── Helper: Check if element is an editable input/control ─────────────
    const isEditableElement = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      if (el.getAttribute('contenteditable') === 'true') return true;
      if (el.getAttribute('role') === 'textbox' || el.getAttribute('role') === 'combobox') return true;
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return true;
      return false;
    };

    // ── Helper: Find the active vertical scroll container ─────────────────
    const findVerticalContainer = (dir: 'up' | 'down'): HTMLElement | null => {
      // 1. Check if a modal/dialog is open
      const modal = document.querySelector('[role="dialog"], .modal-responsive-container, [data-modal]');
      if (modal instanceof HTMLElement) {
        const scrollableInModal = modal.querySelector('.overflow-y-auto, [class*="overflow-y"]') as HTMLElement | null;
        if (scrollableInModal) return scrollableInModal;
        return modal;
      }

      // 2. Check active element ancestor
      const active = document.activeElement;
      if (active && active !== document.body && active !== document.documentElement) {
        const scrollParent = active.closest('#main-content-scroll, .overflow-y-auto, main');
        if (scrollParent instanceof HTMLElement) {
          return scrollParent;
        }
      }

      // 3. Fallback to main layout scroll container
      const main = document.getElementById('main-content-scroll') || document.querySelector('main');
      if (main instanceof HTMLElement) {
        return main;
      }

      return (document.scrollingElement || document.documentElement) as HTMLElement;
    };

    // ── Helper: Find active horizontal scroll container ───────────────────
    const findHorizontalContainer = (dir: 'left' | 'right'): HTMLElement | null => {
      const active = document.activeElement;
      if (active) {
        const tableContainer = active.closest('.overflow-x-auto, [class*="overflow-x-auto"]');
        if (tableContainer instanceof HTMLElement) {
          return tableContainer;
        }
      }

      const visibleTable = document.querySelector('.overflow-x-auto, [class*="overflow-x-auto"]');
      if (visibleTable instanceof HTMLElement) {
        return visibleTable;
      }

      return null;
    };

    // ── Keyboard Navigation Controller ────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept when user is typing in forms or content editors
      if (isEditableElement(document.activeElement)) return;
      if (e.defaultPrevented) return;

      const key = e.key;
      const smooth = !prefersReducedMotion();
      const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';

      // ── Vertical Navigation: ArrowDown, ArrowUp
      if (key === 'ArrowDown') {
        const target = findVerticalContainer('down');
        if (target) {
          e.preventDefault();
          target.scrollBy({ top: 85, left: 0, behavior });
        }
      } else if (key === 'ArrowUp') {
        const target = findVerticalContainer('up');
        if (target) {
          e.preventDefault();
          target.scrollBy({ top: -85, left: 0, behavior });
        }
      }

      // ── PageUp / PageDown
      else if (key === 'PageDown') {
        const target = findVerticalContainer('down');
        if (target) {
          e.preventDefault();
          const pageDelta = Math.max(120, Math.round(target.clientHeight * 0.8));
          target.scrollBy({ top: pageDelta, left: 0, behavior });
        }
      } else if (key === 'PageUp') {
        const target = findVerticalContainer('up');
        if (target) {
          e.preventDefault();
          const pageDelta = Math.max(120, Math.round(target.clientHeight * 0.8));
          target.scrollBy({ top: -pageDelta, left: 0, behavior });
        }
      }

      // ── Space / Shift + Space (Page scroll when not on interactive button)
      else if (key === ' ' || key === 'Spacebar') {
        const active = document.activeElement;
        const isInteractive = active && (
          active.tagName === 'BUTTON' ||
          active.getAttribute('role') === 'button' ||
          active.getAttribute('role') === 'tab' ||
          active.tagName === 'A'
        );
        if (!isInteractive) {
          e.preventDefault();
          const target = findVerticalContainer(e.shiftKey ? 'up' : 'down');
          if (target) {
            const pageDelta = Math.max(120, Math.round(target.clientHeight * 0.75));
            target.scrollBy({ top: e.shiftKey ? -pageDelta : pageDelta, left: 0, behavior });
          }
        }
      }

      // ── Home / End Navigation
      else if (key === 'Home') {
        const target = findVerticalContainer('up');
        if (target) {
          e.preventDefault();
          target.scrollTo({ top: 0, left: 0, behavior });
        }
      } else if (key === 'End') {
        const target = findVerticalContainer('down');
        if (target) {
          e.preventDefault();
          target.scrollTo({ top: target.scrollHeight, left: 0, behavior });
        }
      }

      // ── Horizontal Navigation: ArrowRight, ArrowLeft
      else if (key === 'ArrowRight' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const target = findHorizontalContainer('right');
        if (target) {
          e.preventDefault();
          target.scrollBy({ left: 120, top: 0, behavior });
        }
      } else if (key === 'ArrowLeft' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const target = findHorizontalContainer('left');
        if (target) {
          e.preventDefault();
          target.scrollBy({ left: -120, top: 0, behavior });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
