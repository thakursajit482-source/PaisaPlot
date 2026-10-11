import React, { useState, useEffect } from 'react';
import { X, Target, IndianRupee, AlertOctagon } from 'lucide-react';
import { SavingsGoal } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { formatINR } from '../../finance/calculations';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: SavingsGoal | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
}) => {
  const { addGoal, editGoal } = useFinance();

  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [targetDateStr, setTargetDateStr] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setTargetAmountStr(goalToEdit.targetAmount.toString());
      setTargetDateStr(goalToEdit.targetDate || '');
    } else {
      setName('');
      setTargetAmountStr('');
      setTargetDateStr('');
    }
    setFormError(null);
  }, [goalToEdit, isOpen]);

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

    if (!name.trim()) {
      setFormError('Please enter a goal name.');
      return;
    }

    const amountNum = parseFloat(targetAmountStr);
    if (isNaN(amountNum) || !isFinite(amountNum) || amountNum <= 0) {
      setFormError('Target amount must be a positive number greater than ₹0.');
      return;
    }

    if (goalToEdit && amountNum < goalToEdit.alreadySaved) {
      setFormError(
        `Target amount cannot be less than already saved amount (${formatINR(goalToEdit.alreadySaved)}).`
      );
      return;
    }

    let result;
    if (goalToEdit) {
      result = editGoal(goalToEdit.id, name, amountNum, targetDateStr || undefined);
    } else {
      result = addGoal(name, amountNum, targetDateStr || undefined);
    }

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
      aria-labelledby="goal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-navy-900 border border-navy-750 rounded-2xl shadow-card-dark p-6 overflow-hidden">
        {/* Accent top stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-violet to-brand-violet-light" />

        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-violet/10 border border-brand-violet/20 text-brand-violet-light">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 id="goal-modal-title" className="text-lg font-bold text-slate-100">
                {goalToEdit ? 'Edit Savings Goal' : 'Create New Savings Goal'}
              </h3>
              <p className="text-xs text-slate-400">Ring-fence capital for specific milestones</p>
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
            <label htmlFor="goal-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Goal Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="goal-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Vacation Fund, Laptop Upgrade, Emergency Reserve"
              className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="goal-target" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Target Amount (₹) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="goal-target"
                type="number"
                min="1"
                step="any"
                value={targetAmountStr}
                onChange={(e) => {
                  setTargetAmountStr(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. 5000"
                className="w-full pl-9 pr-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all"
                required
              />
            </div>
            {goalToEdit && (
              <span className="block text-[11px] text-slate-500 mt-1">
                Currently saved: <strong className="text-slate-300">{formatINR(goalToEdit.alreadySaved)}</strong>
              </span>
            )}
          </div>

          <div>
            <label htmlFor="goal-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Target Date <span className="text-slate-500 lowercase">(optional)</span>
            </label>
            <input
              id="goal-date"
              type="date"
              value={targetDateStr}
              onChange={(e) => {
                setTargetDateStr(e.target.value);
                if (formError) setFormError(null);
              }}
              className="w-full px-3 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all cursor-pointer"
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
              className="px-5 py-2.5 text-xs font-bold text-navy-950 bg-brand-violet-light hover:bg-violet-300 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Target className="w-4 h-4" />
              {goalToEdit ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
