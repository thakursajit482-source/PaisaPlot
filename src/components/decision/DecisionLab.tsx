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
  Tag,
  IndianRupee,
  Activity,
  Layers,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { EXPENSE_CATEGORIES, ExpenseCategory, PurchaseSimulationInput, SimulationResult } from '../../types/finance';
import { ConfirmationModal } from './ConfirmationModal';

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
    return isNaN(parsed) ? 0 : parsed;
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

  const handleInitiateConfirmation = () => {
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
        setFormError(`Cannot afford: purchase exceeds current total balance of ₹${metrics.balance.toLocaleString('en-IN')}.`);
      } else if (simulation.affordabilityStatus === 'impairs_commitments') {
        setFormError(`Cannot afford: purchase breaches your locked ₹${state.unpaidCommitments.toLocaleString('en-IN')} essential commitments.`);
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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-brand-lime/10 text-brand-lime">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-brand-lime">
              Zero-Risk Decision Simulator
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            What-If Decision Lab
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Preview any prospective purchase in real time. Simulate balance changes, commitment safety, daily runway depletion, and savings goal feasibility before spending real money.
          </p>
        </div>

        {/* Quick baseline reminder pill */}
        <div className="flex items-center gap-3 bg-navy-900 border border-navy-800 rounded-xl px-4 py-2.5 self-start md:self-auto">
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 block">Current Balance</span>
            <span className="text-base font-extrabold text-slate-100 font-mono">
              ₹{metrics.balance.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-7 w-px bg-navy-800" />
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 block">Daily Allowance</span>
            <span className="text-base font-extrabold text-brand-lime font-mono">
              ₹{metrics.dailyAllowance.toFixed(0)}/day
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, Simulation on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-6 shadow-card-dark relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-lime" />
                <h2 className="text-base font-bold text-slate-200">
                  Simulate A Purchase
                </h2>
              </div>
              {hasSimulatedAmount && (
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Test Scenarios
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SCENARIOS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all text-left flex items-center gap-1.5 ${
                      title === preset.title && amountNumber === preset.amount
                        ? 'bg-brand-lime/15 border-brand-lime/50 text-brand-lime font-medium shadow-sm'
                        : 'bg-navy-850 hover:bg-navy-800 border-navy-750 text-slate-300 hover:text-slate-100'
                    }`}
                  >
                    <span>{preset.title}</span>
                    <span className="font-mono text-slate-400 font-medium">₹{preset.amount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleInitiateConfirmation();
              }}
              className="space-y-4"
            >
              {/* Purchase Title */}
              <div>
                <label htmlFor="purchase-title" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Purchase Title <span className="text-rose-400">*</span>
                </label>
                <input
                  id="purchase-title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. Mechanical Keyboard, Weekend Trip"
                  className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="purchase-category" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  id="purchase-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="purchase-amount" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Amount in Rupees (₹) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <input
                    id="purchase-amount"
                    type="number"
                    min="1"
                    step="any"
                    value={amountStr}
                    onChange={(e) => {
                      setAmountStr(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="e.g. 1500"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all"
                    required
                  />
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label htmlFor="purchase-notes" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Simulation Notes <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  id="purchase-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bought for workstation productivity"
                  className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-750 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all"
                />
              </div>

              {/* Error Banner */}
              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={amountNumber <= 0 || !title.trim() || !simulation.isAffordable}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                    amountNumber > 0 && title.trim() && simulation.isAffordable
                      ? 'bg-brand-lime hover:bg-brand-lime-dim text-navy-950 shadow-glow-lime cursor-pointer'
                      : 'bg-navy-800 text-slate-500 border border-navy-750 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Proceed to Confirmation
                </button>
              </div>
            </form>
          </div>

          {/* Quick Context Card */}
          <div className="bg-navy-900/40 border border-navy-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Info className="w-4 h-4 text-brand-violet-light" />
              <span>Simulated Guardrails</span>
            </div>
            <p className="leading-relaxed">
              PaisaPilot guarantees your <strong className="text-slate-200">₹{state.unpaidCommitments.toLocaleString('en-IN')} unpaid commitments</strong> (rent, bills) are never double-counted or overlooked. If an expense cuts into commitments or your <strong className="text-slate-200">₹{state.savingsGoal.toLocaleString('en-IN')} savings target</strong>, the Decision Lab warns you immediately.
            </p>
          </div>
        </div>

        {/* Right Column: Live What-If Comparison Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Explanation Banner */}
          <div
            className={`border rounded-2xl p-5 transition-all ${getSeverityAlertStyle(
              simulation.impactAnalysis.severity
            )}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-navy-950/40 shrink-0 mt-0.5">
                {simulation.impactAnalysis.severity === 'neutral' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : simulation.impactAnalysis.severity === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <AlertOctagon className="w-5 h-5 text-rose-400" />
                )}
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-100">
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
                    : 'Enter an amount or select one of the test presets on the left to inspect before-and-after financial impact.'}
                </p>
                {hasSimulatedAmount && (
                  <div className="pt-2 text-[11px] text-slate-400 space-y-1 border-t border-navy-800/40">
                    <div>
                      <strong className="text-slate-300">Daily Runway:</strong>{' '}
                      {simulation.impactAnalysis.runwayImpactText}
                    </div>
                    <div>
                      <strong className="text-slate-300">Savings Target:</strong>{' '}
                      {simulation.impactAnalysis.goalImpactText}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Before & After Metrics Comparison Grid */}
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-card-dark space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-lime" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Before vs After Comparison
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {hasSimulatedAmount ? (
                  <span className="font-mono text-brand-lime">Live Preview Active</span>
                ) : (
                  'Baseline State'
                )}
              </span>
            </div>

            <div className="space-y-3">
              {/* Row 1: Current Balance */}
              <div className="p-4 bg-navy-950/70 rounded-xl border border-navy-800/80 hover:border-navy-700 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                    Total Cash Balance
                  </span>
                  {hasSimulatedAmount && (
                    <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      −₹{amountNumber.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block uppercase">Current</span>
                    <span className="text-lg font-bold text-slate-200 font-mono">
                      ₹{metrics.balance.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block uppercase">Simulated</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        hasSimulatedAmount
                          ? simulation.simulatedMetrics.balance >= 0
                            ? 'text-slate-100'
                            : 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      ₹{simulation.simulatedMetrics.balance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Spendable after commitments */}
              <div className="p-4 bg-navy-950/70 rounded-xl border border-navy-800/80 hover:border-navy-700 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Spendable After ₹{state.unpaidCommitments.toLocaleString('en-IN')} Commitments
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
                        ? `₹${simulation.simulatedMetrics.spendableAfterCommitments.toLocaleString('en-IN')} remaining`
                        : `Deficit: ₹${Math.abs(simulation.simulatedMetrics.spendableAfterCommitments).toLocaleString('en-IN')}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block uppercase">Current</span>
                    <span className="text-lg font-bold text-slate-200 font-mono">
                      ₹{metrics.spendableAfterCommitments.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block uppercase">Simulated</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        simulation.simulatedMetrics.spendableAfterCommitments < 0
                          ? 'text-rose-400'
                          : 'text-brand-lime'
                      }`}
                    >
                      ₹{simulation.simulatedMetrics.spendableAfterCommitments.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Daily Allowance */}
              <div className="p-4 bg-navy-950/70 rounded-xl border border-navy-800/80 hover:border-navy-700 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-brand-lime" />
                    Daily Discretionary Allowance (30 Days)
                  </span>
                  {hasSimulatedAmount && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        simulation.deltas.dailyAllowance === 0
                          ? 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      }`}
                    >
                      {simulation.deltas.dailyAllowance <= 0 ? '−' : '+'}₹
                      {Math.abs(simulation.deltas.dailyAllowance).toFixed(2)}/day ({simulation.deltas.dailyAllowancePercentChange}%)
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block uppercase">Current</span>
                    <span className="text-lg font-bold text-slate-200 font-mono">
                      ₹{metrics.dailyAllowance.toFixed(2)}/d
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block uppercase">Simulated</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        simulation.simulatedMetrics.dailyAllowance < 50
                          ? 'text-rose-400'
                          : simulation.simulatedMetrics.dailyAllowance < 150
                          ? 'text-amber-300'
                          : 'text-brand-lime'
                      }`}
                    >
                      ₹{simulation.simulatedMetrics.dailyAllowance.toFixed(2)}/d
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 4: Savings Goal Feasibility */}
              <div className="p-4 bg-navy-950/70 rounded-xl border border-navy-800/80 hover:border-navy-700 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-brand-violet-light" />
                    ₹2,000 Savings Goal Feasibility
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
                        : `Shortfall: ₹${simulation.simulatedMetrics.savingsShortfall.toLocaleString('en-IN')}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block uppercase">Current Target</span>
                    <span className="text-sm font-semibold text-emerald-400">
                      Fully Protected
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block uppercase">Simulated Status</span>
                    <span
                      className={`text-sm font-bold ${
                        simulation.simulatedMetrics.savingsFeasible
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {simulation.simulatedMetrics.savingsFeasible
                        ? 'Feasible'
                        : `Strained (−₹${simulation.simulatedMetrics.savingsShortfall.toLocaleString('en-IN')})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 5: Risk Level & Health Score */}
              <div className="p-4 bg-navy-950/70 rounded-xl border border-navy-800/80 hover:border-navy-700 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-brand-violet" />
                    Health Score & Risk Assessment
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
                    <span className="text-[11px] text-slate-500 block uppercase">Current</span>
                    <span className="text-sm font-bold text-slate-200">
                      {metrics.healthScore}/100 ({metrics.riskLevel.toUpperCase()})
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block uppercase">Simulated</span>
                    <span
                      className={`text-sm font-bold ${
                        simulation.simulatedMetrics.riskLevel === 'safe'
                          ? 'text-emerald-400'
                          : simulation.simulatedMetrics.riskLevel === 'caution'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {simulation.simulatedMetrics.healthScore}/100 (
                      {simulation.simulatedMetrics.riskLevel.replace('_', ' ').toUpperCase()})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
