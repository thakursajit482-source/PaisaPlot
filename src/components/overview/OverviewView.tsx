import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Shield,
  Calendar,
  Target,
  ArrowRight,
  Sparkles,
  PieChart,
  PlusCircle,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Zap,
  Repeat,
  CalendarDays,
  Compass,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatINR,
  generateForecast,
  calculateHealthScoreBreakdown,
  calculateFinancialRunway,
  getDeterministicFinancialInsights,
} from '../../finance/calculations';
import { AddIncomeModal } from '../common/AddIncomeModal';
import { UnexpectedExpenseModal } from '../common/UnexpectedExpenseModal';
import { HealthScoreModal } from './HealthScoreModal';
import { GoalModal } from '../goals/GoalModal';

interface OverviewViewProps {
  onNavigateToDecisionLab: () => void;
  onNavigateToTransactions: () => void;
  onNavigateToGoals?: () => void;
  onNavigateToForecast?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigateToDecisionLab,
  onNavigateToTransactions,
  onNavigateToGoals,
  onNavigateToForecast,
}) => {
  const { state, metrics } = useFinance();
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isUnexpectedExpenseOpen, setIsUnexpectedExpenseOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);

  const forecast = useMemo(() => generateForecast(state), [state]);
  const unpaidBillsCount = state.bills.filter((b) => !b.isPaid).length;
  const activeSubsCount = state.subscriptions.filter((s) => s.active).length;

  // Pure deterministic runway & insights
  const runway = useMemo(() => calculateFinancialRunway(state, metrics, forecast), [state, metrics, forecast]);
  const insights = useMemo(
    () => getDeterministicFinancialInsights(state, metrics, forecast),
    [state, metrics, forecast]
  );

  // Capital allocation percentages
  const starting = state.startingBudget > 0 ? state.startingBudget : 10000;
  const commitmentPercent = Math.min(100, Math.round((state.unpaidCommitments / starting) * 100));
  const savingsPercent = Math.min(100, Math.round((metrics.remainingSavingsTarget / starting) * 100));
  const discretionaryPercent = Math.max(0, 100 - commitmentPercent - savingsPercent);

  // Latest 5 recorded transactions, newest first
  const recentTransactions = useMemo(() => {
    return state.transactions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [state.transactions]);

  const netFlow = metrics.totalIncome - metrics.totalExpenses;

  const getRunwayBadgeColor = (status: string) => {
    switch (status) {
      case 'solvent':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'caution':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const handleInsightAction = (actionTab?: string) => {
    if (actionTab === 'decision-lab') onNavigateToDecisionLab();
    else if (actionTab === 'transactions') onNavigateToTransactions();
    else if (actionTab === 'goals' && onNavigateToGoals) onNavigateToGoals();
    else if (actionTab === 'forecast' && onNavigateToForecast) onNavigateToForecast();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Command Center Header & Quick Actions Bar */}
      <div className="relative overflow-hidden bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-navy-750 rounded-2xl p-6 md:p-8 shadow-card-dark">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lime/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-lime/10 text-brand-lime border border-brand-lime/25">
              <span className="w-2 h-2 rounded-full bg-brand-lime animate-pulse" />
              <span>Financial Command Center • 30-Day Sandbox</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight font-sans">
              Control <span className="text-brand-lime">{formatINR(state.startingBudget)}</span> with Mathematical Certainty
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Every prospective expense affects upcoming commitments and daily survival runway. Test simulated purchases before spending real money.
            </p>
          </div>

          {/* 4 Prioritized Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsAddIncomeOpen(true)}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Record Income</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUnexpectedExpenseOpen(true)}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none"
            >
              <Zap className="w-4 h-4 text-rose-400" />
              <span>Unexpected Outflow</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddGoalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-brand-violet/15 hover:bg-brand-violet/25 text-brand-violet-light border border-brand-violet/40 transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none"
            >
              <Target className="w-4 h-4 text-brand-violet-light" />
              <span>Add Goal</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToDecisionLab}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-brand-lime hover:bg-brand-lime-dim text-navy-950 transition-all shadow-glow-lime flex items-center gap-2 cursor-pointer group hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simulate Purchase</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform motion-reduce:transform-none" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Distinctive Financial Hero Section (Balance Anchor + Allowance Gauge) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Hero Anchor (7 Cols): Current Balance & 30-Day Runway Bar */}
        <div className="lg:col-span-7 bg-navy-900 border border-navy-800 rounded-2xl p-6 sm:p-7 shadow-card-dark relative overflow-hidden flex flex-col justify-between group hover:border-navy-700 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-navy-950 text-brand-lime border border-navy-800 shadow-sm">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Current Total Balance
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Starting Budget: {formatINR(state.startingBudget)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-navy-950 border border-navy-800 text-slate-300 font-semibold">
                  {state.daysRemaining} Days Left
                </span>
              </div>
            </div>

            {/* Giant Balance Typography */}
            <div className="pt-1">
              <div className="text-4xl sm:text-5xl font-black text-slate-100 font-mono tracking-tight">
                {formatINR(metrics.balance)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <span
                  className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md ${
                    netFlow >= 0
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {netFlow >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {formatINR(netFlow, { includeSign: true })} Net Flow
                </span>
                <span className="text-slate-400">
                  Total Income: <strong className="text-emerald-400">{formatINR(metrics.totalIncome)}</strong>
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">
                  Total Expenses: <strong className="text-rose-400">{formatINR(metrics.totalExpenses)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Integrated 30-Day Financial Runway Indicator */}
          <div className="mt-6 pt-5 border-t border-navy-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-lime" />
                <span className="font-bold text-slate-200 uppercase tracking-wider">
                  30-Day Cash Survival Runway
                </span>
              </div>
              <span className={`text-[11px] font-semibold font-mono px-2.5 py-0.5 rounded-full border ${getRunwayBadgeColor(runway.status)}`}>
                {runway.statusLabel}
              </span>
            </div>

            {/* Progress Bar of Runway Days */}
            <div className="space-y-1.5">
              <div className="w-full bg-navy-950 h-2.5 rounded-full overflow-hidden border border-navy-800 flex">
                <div
                  style={{ width: `${runway.runwayPercent}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    runway.status === 'solvent'
                      ? 'bg-gradient-to-r from-emerald-500 to-brand-lime'
                      : runway.status === 'caution'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                      : 'bg-gradient-to-r from-rose-600 to-rose-400'
                  }`}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                <span>Day 0 (Start)</span>
                <span className="text-slate-300 font-semibold">
                  Trough: {formatINR(runway.troughBalance)} on Day {runway.daysUntilTrough}
                </span>
                <span>Day {state.daysRemaining} (Goal)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {runway.description}
            </p>
          </div>
        </div>

        {/* Right Hero Block (5 Cols): Dynamic Daily Discretionary Allowance Speedometer */}
        <div className="lg:col-span-5 bg-navy-900 border border-navy-800 rounded-2xl p-6 sm:p-7 shadow-card-dark relative overflow-hidden flex flex-col justify-between group hover:border-navy-700 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-navy-950 text-brand-lime border border-navy-800 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Daily Discretionary Allowance
                  </span>
                  <span className="text-[11px] text-slate-500">Paced for {state.daysRemaining} days</span>
                </div>
              </div>

              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-lime/10 text-brand-lime border border-brand-lime/30 font-mono">
                Paced Burn
              </span>
            </div>

            <div>
              <div className="text-4xl sm:text-5xl font-black text-brand-lime font-mono tracking-tight">
                {formatINR(metrics.dailyAllowance, { decimals: 2 })}
                <span className="text-base text-slate-400 font-normal font-sans ml-1.5">/ day</span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Spendable cash remaining after strictly safeguarding ₹{state.unpaidCommitments.toLocaleString('en-IN')} in unpaid bills and your ₹{metrics.remainingSavingsTarget.toLocaleString('en-IN')} savings goal.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-navy-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Discretionary Remaining:</span>
              <span className="font-mono font-bold text-slate-100 text-sm">
                {formatINR(metrics.discretionaryRemaining)}
              </span>
            </div>

            <button
              type="button"
              onClick={onNavigateToDecisionLab}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-navy-950 bg-brand-lime hover:bg-brand-lime-dim rounded-xl transition-all shadow-glow-lime flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Spend vs Today's Allowance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Meaningful Capital Structure Breakdown (Liquidity Ribbon) */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-card-dark space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brand-lime" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Capital Structure & Liquidity Allocation
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Starting Base: {formatINR(state.startingBudget)}
          </span>
        </div>

        {/* Visual Partition Ribbon */}
        <div className="space-y-3">
          <div className="h-5 w-full bg-navy-950 rounded-full overflow-hidden flex p-0.5 border border-navy-800 shadow-inner">
            <div
              style={{ width: `${commitmentPercent}%` }}
              className="h-full bg-rose-500 rounded-l-full transition-all duration-500"
              title={`Unpaid Commitments: ${commitmentPercent}%`}
            />
            <div
              style={{ width: `${savingsPercent}%` }}
              className="h-full bg-brand-violet transition-all duration-500"
              title={`Savings Target: ${savingsPercent}%`}
            />
            <div
              style={{ width: `${discretionaryPercent}%` }}
              className="h-full bg-brand-lime rounded-r-full transition-all duration-500"
              title={`Discretionary Spendable: ${discretionaryPercent}%`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Pillar 1: Commitments */}
            <div className="bg-navy-950/80 p-3.5 rounded-xl border border-navy-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  Unpaid Commitments
                </span>
                <span className="font-mono text-slate-400 text-[11px] font-bold">{commitmentPercent}%</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-100">
                {formatINR(state.unpaidCommitments)}
              </div>
              <p className="text-[10px] text-slate-400">
                Essential bills ring-fenced from discretionary spending.
              </p>
            </div>

            {/* Pillar 2: Savings Cushion */}
            <div className="bg-navy-950/80 p-3.5 rounded-xl border border-navy-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-violet-light font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-violet shrink-0" />
                  Savings Envelopes
                </span>
                <span className="font-mono text-slate-400 text-[11px] font-bold">{savingsPercent}%</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-100">
                {formatINR(metrics.remainingSavingsTarget)}
              </div>
              <p className="text-[10px] text-slate-400">
                Allocated goal cushion ({metrics.savingsProgressPercent}% funded so far).
              </p>
            </div>

            {/* Pillar 3: Discretionary Spendable */}
            <div className="bg-navy-950/80 p-3.5 rounded-xl border border-navy-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-lime font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-lime shrink-0" />
                  Discretionary Spendable
                </span>
                <span className="font-mono text-slate-400 text-[11px] font-bold">{discretionaryPercent}%</span>
              </div>
              <div className="text-lg font-bold font-mono text-brand-lime">
                {formatINR(metrics.spendableAfterCommitments)}
              </div>
              <p className="text-[10px] text-slate-400">
                True unencumbered cash ready for safe daily use.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Concise Financial Insight Panel (Deterministic Calculations) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-lime" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Deterministic Financial Intelligence
            </h2>
          </div>
          <span className="text-xs text-slate-500">100% Calculated • Zero Fabrication</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                insight.type === 'success'
                  ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-300'
                  : insight.type === 'warning'
                  ? 'bg-amber-950/25 border-amber-500/30 text-amber-300'
                  : insight.type === 'critical'
                  ? 'bg-rose-950/25 border-rose-500/30 text-rose-300'
                  : 'bg-navy-900 border-navy-800 text-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {insight.title}
                  </h3>
                  {insight.metricLabel && (
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-navy-950/80 border border-navy-750 text-slate-200">
                      {insight.metricLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {insight.description}
                </p>
              </div>

              {insight.actionText && (
                <div className="pt-3 mt-3 border-t border-navy-800/60">
                  <button
                    type="button"
                    onClick={() => handleInsightAction(insight.actionTab)}
                    className="text-xs font-bold text-brand-lime hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{insight.actionText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Interconnected Planning Hub: Obligations & Envelopes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Upcoming Obligations & 30-Day Forecast Safety */}
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-card-dark space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-brand-lime" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Upcoming Commitments & Runway Safety
                </h3>
              </div>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  forecast.lowestProjectedBalance > 0
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {forecast.lowestProjectedBalance > 0 ? 'Solvent Runway' : 'Deficit Risk'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Future commitments are protected dynamically. Subscriptions charge on scheduled calendar dates, and bills remain safeguarded until verified as paid.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-navy-950/80 p-3 rounded-xl border border-navy-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                  <span>Unpaid Bills ({unpaidBillsCount})</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-100">
                  {formatINR(state.unpaidCommitments)}
                </div>
                <div className="text-[10px] text-slate-500">
                  {state.bills.length} total tracked bills
                </div>
              </div>

              <div className="bg-navy-950/80 p-3 rounded-xl border border-navy-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Repeat className="w-3.5 h-3.5 text-sky-400" />
                  <span>Subscriptions ({activeSubsCount})</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-100">
                  {formatINR(forecast.totalExpectedSubscriptions)}
                </div>
                <div className="text-[10px] text-slate-500">
                  30-day projected charges
                </div>
              </div>
            </div>

            <div className="p-3 bg-navy-950/60 rounded-xl border border-navy-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Lowest Projected Trough:</span>
              <span className="font-mono font-bold text-slate-200">
                {formatINR(forecast.lowestProjectedBalance)}{' '}
                <span className="text-slate-500 text-[11px] font-normal">
                  (Day {forecast.lowestBalanceDay})
                </span>
              </span>
            </div>
          </div>

          {onNavigateToForecast && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateToForecast}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-navy-850 hover:bg-navy-800 border border-navy-750 hover:border-navy-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Full 30-Day Trajectory & Obligations</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-lime" />
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Savings Goals Envelopes */}
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-card-dark space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-violet-light" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Customizable Savings Goals
                </h3>
              </div>
              <span className="text-xs font-mono text-brand-violet-light font-semibold">
                {state.goals.length} {state.goals.length === 1 ? 'Goal' : 'Goals'} Active
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Allocate money into custom goal envelopes without double-counting cash. Track priority, target dates, and funding feasibility.
            </p>

            <div className="space-y-2.5 pt-1">
              {state.goals.slice(0, 2).map((goal) => {
                const pct =
                  goal.targetAmount > 0
                    ? Math.min(100, Math.round((goal.alreadySaved / goal.targetAmount) * 100))
                    : 0;
                return (
                  <div
                    key={goal.id}
                    className="p-3 bg-navy-950/80 rounded-xl border border-navy-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{goal.name}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-navy-900 border border-navy-750 text-slate-400">
                          {goal.priority ?? 'medium'}
                        </span>
                      </div>
                      <span className="font-mono text-slate-300 font-bold">
                        {formatINR(goal.alreadySaved)} / {formatINR(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="w-full bg-navy-900 h-1.5 rounded-full overflow-hidden border border-navy-800">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-brand-violet rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {onNavigateToGoals && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateToGoals}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-navy-850 hover:bg-navy-800 border border-navy-750 hover:border-navy-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Manage & Fund Savings Goals</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-violet-light" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 6. Recent Verified Activity Feed */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-card-dark space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-lime" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Live Activity Feed
            </h3>
            <span className="text-xs text-slate-500 font-mono ml-1">
              ({recentTransactions.length} of {state.transactions.length})
            </span>
          </div>

          {state.transactions.length > 0 && (
            <button
              type="button"
              onClick={onNavigateToTransactions}
              className="text-xs font-bold text-brand-lime hover:text-brand-lime-dim flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-10 px-4 bg-navy-950/40 rounded-xl border border-navy-800/80 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-navy-850 flex items-center justify-center text-slate-500">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-300">No Transactions Recorded Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Test simulated purchases in the Decision Lab or record income inflows to start tracking activity.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddIncomeOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Record Inflow
              </button>
              <button
                type="button"
                onClick={onNavigateToDecisionLab}
                className="px-3.5 py-2 text-xs font-bold text-navy-950 bg-brand-lime hover:bg-brand-lime-dim rounded-xl transition-all shadow-glow-lime flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Simulate Purchase
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-navy-800/80">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3.5 flex items-center justify-between gap-3 hover:bg-navy-850/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{tx.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1 bg-navy-850 px-2 py-0.5 rounded text-[11px] border border-navy-750">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {tx.category}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-extrabold font-mono ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '−'}{formatINR(tx.amount)}
                  </span>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider">
                    {tx.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddIncomeModal
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
      />

      <UnexpectedExpenseModal
        isOpen={isUnexpectedExpenseOpen}
        onClose={() => setIsUnexpectedExpenseOpen(false)}
      />

      <GoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
      />

      <HealthScoreModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        breakdown={
          metrics.healthBreakdown ||
          calculateHealthScoreBreakdown(
            metrics.balance,
            state.unpaidCommitments,
            metrics.spendableAfterCommitments,
            metrics.remainingSavingsTarget,
            metrics.dailyAllowance,
            forecast.lowestProjectedBalance
          )
        }
      />
    </div>
  );
};
