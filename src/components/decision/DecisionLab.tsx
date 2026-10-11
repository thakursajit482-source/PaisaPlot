import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingDown,
  Shield,
  Target,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Info,
  RotateCcw,
  IndianRupee,
  Activity,
  Layers,
  Sliders,
  Plus,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { EXPENSE_CATEGORIES, ExpenseCategory, PurchaseSimulationInput, SimulationResult } from '../../types/finance';
import { ConfirmationModal } from './ConfirmationModal';
import { formatINR } from '../../finance/calculations';
import { GlassCard } from '../common/GlassmorphismCard';

const PRESET_SCENARIOS = [
  { title: 'Dinner & Movies', category: 'Food & Dining', amount: 650, note: 'Safe casual outing' },
  { title: 'Wireless Headphones', category: 'Shopping & Tech', amount: 1500, note: 'Moderate tech spend' },
  { title: 'Weekend Getaway', category: 'Entertainment', amount: 3500, note: 'Tighter daily allowance' },
  { title: 'Budget Tablet', category: 'Shopping & Tech', amount: 5500, note: 'Depletes savings target' },
  { title: 'Premium Flagship Phone', category: 'Shopping & Tech', amount: 8200, note: 'Breaches commitments' },
];

export const DecisionLab: React.FC = () => {
  const { state, metrics, previewPurchase, addExpenseTransaction } = useFinance();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Shopping & Tech');
  const [amountStr, setAmountStr] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const amountNumber = useMemo(() => {
    const parsed = parseFloat(amountStr);
    if (isNaN(parsed) || !isFinite(parsed)) return 0;
    return Math.min(10000000, Math.max(0, Math.round(parsed * 100) / 100));
  }, [amountStr]);

  // Current simulation input
  const simulationInput: PurchaseSimulationInput = useMemo(() => {
    return {
      title: title.trim() || 'Prospective Purchase',
      category,
      amount: amountNumber,
    };
  }, [title, category, amountNumber]);

  // Pure preview computation - updates whenever inputs change, never mutates state
  const simulation: SimulationResult = useMemo(() => {
    return previewPurchase(simulationInput);
  }, [previewPurchase, simulationInput]);

  const maxSliderLimit = useMemo(() => {
    return Math.max(10000, metrics.balance);
  }, [metrics.balance]);

  const handlePresetClick = (preset: typeof PRESET_SCENARIOS[0]) => {
    setTitle(preset.title);
    setCategory(preset.category as ExpenseCategory);
    setAmountStr(preset.amount.toString());
    setFormError(null);
  };

  const handleClearForm = () => {
    setTitle('');
    setCategory('Shopping & Tech');
    setAmountStr('');
    setNotes('');
    setFormError(null);
  };

  const handleQuickAdd = (increment: number) => {
    const current = amountNumber;
    const next = current + increment;
    setAmountStr(next.toString());
    if (formError) setFormError(null);
  };

  const handleSpendablePercent = (percent: number) => {
    const target = Math.max(0, Math.round(metrics.spendableAfterCommitments * percent));
    setAmountStr(target > 0 ? target.toString() : '');
    if (formError) setFormError(null);
  };

  const handleInitiateConfirmation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setFormError('Please provide a title or item description.');
      return;
    }
    if (amountNumber <= 0) {
      setFormError('Purchase amount must be greater than ₹0.');
      return;
    }
    if (!simulation.isAffordable) {
      if (simulation.affordabilityStatus === 'exceeds_balance') {
        setFormError(`Cannot afford: purchase exceeds current total balance of ${formatINR(metrics.balance)}.`);
      } else if (simulation.affordabilityStatus === 'impairs_commitments') {
        setFormError(
          `Cannot afford: purchase breaches your locked ${formatINR(state.unpaidCommitments)} essential commitments.`
        );
      }
      return;
    }

    setFormError(null);
    setIsConfirmOpen(true);
  };

  const handleExecutePurchase = () => {
    const result = addExpenseTransaction(title, category, amountNumber, notes);
    if (result.success) {
      handleClearForm();
    } else if (result.error) {
      setFormError(result.error);
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'safe':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'caution':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'high_risk':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getSeverityAlertStyle = (severity: 'neutral' | 'warning' | 'danger') => {
    switch (severity) {
      case 'neutral':
        return 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
      case 'warning':
        return 'bg-amber-950/40 border-amber-500/30 text-amber-300';
      case 'danger':
        return 'bg-rose-950/40 border-rose-500/30 text-rose-300';
    }
  };

  const hasSimulatedAmount = amountNumber > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Page Header with Visual Sandbox Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-brand-lime/10 text-brand-lime">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-brand-lime font-mono">
              Deterministic Decision Simulator
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-violet/20 text-brand-violet-light border border-brand-violet/30">
              Zero-Risk Sandbox
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-sans">
            What-If Decision Lab
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Preview any prospective purchase before committing real funds. Inspect balance deductions, unpaid bill protection, daily allowance depletion, and savings goal feasibility in real time.
          </p>
        </div>

        {/* Quick Baseline Anchor Pill */}
        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 self-start md:self-auto shadow-sm backdrop-blur-sm">
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Available Balance</span>
            <span className="text-base font-extrabold text-slate-100 font-mono">
              {formatINR(metrics.balance)}
            </span>
          </div>
          <div className="h-7 w-px bg-white/[0.08]" />
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Daily Allowance</span>
            <span className="text-base font-extrabold text-brand-lime font-mono">
              {formatINR(metrics.dailyAllowance, { decimals: 0 })}/day
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Scenario Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form, Interactive Range Slider & Presets (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard variant="panel" glow="none" className="p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-lime" />
                <h2 className="text-base font-bold text-slate-200">
                  Scenario Parameters
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClearForm}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Quick Test Presets Carousel / Badges */}
            <div className="mb-5 space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quick Test Scenarios
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SCENARIOS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 border border-white/[0.08] hover:border-brand-lime/40 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{preset.title}</span>
                    <span className="font-mono text-brand-lime text-[11px] font-bold">
                      {formatINR(preset.amount)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleInitiateConfirmation} className="space-y-4">
              {/* Item Description */}
              <div>
                <label htmlFor="purchase-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Item or Purchase Description <span className="text-rose-400">*</span>
                </label>
                <input
                  id="purchase-title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. Ergonomic Keyboard, Dinner Buffet, Smart Watch"
                  className="w-full px-3.5 py-2.5 bg-[#07090e]/80 border border-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="purchase-category" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Expense Category
                </label>
                <select
                  id="purchase-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3.5 py-2.5 bg-[#07090e]/80 border border-white/[0.08] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dual-Mode Amount Input & Interactive Slider */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="purchase-amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Hypothetical Amount (₹) <span className="text-rose-400">*</span>
                  </label>
                  {/* Quick percentage buttons based on available spendable cash */}
                  {metrics.spendableAfterCommitments > 0 && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleSpendablePercent(0.25)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 border border-white/[0.08] cursor-pointer"
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSpendablePercent(0.5)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 border border-white/[0.08] cursor-pointer"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSpendablePercent(1)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.07] text-brand-lime border border-white/[0.08] font-semibold cursor-pointer"
                      >
                        Max Spendable
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <input
                    id="purchase-amount"
                    type="number"
                    min="1"
                    max="10000000"
                    step="any"
                    value={amountStr}
                    onChange={(e) => {
                      setAmountStr(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="e.g. 1500"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#07090e]/80 border border-white/[0.08] rounded-xl text-base text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all"
                    required
                  />
                </div>

                {/* Interactive Tactile Range Slider */}
                <div className="pt-2 space-y-1.5">
                  <input
                    type="range"
                    min="0"
                    max={maxSliderLimit}
                    step="50"
                    value={amountNumber}
                    onChange={(e) => {
                      setAmountStr(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    aria-label="Hypothetical purchase amount slider"
                    className="w-full h-2 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-brand-lime"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>₹0</span>
                    <span>Spendable: {formatINR(metrics.spendableAfterCommitments)}</span>
                    <span>Max: {formatINR(maxSliderLimit)}</span>
                  </div>
                </div>

                {/* Stepper helper buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(250)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 border border-white/[0.08] transition-all flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-brand-lime" /> ₹250
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(500)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 border border-white/[0.08] transition-all flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-brand-lime" /> ₹500
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(1000)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 border border-white/[0.08] transition-all flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-brand-lime" /> ₹1,000
                  </button>
                </div>
              </div>

              {/* Optional Simulation Notes */}
              <div>
                <label htmlFor="purchase-notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Simulation Notes <span className="text-slate-500 font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="purchase-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Workstation upgrade, Birthday dinner"
                  className="w-full px-3.5 py-2.5 bg-[#07090e]/80 border border-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all"
                />
              </div>

              {/* Error Banner */}
              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Confirmation Trigger */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={amountNumber <= 0 || !title.trim() || !simulation.isAffordable}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                    amountNumber > 0 && title.trim() && simulation.isAffordable
                      ? 'bg-brand-lime hover:bg-brand-lime-dim text-navy-950 shadow-glow-lime cursor-pointer'
                      : 'bg-navy-800 text-slate-500 border border-navy-750 cursor-not-allowed opacity-60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Proceed to Confirmation</span>
                </button>
              </div>
            </form>
          </GlassCard>

          {/* Transparent Mathematical Sandbox Explanation Card */}
          <GlassCard variant="subtle" className="p-5 text-xs text-slate-400 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Info className="w-4 h-4 text-brand-lime" />
              <span>Transparent Decision Mathematics</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Simulations in PaisaPilot are 100% deterministic and client-side. Adjusting values never deducts money or alters your recorded balance until you explicitly verify confirmation.
            </p>
            <div className="pt-1 text-[11px] text-slate-400 border-t border-white/[0.08] flex items-center justify-between">
              <span>Locked Unpaid Bills:</span>
              <strong className="text-slate-200 font-mono">{formatINR(state.unpaidCommitments)}</strong>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Live What-If Comparison Matrix & Risk Explainability (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Risk Explainability & Impact Banner */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 transition-all glass-panel ${getSeverityAlertStyle(
              simulation.impactAnalysis.severity
            )}`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-navy-950/60 shrink-0 mt-0.5 border border-white/[0.08]">
                {simulation.impactAnalysis.severity === 'neutral' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : simulation.impactAnalysis.severity === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <AlertOctagon className="w-5 h-5 text-rose-400" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-slate-100">
                    {hasSimulatedAmount ? simulation.impactAnalysis.headline : 'Ready to Simulate'}
                  </h3>
                  {hasSimulatedAmount && (
                    <span
                      className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${getRiskBadgeColor(
                        simulation.simulatedMetrics.riskLevel
                      )}`}
                    >
                      {simulation.simulatedMetrics.riskLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {hasSimulatedAmount
                    ? simulation.impactAnalysis.description
                    : 'Enter an amount or adjust the slider on the left to inspect real-time before-and-after financial consequences.'}
                </p>

                {hasSimulatedAmount && (
                  <div className="pt-2 text-xs text-slate-300 space-y-1.5 border-t border-white/[0.08]">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-200">Runway Impact:</strong>
                      <span>{simulation.impactAnalysis.runwayImpactText}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-200">Savings Cushion:</strong>
                      <span>{simulation.impactAnalysis.goalImpactText}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* High-Impact Before & After Metrics Comparison Grid */}
          <GlassCard variant="panel" glow="lime" className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-lime" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Before vs After Comparison Matrix
                </h3>
              </div>
              <span className="text-xs font-mono text-brand-lime">
                {hasSimulatedAmount ? 'Live Preview Active' : 'Baseline State'}
              </span>
            </div>

            <div className="space-y-3">
              {/* Row 1: Total Bank Balance */}
              <div className="p-4 bg-white/[0.025] rounded-xl border border-white/[0.08] hover:border-white/[0.14] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                    Total Cash Balance
                  </span>
                  {hasSimulatedAmount && (
                    <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      −{formatINR(amountNumber)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Current</span>
                    <span className="text-base sm:text-lg font-bold text-slate-200 font-mono">
                      {formatINR(metrics.balance)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Simulated</span>
                    <span
                      className={`text-base sm:text-lg font-bold font-mono ${
                        hasSimulatedAmount
                          ? simulation.simulatedMetrics.balance >= 0
                            ? 'text-slate-100'
                            : 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {formatINR(simulation.simulatedMetrics.balance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Spendable Cash After Commitments */}
              <div className="p-4 bg-white/[0.025] rounded-xl border border-white/[0.08] hover:border-white/[0.14] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Spendable After {formatINR(state.unpaidCommitments)} Commitments
                  </span>
                  {hasSimulatedAmount && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        simulation.simulatedMetrics.spendableAfterCommitments >= 0
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      }`}
                    >
                      {simulation.simulatedMetrics.spendableAfterCommitments >= 0
                        ? `${formatINR(simulation.simulatedMetrics.spendableAfterCommitments)} buffer`
                        : `Deficit: ${formatINR(Math.abs(simulation.simulatedMetrics.spendableAfterCommitments))}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Current</span>
                    <span className="text-base sm:text-lg font-bold text-slate-200 font-mono">
                      {formatINR(metrics.spendableAfterCommitments)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Simulated</span>
                    <span
                      className={`text-base sm:text-lg font-bold font-mono ${
                        simulation.simulatedMetrics.spendableAfterCommitments < 0
                          ? 'text-rose-400'
                          : 'text-brand-lime'
                      }`}
                    >
                      {formatINR(simulation.simulatedMetrics.spendableAfterCommitments)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Daily Discretionary Allowance */}
              <div className="p-4 bg-white/[0.025] rounded-xl border border-white/[0.08] hover:border-white/[0.14] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-brand-lime" />
                    Daily Discretionary Allowance ({state.daysRemaining} Days)
                  </span>
                  {hasSimulatedAmount && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        simulation.deltas.dailyAllowance === 0
                          ? 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      }`}
                    >
                      {simulation.deltas.dailyAllowance <= 0 ? '−' : '+'}{formatINR(Math.abs(simulation.deltas.dailyAllowance), { decimals: 2 })}/day ({simulation.deltas.dailyAllowancePercentChange}%)
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Current</span>
                    <span className="text-base sm:text-lg font-bold text-slate-200 font-mono">
                      {formatINR(metrics.dailyAllowance, { decimals: 2 })}/d
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Simulated</span>
                    <span
                      className={`text-base sm:text-lg font-bold font-mono ${
                        simulation.simulatedMetrics.dailyAllowance < 50
                          ? 'text-rose-400'
                          : simulation.simulatedMetrics.dailyAllowance < 150
                          ? 'text-amber-300'
                          : 'text-brand-lime'
                      }`}
                    >
                      {formatINR(simulation.simulatedMetrics.dailyAllowance, { decimals: 2 })}/d
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 4: Savings Goal Feasibility */}
              <div className="p-4 bg-white/[0.025] rounded-xl border border-white/[0.08] hover:border-white/[0.14] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-brand-violet-light" />
                    Savings Target Cushion ({formatINR(metrics.remainingSavingsTarget)})
                  </span>
                  {hasSimulatedAmount && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        simulation.simulatedMetrics.savingsFeasible
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      }`}
                    >
                      {simulation.simulatedMetrics.savingsFeasible
                        ? '100% Achievable'
                        : `Shortfall: ${formatINR(simulation.simulatedMetrics.savingsShortfall)}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Current Target</span>
                    <span className="text-sm font-semibold text-emerald-400">
                      {metrics.savingsFeasible ? 'Protected' : 'Strained'}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Simulated Status</span>
                    <span
                      className={`text-sm font-bold ${
                        simulation.simulatedMetrics.savingsFeasible
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {simulation.simulatedMetrics.savingsFeasible
                        ? 'Feasible'
                        : `Strained (−${formatINR(simulation.simulatedMetrics.savingsShortfall)})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 5: Financial Health Score */}
              <div className="p-4 bg-white/[0.025] rounded-xl border border-white/[0.08] hover:border-white/[0.14] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-brand-violet" />
                    Financial Health Score (100-pt Scale)
                  </span>
                  {hasSimulatedAmount && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        simulation.deltas.healthScoreDelta >= 0
                          ? 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      }`}
                    >
                      Score: {simulation.deltas.healthScoreDelta} pts
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Current</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {metrics.healthScore}/100 ({metrics.riskLevel.toUpperCase()})
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Simulated</span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        simulation.simulatedMetrics.riskLevel === 'safe'
                          ? 'text-emerald-400'
                          : simulation.simulatedMetrics.riskLevel === 'caution'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {simulation.simulatedMetrics.healthScore}/100 ({simulation.simulatedMetrics.riskLevel.replace('_', ' ').toUpperCase()})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecutePurchase}
        simulation={simulation}
      />
    </div>
  );
};
