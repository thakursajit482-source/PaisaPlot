import React, { useState, useEffect } from 'react';
import { X, Shield, IndianRupee, AlertOctagon } from 'lucide-react';
import { BillCommitment, EXPENSE_CATEGORIES } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billToEdit?: BillCommitment | null;
}

export const BillModal: React.FC<BillModalProps> = ({
  isOpen,
  onClose,
  billToEdit,
}) => {
  const { addBill, editBill } = useFinance();

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDateStr, setDueDateStr] = useState('');
  const [category, setCategory] = useState<string>('Bills & Utilities');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (billToEdit) {
      setTitle(billToEdit.title);
      setAmountStr(billToEdit.amount.toString());
      setDueDateStr(billToEdit.dueDate || '');
      setCategory(billToEdit.category || 'Bills & Utilities');
    } else {
      setTitle('');
      setAmountStr('');
      setDueDateStr(new Date().toISOString().split('T')[0]);
      setCategory('Bills & Utilities');
    }
    setFormError(null);
    setIsSubmitting(false);
  }, [billToEdit, isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim()) {
      setFormError('Please enter a bill title.');
      return;
    }

    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || !isFinite(amountNum) || amountNum <= 0) {
      setFormError('Amount must be a positive number greater than ₹0.');
      return;
    }

    if (!dueDateStr || isNaN(new Date(dueDateStr).getTime())) {
      setFormError('Please specify a valid due date.');
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (billToEdit) {
        result = editBill(billToEdit.id, title, amountNum, dueDateStr, category);
      } else {
        result = addBill(title, amountNum, dueDateStr, category);
      }

      if (result.success) {
        onClose();
      } else if (result.error) {
        setFormError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md glass-panel-elevated rounded-2xl shadow-[0_24px_60px_0_rgba(0,0,0,0.65)] p-6 overflow-hidden">
        {/* Accent top stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />

        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 id="bill-modal-title" className="text-lg font-bold text-slate-100">
                {billToEdit ? 'Edit Bill Commitment' : 'Add Bill Commitment'}
              </h3>
              <p className="text-xs text-slate-400">Lock capital for essential upcoming obligations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-navy-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="bill-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Bill Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="bill-title"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. House Rent, WiFi Broadband, Electricity"
              className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="bill-amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Amount in Rupees (₹) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="bill-amount"
                type="number"
                min="1"
                step="any"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. 2500"
                className="w-full pl-9 pr-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="bill-category" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Category
              </label>
              <select
                id="bill-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all cursor-pointer"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="bill-duedate" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="bill-duedate"
                type="date"
                value={dueDateStr}
                onChange={(e) => {
                  setDueDateStr(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="w-full px-3 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all cursor-pointer"
                required
              />
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-navy-800 hover:bg-navy-750 border border-navy-700 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-navy-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : billToEdit ? 'Save Bill' : 'Lock Commitment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
