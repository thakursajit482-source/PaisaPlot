import React, { useState, useEffect } from 'react';
import { X, PiggyBank, IndianRupee, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { SavingsGoal } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { formatINR } from '../../finance/calculations';

interface GoalContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
}

export const GoalContributionModal: React.FC<GoalContributionModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const { metrics, contributeToGoal } = useFinance();

  const [amountStr, setAmountStr] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setAmountStr('');
    setFormError(null);
  }, [goal, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !goal) return null;

  const remainingNeeded = Math.max(0, goal.targetAmount - goal.alreadySaved);
  const maxPossible = Math.min(remainingNeeded, Math.max(0, metrics.spendableAfterCommitments));

  const handleQuickFill = (percent: number) => {
    const amt = Math.min(maxPossible, Math.round(remainingNeeded * percent));
    setAmountStr(amt > 0 ? amt.toString() : '');
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || !isFinite(amountNum) || amountNum <= 0) {
      setFormError('Contribution amount must be greater than ₹0.');
      return;
    }

    if (amountNum > remainingNeeded) {
      setFormError(
        `Amount (${formatINR(amountNum)}) exceeds the remaining target of ${formatINR(remainingNeeded)}.`
      );
      return;
    }

    if (amountNum > metrics.spendableAfterCommitments) {
      setFormError(
        `Amount (${formatINR(amountNum)}) exceeds your available spendable cash (${formatINR(metrics.spendableAfterCommitments)}).`
      );
      return;
    }

    const result = contributeToGoal(goal.id, amountNum);
    if (result.success) {
      onClose();
    } else if (result.error) {
      setFormError(result.error);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contribution-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-navy-900 border border-navy-750 rounded-2xl shadow-card-dark p-6 overflow-hidden">
        {/* Accent top stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-lime to-emerald-400" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-lime/10 border border-brand-lime/20 text-brand-lime">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 id="contribution-modal-title" className="text-lg font-bold text-slate-100">
                Add Goal Contribution
              </h3>
              <p className="text-xs text-slate-400">Allocate existing spendable cash to your goal</p>
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

        {/* Goal summary box */}
        <div className="p-3.5 bg-navy-950/80 rounded-xl border border-navy-800 mb-4 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Goal:</span>
            <span className="font-bold text-slate-200">{goal.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Already Saved:</span>
            <span className="font-mono text-emerald-400 font-semibold">{formatINR(goal.alreadySaved)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Remaining to Target:</span>
            <span className="font-mono text-slate-200 font-semibold">{formatINR(remainingNeeded)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-navy-800/80">
            <span className="text-slate-400">Available Spendable Cash:</span>
            <span className="font-mono text-brand-lime font-bold">{formatINR(metrics.spendableAfterCommitments)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="contribution-amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Contribution Amount (₹) <span className="text-rose-400">*</span>
              </label>
              {maxPossible > 0 && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill(0.25)}
                    className="text-[10px] px-2 py-0.5 rounded bg-navy-800 hover:bg-navy-750 text-slate-300 border border-navy-700"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill(0.5)}
                    className="text-[10px] px-2 py-0.5 rounded bg-navy-800 hover:bg-navy-750 text-slate-300 border border-navy-700"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill(1)}
                    className="text-[10px] px-2 py-0.5 rounded bg-navy-800 hover:bg-navy-750 text-brand-lime border border-navy-700 font-semibold"
                  >
                    Full
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="contribution-amount"
                type="number"
                min="1"
                step="any"
                max={maxPossible}
                autoFocus
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder={`Max: ${maxPossible}`}
                className="w-full pl-9 pr-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all"
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
              className="px-5 py-2.5 text-xs font-bold text-navy-950 bg-brand-lime hover:bg-brand-lime-dim rounded-xl transition-all shadow-glow-lime flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Allocate to Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
