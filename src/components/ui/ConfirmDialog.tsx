// ──────────────────────────────────────────────────
// Golden Leaf Finance — Confirm Dialog Component
// ──────────────────────────────────────────────────

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center py-2">
        {variant !== 'default' && (
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
            variant === 'danger' ? 'bg-status-error-light' : 'bg-status-warning-light'
          }`}>
            <AlertTriangle size={24} className={
              variant === 'danger' ? 'text-status-error' : 'text-status-warning'
            } />
          </div>
        )}
        <h3 className="text-lg font-display font-semibold text-rich-black">{title}</h3>
        <p className="mt-2 text-sm text-rich-silver font-body">{message}</p>
      </div>
    </Modal>
  );
};
