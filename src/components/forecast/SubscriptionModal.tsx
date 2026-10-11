import React, { useState, useEffect } from 'react';
import { X, RefreshCw, IndianRupee, AlertOctagon } from 'lucide-react';
import { Subscription, SubscriptionFrequency, EXPENSE_CATEGORIES } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionToEdit?: Subscription | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscriptionToEdit,
}) => {
  const { addSubscription, editSubscription } = useFinance();

  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('monthly');
  const [nextBillingDateStr, setNextBillingDateStr] = useState('');
  const [category, setCategory] = useState<string>('Entertainment');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subscriptionToEdit) {
      setName(subscriptionToEdit.name);
      setAmountStr(subscriptionToEdit.amount.toString());
      setFrequency(subscriptionToEdit.frequency);
      setNextBillingDateStr(subscriptionToEdit.nextBillingDate || '');
      setCategory(subscriptionToEdit.category || 'Entertainment');
      setNotes(subscriptionToEdit.notes || '');
    } else {
      setName('');
      setAmountStr('');
      setFrequency('monthly');
      setNextBillingDateStr(new Date().toISOString().split('T')[0]);
      setCategory('Entertainment');
      setNotes('');
    }
    setFormError(null);
    setIsSubmitting(false);
  }, [subscriptionToEdit, isOpen]);

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

    if (!name.trim()) {
      setFormError('Please enter a subscription name.');
      return;
    }

    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || !isFinite(amountNum) || amountNum <= 0) {
      setFormError('Amount must be a positive number greater than ₹0.');
      return;
    }

    if (!nextBillingDateStr || isNaN(new Date(nextBillingDateStr).getTime())) {
      setFormError('Please specify a valid next billing date.');
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (subscriptionToEdit) {
        result = editSubscription(
          subscriptionToEdit.id,
          name,
          amountNum,
          frequency,
          nextBillingDateStr,
          category,
          notes
        );
      } else {
        result = addSubscription(name, amountNum, frequency, nextBillingDateStr, category, notes);
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
      aria-labelledby="sub-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md glass-panel-elevated rounded-2xl shadow-[0_24px_60px_0_rgba(0,0,0,0.65)] p-6 overflow-hidden">
        {/* Accent top stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-lime via-teal-400 to-brand-lime" />

        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-lime/10 border border-brand-lime/20 text-brand-lime">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 id="sub-modal-title" className="text-lg font-bold text-slate-100">
                {subscriptionToEdit ? 'Edit Subscription' : 'Add Recurring Subscription'}
              </h3>
              <p className="text-xs text-slate-400">Model recurring weekly or monthly charges</p>
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
            <label htmlFor="sub-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Service / Subscription Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="sub-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Netflix, Spotify, Gym Membership, GitHub"
              className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="sub-amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Amount (₹) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
                <input
                  id="sub-amount"
                  type="number"
                  min="1"
                  step="any"
                  value={amountStr}
                  onChange={(e) => {
                    setAmountStr(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. 499"
                  className="w-full pl-8 pr-3 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="sub-frequency" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Billing Cycle
              </label>
              <select
                id="sub-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as SubscriptionFrequency)}
                className="w-full px-3 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all cursor-pointer"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="sub-category" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Category
              </label>
              <select
                id="sub-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all cursor-pointer"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sub-nextdate" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Next Billing Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="sub-nextdate"
                type="date"
                value={nextBillingDateStr}
                onChange={(e) => {
                  setNextBillingDateStr(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="w-full px-3 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all cursor-pointer"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="sub-notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Notes <span className="text-slate-500 lowercase">(optional)</span>
            </label>
            <input
              id="sub-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Shared with roommates"
              className="w-full px-3.5 py-2 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all"
            />
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
              className="px-5 py-2.5 text-xs font-bold text-navy-950 bg-brand-lime hover:bg-brand-lime-dim disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-glow-lime flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : subscriptionToEdit ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
