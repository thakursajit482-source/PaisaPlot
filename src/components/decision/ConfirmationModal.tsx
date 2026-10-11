import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Wallet, Calendar } from 'lucide-react';
import { SimulationResult } from '../../types/finance';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  simulation: SimulationResult | null;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  simulation,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
    }
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

  const handleConfirm = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onConfirm();
    onClose();
  };

  if (!isOpen || !simulation) return null;

  const { input, currentMetrics, simulatedMetrics, deltas, affordabilityStatus } = simulation;

  const isStraining = affordabilityStatus === 'strains_savings';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-purchase-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-navy-900 border border-navy-700/80 rounded-2xl shadow-card-dark p-6 overflow-hidden">
        {/* Accent glow on top */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isStraining
              ? 'bg-gradient-to-r from-amber-400 to-amber-600'
              : 'bg-gradient-to-r from-brand-lime to-emerald-400'
          }`}
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-navy-800 text-brand-lime border border-navy-700 mb-1.5">
              Decision Confirmation
            </span>
            <h3 id="confirm-purchase-title" className="text-xl font-bold text-slate-100">
              Confirm Purchase
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cancel and close confirmation"
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Purchase Summary Pill */}
        <div className="bg-navy-950/80 border border-navy-800 rounded-xl p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Item / Purpose</p>
            <p className="text-base font-semibold text-slate-100">{input.title || 'Simulated Purchase'}</p>
            <span className="inline-block text-xs text-slate-400 bg-navy-850 px-2 py-0.5 rounded mt-1 border border-navy-750">
              {input.category}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Expense Amount</p>
            <p className="text-2xl font-extrabold text-brand-lime font-mono">
              ₹{input.amount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Financial Consequence Breakdown */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Impact Summary (After Execution)
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-navy-850/80 p-3 rounded-xl border border-navy-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span>New Balance</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-500 line-through">
                  ₹{currentMetrics.balance.toLocaleString('en-IN')}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="font-bold text-slate-100 font-mono">
                  ₹{simulatedMetrics.balance.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-[11px] text-rose-400 font-mono block mt-0.5">
                −₹{input.amount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-navy-850/80 p-3 rounded-xl border border-navy-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Daily Allowance</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-500 line-through">
                  ₹{currentMetrics.dailyAllowance.toFixed(0)}/d
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="font-bold text-slate-100 font-mono">
                  ₹{simulatedMetrics.dailyAllowance.toFixed(0)}/d
                </span>
              </div>
              <span className="text-[11px] text-amber-400 font-mono block mt-0.5">
                {deltas.dailyAllowance <= 0 ? '−' : '+'}₹{Math.abs(deltas.dailyAllowance).toFixed(0)}/day ({deltas.dailyAllowancePercentChange}%)
              </span>
            </div>
          </div>

          {/* Commitment and Savings Protection Checklist */}
          <div className="bg-navy-950/70 p-3.5 rounded-xl border border-navy-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ₹3,000 Locked Commitments
              </span>
              <span className="text-emerald-400 font-medium">100% Protected</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                {simulatedMetrics.savingsFeasible ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                ₹2,000 Savings Goal
              </span>
              {simulatedMetrics.savingsFeasible ? (
                <span className="text-emerald-400 font-medium">Achievable</span>
              ) : (
                <span className="text-amber-400 font-medium">
                  Strained (Shortfall ₹{simulatedMetrics.savingsShortfall.toLocaleString('en-IN')})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-navy-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-slate-100 bg-navy-800 hover:bg-navy-750 border border-navy-700 rounded-xl transition-all"
          >
            Cancel (No Changes)
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className={`px-5 py-2.5 text-sm font-bold text-navy-950 bg-brand-lime hover:bg-brand-lime-dim rounded-xl transition-all shadow-glow-lime flex items-center gap-2 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Recording...' : 'Confirm & Record Expense'}
          </button>
        </div>
      </div>
    </div>
  );
};
