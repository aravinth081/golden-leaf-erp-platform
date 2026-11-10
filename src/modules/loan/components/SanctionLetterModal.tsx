// ──────────────────────────────────────────────────
// Golden Leaf Finance — Sanction Letter Modal Dialog
// ──────────────────────────────────────────────────

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { SanctionLetterViewer } from './SanctionLetterViewer';
import { type SanctionLetterRecord } from '../../../types/sanctionLetter.types';

interface SanctionLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanData?: Partial<SanctionLetterRecord>;
}

export const SanctionLetterModal: React.FC<SanctionLetterModalProps> = ({
  isOpen,
  onClose,
  loanData,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:z-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-gray-50 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden max-h-[96vh] flex flex-col print:max-h-none print:shadow-none print:rounded-none"
        >
          {/* Modal Header */}
          <div className="print:hidden px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base font-extrabold text-[#0B1F3A] flex items-center gap-2">
                <span>📄</span> Official Sanction Letter & Terms and Conditions
              </h2>
              <p className="text-xs text-gray-500">
                Schedule of Charges (MID) • 28 Legal Clauses • Information Technology Act 2000
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto grow">
            <SanctionLetterViewer
              initialData={loanData}
              isModal={true}
              onClose={onClose}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
