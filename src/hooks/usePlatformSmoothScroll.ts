// ──────────────────────────────────────────────────
// Golden Leaf Finance — Platform Smooth Scroll & Keyboard Navigation
// Zero scroll-jacking, natural trackpad/mouse-wheel physics,
// 4-way keyboard navigation, and full accessibility support.
// ──────────────────────────────────────────────────

import { useEffect, useRef } from 'react';

export function usePlatformSmoothScroll() {
  const hoveredElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // ── 1. Track element currently under cursor ──────────────────────────
    const handleMouseMove = (e: MouseEvent) => {
      hoveredElementRef.current = e.target as HTMLElement | null;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // ── Helper: Check if user prefers reduced motion ──────────────────────
    const prefersReducedMotion = (): boolean => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    // ── Helper: Check if element can scroll vertically ────────────────────
    const canScrollVertically = (el: HTMLElement, dir: 'up' | 'down'): boolean => {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
      if (!isScrollable && el.tagName.toLowerCase() !== 'main' && el.id !== 'main-content-scroll') return false;

      if (dir === 'down') {
        return el.scrollTop + el.clientHeight < el.scrollHeight - 2;
      } else {
        return el.scrollTop > 2;
      }
    };

    // ── Helper: Check if element can scroll horizontally ──────────────────
    const canScrollHorizontally = (el: HTMLElement, dir: 'left' | 'right'): boolean => {
      const style = window.getComputedStyle(el);
      const overflowX = style.overflowX;
      const isScrollable = overflowX === 'auto' || overflowX === 'scroll';
      if (!isScrollable && !el.classList.contains('overflow-x-auto')) return false;

      if (dir === 'right') {
        return el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      } else {
        return el.scrollLeft > 2;
      }
    };

    // ── Helper: Find the active vertical scroll container ─────────────────
    const findVerticalContainer = (dir: 'up' | 'down'): HTMLElement | null => {
      // 1. Check if a modal/dialog is open
      const modal = document.querySelector('[role="dialog"], .modal-responsive-container, [data-modal]');
      if (modal) {
        if (modal instanceof HTMLElement && canScrollVertically(modal, dir)) return modal;
        const scrollableInModal = modal.querySelector('.overflow-y-auto, [class*="overflow-y"]') as HTMLElement | null;
        if (scrollableInModal && canScrollVertically(scrollableInModal, dir)) return scrollableInModal;
      }

      // 2. Check hovered element or its scrollable ancestors
      let current = hoveredElementRef.current;
      while (current && current !== document.body && current !== document.documentElement) {
        if (canScrollVertically(current, dir)) {
          return current;
        }
        current = current.parentElement;
      }

      // 3. Fallback to main layout scroll container
      const main = document.getElementById('main-content-scroll') || document.querySelector('main');
      if (main instanceof HTMLElement) {
        return main;
      }

      // 4. Fallback to document scrolling element
      const docScroll = (document.scrollingElement || document.documentElement) as HTMLElement;
      if (docScroll) return docScroll;

      return null;
    };

    // ── Helper: Find active horizontal scroll container ───────────────────
    const findHorizontalContainer = (dir: 'left' | 'right'): HTMLElement | null => {
      // 1. Check hovered element or its scrollable ancestors
      let current = hoveredElementRef.current;
      while (current && current !== document.body && current !== document.documentElement) {
        if (canScrollHorizontally(current, dir)) {
          return current;
        }
        current = current.parentElement;
      }

      // 2. Check visible horizontal tables in viewport
      const horizContainers = Array.from(
        document.querySelectorAll('.overflow-x-auto, [class*="overflow-x-auto"]')
      ) as HTMLElement[];

      for (const container of horizContainers) {
        const rect = container.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0) {
          if (canScrollHorizontally(container, dir)) {
            return container;
          }
        }
      }

      return null;
    };

    // ── 2. Keyboard Navigation Controller ────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept when user is typing in forms or content editors
      if (isEditableElement(document.activeElement)) return;
      if (e.defaultPrevented) return;

      const key = e.key;
      const smooth = !prefersReducedMotion();
      const behavior = smooth ? 'smooth' : 'auto';

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

      // ── Home / End Navigation (Document or Container)
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

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
