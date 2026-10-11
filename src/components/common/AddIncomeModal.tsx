import React, { useState, useEffect } from 'react';
import { X, PlusCircle, IndianRupee, AlertOctagon } from 'lucide-react';
import { INCOME_CATEGORIES } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ isOpen, onClose }) => {
  const { addIncomeTransaction } = useFinance();

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [amountStr, setAmountStr] = useState('');
  const [dateStr, setDateStr] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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
    setCategory(INCOME_CATEGORIES[0]);
    setAmountStr('');
    setDateStr(todayStr);
    setNotes('');
    setFormError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setFormError('Please provide an income source or title.');
      return;
    }

    if (!category.trim()) {
      setFormError('Please select a valid income category.');
      return;
    }

    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || !isFinite(amountNum) || amountNum <= 0) {
      setFormError('Income amount must be greater than ₹0.');
      return;
    }

    if (!dateStr || isNaN(new Date(dateStr).getTime())) {
      setFormError('Please provide a valid date.');
      return;
    }

    const result = addIncomeTransaction(title, category, amountNum, dateStr, notes);
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
      aria-labelledby="add-income-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-navy-900 border border-navy-750 rounded-2xl shadow-card-dark p-6 overflow-hidden">
        {/* Accent top stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="add-income-title" className="text-lg font-bold text-slate-100">
                Record Income Inflow
              </h3>
              <p className="text-xs text-slate-400">Expands your balance and daily runway</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close add income dialog"
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-navy-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Income Title */}
          <div>
            <label htmlFor="income-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Income Source / Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="income-title"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Freelance Web Project, Client Payment"
              className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="income-amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Amount in Rupees (₹) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="income-amount"
                type="number"
                min="1"
                step="any"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. 5000"
                className="w-full pl-9 pr-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                required
              />
            </div>
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="income-category" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Category
              </label>
              <div className="relative">
                <select
                  id="income-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all cursor-pointer"
                >
                  {INCOME_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="income-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Date <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="income-date"
                  type="date"
                  value={dateStr}
                  onChange={(e) => {
                    setDateStr(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label htmlFor="income-notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Notes <span className="text-slate-500 lowercase">(optional)</span>
            </label>
            <input
              id="income-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid in full via UPI"
              className="w-full px-3.5 py-2 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />
          </div>

          {/* Error Banner */}
          {formError && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Action buttons */}
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
              className="px-5 py-2.5 text-xs font-bold text-navy-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Confirm Inflow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
