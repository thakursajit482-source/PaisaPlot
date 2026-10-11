import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, IndianRupee, AlertOctagon, Wrench } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { formatINR } from '../../finance/calculations';

interface UnexpectedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnexpectedExpenseModal: React.FC<UnexpectedExpenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { metrics, recordUnexpectedExpense } = useFinance();

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Healthcare');
  const [amountStr, setAmountStr] = useState('');
  const [dateStr, setDateStr] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setTitle('');
    setCategory('Healthcare');
    setAmountStr('');
    setDateStr(todayStr);
    setNotes('');
    setFormError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim()) {
      setFormError('Please enter an expense description or reason.');
      return;
    }

    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || !isFinite(amountNum) || amountNum <= 0) {
      setFormError('Amount must be a positive number greater than ₹0.');
      return;
    }

    if (amountNum > metrics.balance) {
      setFormError(
        `Expense of ${formatINR(amountNum)} exceeds your current total balance of ${formatINR(metrics.balance)}.`
      );
      return;
    }

    setIsSubmitting(true);
    const result = recordUnexpectedExpense(title, category, amountNum, dateStr, notes);
    setIsSubmitting(false);

    if (result.success) {
      handleClose();
    } else if (result.error) {
      setFormError(result.error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unexpected-expense-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md glass-panel-elevated rounded-2xl shadow-[0_24px_60px_0_rgba(0,0,0,0.65)] p-6 overflow-hidden">
        {/* Accent top stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 id="unexpected-expense-title" className="text-lg font-bold text-slate-100">
                Record Unexpected Expense
              </h3>
              <p className="text-xs text-slate-400">Immediate repair, medical emergency, or sudden bill</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-navy-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Warning Pill */}
        <div className="mb-4 p-3 bg-navy-950/80 rounded-xl border border-navy-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Current Balance:</span>
          <span className="font-mono font-bold text-slate-200">{formatINR(metrics.balance)}</span>
          <span className="text-slate-400 ml-2">Spendable:</span>
          <span className="font-mono font-bold text-brand-lime">{formatINR(metrics.spendableAfterCommitments)}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="unexpected-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Expense Title / Cause <span className="text-rose-400">*</span>
            </label>
            <input
              id="unexpected-title"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Urgent Medical Visit, Bike Repair, AC Service"
              className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="unexpected-amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Amount in Rupees (₹) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="unexpected-amount"
                type="number"
                min="1"
                step="any"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. 1800"
                className="w-full pl-9 pr-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                required
              />
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="unexpected-category" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Category
              </label>
              <select
                id="unexpected-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all cursor-pointer"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="unexpected-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="unexpected-date"
                type="date"
                value={dateStr}
                onChange={(e) => {
                  setDateStr(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="w-full px-3 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="unexpected-notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Notes <span className="text-slate-500 lowercase">(optional)</span>
            </label>
            <input
              id="unexpected-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sudden tire puncture on highway"
              className="w-full px-3.5 py-2 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
            />
          </div>

          {/* Error Banner */}
          {formError && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-navy-800 hover:bg-navy-750 border border-navy-700 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-xs font-bold text-slate-100 bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md flex items-center gap-1.5 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {isSubmitting ? 'Recording...' : 'Confirm Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
