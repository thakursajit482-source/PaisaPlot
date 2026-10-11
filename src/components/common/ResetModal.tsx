import React, { useEffect } from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  useEffect(() => {
    setIsSubmitting(false);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleReset = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-navy-900 border border-navy-750 rounded-2xl shadow-card-dark p-6 overflow-hidden">
        {/* Accent top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="reset-modal-title" className="text-lg font-bold text-slate-100">
                Reset Demo State?
              </h3>
              <p className="text-xs text-slate-400">Restore default ₹10,000 sandbox</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-navy-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          This will wipe any recorded transactions in localStorage and restore the original seeded state:
        </p>

        <ul className="text-xs text-slate-300 space-y-2 bg-navy-950/60 p-3.5 rounded-xl border border-navy-800 mb-6">
          <li className="flex justify-between">
            <span className="text-slate-400">Starting Budget:</span>
            <span className="font-semibold text-slate-200">₹10,000</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-400">Days Remaining:</span>
            <span className="font-semibold text-slate-200">30 Days</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-400">Unpaid Commitments:</span>
            <span className="font-semibold text-slate-200">₹3,000</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-400">Savings Goal:</span>
            <span className="font-semibold text-slate-200">₹2,000</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-400">Recorded Expenses:</span>
            <span className="font-semibold text-slate-200">0 (Cleared)</span>
          </li>
        </ul>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-slate-100 bg-navy-800 hover:bg-navy-750 border border-navy-700 rounded-xl transition-all"
          >
            Keep Current State
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleReset}
            className="px-4 py-2.5 text-sm font-semibold text-navy-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            {isSubmitting ? 'Resetting...' : 'Yes, Reset Demo'}
          </button>
        </div>
      </div>
    </div>
  );
};
