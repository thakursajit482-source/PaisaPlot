import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Shield,
  Calendar,
  Target,
  ArrowRight,
  TrendingUp,
  Sparkles,
  PieChart,
  Clock,
  CheckCircle,
  PlusCircle,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Tag,
  Zap,
  Repeat,
  CalendarDays,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatINR, generateForecast, calculateGoalsTotals, calculateHealthScoreBreakdown } from '../../finance/calculations';
import { AddIncomeModal } from '../common/AddIncomeModal';
import { UnexpectedExpenseModal } from '../common/UnexpectedExpenseModal';
import { HealthScoreModal } from './HealthScoreModal';

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

  const forecast = useMemo(() => generateForecast(state), [state]);
  const goalsTotals = useMemo(() => calculateGoalsTotals(state.goals), [state.goals]);
  const unpaidBillsCount = state.bills.filter((b) => !b.isPaid).length;
  const activeSubsCount = state.subscriptions.filter((s) => s.active).length;

  // Capital allocation percentages
  const starting = state.startingBudget > 0 ? state.startingBudget : 10000;
  const commitmentPercent = Math.min(100, Math.round((state.unpaidCommitments / starting) * 100));
  const savingsPercent = Math.min(100, Math.round((metrics.remainingSavingsTarget / starting) * 100));
  const discretionaryPercent = Math.max(0, 100 - commitmentPercent - savingsPercent);

  // Latest 5 recorded transactions, newest first
  const recentTransactions = state.transactions
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner with Quick Actions */}
      <div className="relative overflow-hidden bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-navy-750 rounded-2xl p-6 md:p-8 shadow-card-dark">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lime/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-lime/10 text-brand-lime border border-brand-lime/20">
              <Sparkles className="w-3.5 h-3.5" />
              30-Day Budget Management Sandbox
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              Manage {formatINR(state.startingBudget)} with Mathematical Certainty
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every prospective expense affects your essential bills and daily runway. Test simulated purchases before spending, or record newly earned income to bolster your buffer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddIncomeOpen(true)}
              className="px-3.5 py-3 rounded-xl font-bold text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Record Income</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUnexpectedExpenseOpen(true)}
              className="px-3.5 py-3 rounded-xl font-bold text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Zap className="w-4 h-4 text-rose-400" />
              <span>Unexpected Expense</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToDecisionLab}
              className="px-4 py-3 rounded-xl font-bold text-xs bg-brand-lime hover:bg-brand-lime-dim text-navy-950 transition-all shadow-glow-lime flex items-center gap-2 cursor-pointer group"
            >
              <span>Simulate What-If Purchase</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Key Metrics (Prominent 2-Card Hero) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hero Card 1: Current Balance */}
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-card-dark relative overflow-hidden group hover:border-navy-700 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-navy-850 text-brand-lime border border-navy-750">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Current Total Balance
              </span>
            </div>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-navy-950 border border-navy-800 text-slate-400">
              {state.daysRemaining} days remaining
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-mono tracking-tight">
            {formatINR(metrics.balance)}
          </div>
          <div className="mt-3 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-navy-800/80">
            <span>Starting Budget: <strong className="text-slate-200">{formatINR(state.startingBudget)}</strong></span>
            <span className="text-emerald-400 font-medium">
              Net Flow: {formatINR(metrics.totalIncome - metrics.totalExpenses, { includeSign: true })}
            </span>
          </div>
        </div>

        {/* Hero Card 2: Daily Allowance */}
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-card-dark relative overflow-hidden group hover:border-navy-700 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-navy-850 text-brand-lime border border-navy-750">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Daily Discretionary Allowance
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-lime/10 text-brand-lime border border-brand-lime/30">
              Paced Pace
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-brand-lime font-mono tracking-tight">
            {formatINR(metrics.dailyAllowance, { decimals: 2 })}
            <span className="text-sm text-slate-400 font-normal font-sans ml-1.5">/ day</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-navy-800/80">
            <span>Spendable after bills & target: <strong className="text-slate-200">{formatINR(metrics.discretionaryRemaining)}</strong></span>
            <span className="text-brand-lime font-medium">Guards ₹3k bills</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid (6 Responsive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Metric 3: Total Recorded Income */}
        <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-5 shadow-card-dark hover:border-navy-750 transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Recorded Income
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {formatINR(metrics.totalIncome, { includeSign: true })}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Extra inflows recorded</span>
            <span className="text-emerald-500 font-medium">
              {state.transactions.filter((t) => t.type === 'income').length} entries
            </span>
          </div>
        </div>

        {/* Metric 4: Total Recorded Expenses */}
        <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-5 shadow-card-dark hover:border-navy-750 transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Recorded Expenses
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">
            {metrics.totalExpenses > 0 ? `−${formatINR(metrics.totalExpenses)}` : '₹0'}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Executed from Decision Lab</span>
            <span className="text-rose-400 font-medium">
              {state.transactions.filter((t) => t.type === 'expense').length} entries
            </span>
          </div>
        </div>

        {/* Metric 5: Unpaid Commitments */}
        <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-5 shadow-card-dark hover:border-navy-750 transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Unpaid Commitments
            </span>
            <div className="p-1.5 rounded-lg bg-navy-850 text-slate-300 border border-navy-750">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {formatINR(state.unpaidCommitments)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Rent & essential bills</span>
            <span className="text-emerald-400 font-medium">Protected floor</span>
          </div>
        </div>

        {/* Metric 6: Spendable Cash after Commitments */}
        <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-5 shadow-card-dark hover:border-navy-750 transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Spendable Cash
            </span>
            <div className="p-1.5 rounded-lg bg-navy-850 text-emerald-400 border border-navy-750">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {formatINR(metrics.spendableAfterCommitments)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Balance − Commitments</span>
            <span className="text-emerald-400 font-medium">Solvency intact</span>
          </div>
        </div>

        {/* Metric 7: Savings Goal Progress */}
        <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-5 shadow-card-dark hover:border-navy-750 transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Savings Goal Progress
            </span>
            <div className="p-1.5 rounded-lg bg-navy-850 text-brand-violet-light border border-navy-750">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-100 font-mono">
              {formatINR(goalsTotals.totalTarget > 0 ? goalsTotals.totalTarget : state.savingsGoal)}
            </div>
            <span className="text-xs font-semibold font-mono text-brand-violet-light">
              {metrics.savingsProgressPercent}%
            </span>
          </div>
          <div className="w-full bg-navy-950 h-2 rounded-full mt-2.5 overflow-hidden border border-navy-800">
            <div
              style={{ width: `${metrics.savingsProgressPercent}%` }}
              className="h-full bg-brand-violet rounded-full transition-all"
            />
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Status</span>
            <span className={metrics.savingsFeasible ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {metrics.savingsFeasible ? 'Achievable' : 'Strained'}
            </span>
          </div>
        </div>

        {/* Metric 8: Financial Health Score & Risk Level */}
        <div
          onClick={() => setIsHealthModalOpen(true)}
          className="bg-navy-900/90 border border-navy-800 rounded-2xl p-5 shadow-card-dark hover:border-brand-lime/50 transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsHealthModalOpen(true);
            }
          }}
          aria-label="View Financial Health Score 4-Pillar Breakdown"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-brand-lime transition-colors">
              Health Score & Risk
            </span>
            <div className="p-1.5 rounded-lg bg-navy-850 text-emerald-400 border border-navy-750 group-hover:bg-brand-lime/10 group-hover:text-brand-lime transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-100 font-mono">
              {metrics.healthScore}
              <span className="text-xs text-slate-500 font-normal font-sans ml-1">/ 100</span>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getRiskBadgeColor(
                metrics.riskLevel
              )}`}
            >
              {metrics.riskLevel.toUpperCase()}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span className="text-brand-lime text-[11px] font-medium group-hover:underline flex items-center gap-0.5">
              View 4-Pillar Breakdown →
            </span>
            <span className="text-slate-300 font-medium truncate max-w-[130px]" title={metrics.riskLabel}>
              {metrics.riskLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Interconnected Planning Hub: Upcoming Commitments & Multi-Goal Envelopes */}
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
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
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
                        className="h-full bg-brand-violet rounded-full transition-all"
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

      {/* Capital Allocation & Financial Guardrails Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Capital Structure Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-card-dark space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-brand-lime" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Capital Allocation Model
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Starting: {formatINR(state.startingBudget)}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            PaisaPilot guarantees your capital is partitioned mathematically so essential payments are never compromised:
          </p>

          {/* Allocation Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-navy-950 rounded-full overflow-hidden flex p-0.5 border border-navy-800">
              <div
                style={{ width: `${commitmentPercent}%` }}
                className="h-full bg-rose-500 rounded-l-full transition-all"
                title={`Unpaid Commitments: ${commitmentPercent}%`}
              />
              <div
                style={{ width: `${savingsPercent}%` }}
                className="h-full bg-brand-violet transition-all"
                title={`Savings Target: ${savingsPercent}%`}
              />
              <div
                style={{ width: `${discretionaryPercent}%` }}
                className="h-full bg-brand-lime rounded-r-full transition-all"
                title={`Discretionary Allowance: ${discretionaryPercent}%`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
              <div className="bg-navy-950/70 p-2.5 rounded-xl border border-navy-800">
                <div className="flex items-center gap-1.5 text-rose-400 font-medium mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Commitments</span>
                </div>
                <div className="font-mono font-bold text-slate-200">
                  {formatINR(state.unpaidCommitments)}
                </div>
                <div className="text-[10px] text-slate-500">{commitmentPercent}% locked bills</div>
              </div>

              <div className="bg-navy-950/70 p-2.5 rounded-xl border border-navy-800">
                <div className="flex items-center gap-1.5 text-brand-violet-light font-medium mb-1">
                  <span className="w-2 h-2 rounded-full bg-brand-violet" />
                  <span>Savings Target</span>
                </div>
                <div className="font-mono font-bold text-slate-200">
                  {formatINR(metrics.remainingSavingsTarget)}
                </div>
                <div className="text-[10px] text-slate-500">{savingsPercent}% cushion</div>
              </div>

              <div className="bg-navy-950/70 p-2.5 rounded-xl border border-navy-800">
                <div className="flex items-center gap-1.5 text-brand-lime font-medium mb-1">
                  <span className="w-2 h-2 rounded-full bg-brand-lime" />
                  <span>Discretionary</span>
                </div>
                <div className="font-mono font-bold text-slate-200">
                  {formatINR(metrics.discretionaryRemaining)}
                </div>
                <div className="text-[10px] text-slate-500">{discretionaryPercent}% free spend</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Solvency & Safety Checks (5 cols) */}
        <div className="lg:col-span-5 bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-card-dark space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Solvency Audit
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                100% Verified
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Real-time mathematical guardrails enforce bill solvency and protect savings from impulsive expenditures.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-navy-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Commitment Buffer
                </span>
                <span className="text-slate-200 font-mono font-semibold">
                  {metrics.spendableAfterCommitments >= 0 ? 'Protected' : 'Impaired'} ({formatINR(metrics.spendableAfterCommitments)})
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-navy-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  {metrics.savingsFeasible ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  Savings Viability
                </span>
                <span className="text-slate-200 font-mono font-semibold">
                  {metrics.savingsFeasible ? 'Achievable' : `Deficit: ${formatINR(metrics.savingsShortfall)}`}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-lime" />
                  Paced Daily Burn
                </span>
                <span className="text-brand-lime font-mono font-semibold">
                  {formatINR(metrics.dailyAllowance, { decimals: 2 })}/day
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddIncomeOpen(true)}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Income
            </button>
            <button
              type="button"
              onClick={onNavigateToDecisionLab}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-navy-950 bg-brand-lime hover:bg-brand-lime-dim transition-all flex items-center justify-center gap-1.5 shadow-glow-lime"
            >
              Simulate
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Recent Transactions (Latest 5) */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-card-dark space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-lime" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Recent Transactions
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
              <span>View All Transactions</span>
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
                className="px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Record Inflow
              </button>
              <button
                type="button"
                onClick={onNavigateToDecisionLab}
                className="px-3.5 py-2 text-xs font-bold text-navy-950 bg-brand-lime hover:bg-brand-lime-dim rounded-xl transition-all shadow-glow-lime flex items-center gap-1.5"
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

      {/* Add Income Modal */}
      <AddIncomeModal
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
      />

      {/* Unexpected Expense Modal */}
      <UnexpectedExpenseModal
        isOpen={isUnexpectedExpenseOpen}
        onClose={() => setIsUnexpectedExpenseOpen(false)}
      />

      {/* Financial Health Score 4-Pillar Breakdown Modal */}
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
