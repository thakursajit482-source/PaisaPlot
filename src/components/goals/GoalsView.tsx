import React, { useState } from 'react';
import {
  Target,
  PlusCircle,
  PiggyBank,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { SavingsGoal } from '../../types/finance';
import { formatINR, calculateGoalProgress } from '../../finance/calculations';
import { GoalModal } from './GoalModal';
import { GoalContributionModal } from './GoalContributionModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { GlassCard } from '../common/GlassmorphismCard';

interface GoalsViewProps {
  onNavigateToDecisionLab: () => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ onNavigateToDecisionLab }) => {
  const { state, metrics, deleteGoal } = useFinance();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | null>(null);
  const [goalToContribute, setGoalToContribute] = useState<SavingsGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  const goals = state.goals || [];

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.alreadySaved, 0);
  const remainingNeeded = Math.max(0, totalTarget - totalSaved);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const getTargetDateLabel = (dateStr?: string) => {
    if (!dateStr) return 'No target deadline';
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) return 'No deadline';
    const now = new Date();
    const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return 'Due today';
    return `Target in ${diffDays} days`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Savings Envelopes & Goals
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ring-fence capital for specific milestones. Contributions allocate existing funds without being counted twice.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl font-bold text-xs bg-brand-violet-light hover:bg-violet-300 text-navy-950 transition-all shadow-glow-violet flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <GlassCard variant="panel" glow="violet" className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-violet/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-violet/10 border border-brand-violet/20 text-brand-violet-light">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Total Envelopes Portfolio</h2>
              <span className="text-xs text-slate-400">
                {goals.length} {goals.length === 1 ? 'goal active' : 'goals active'}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 text-right">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Total Funded</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                {formatINR(totalSaved)}
              </span>
            </div>
            <span className="text-slate-600 font-mono">/</span>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Total Target</span>
              <span className="text-xl font-extrabold text-slate-200 font-mono">
                {formatINR(totalTarget)}
              </span>
            </div>
          </div>
        </div>

        {/* Combined Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400 font-mono">
              Overall Progress: <strong className="text-brand-violet-light">{overallProgress}%</strong>
            </span>
            <span className="text-slate-400 font-mono">
              Remaining Target: <strong className="text-slate-200">{formatINR(remainingNeeded)}</strong>
            </span>
          </div>

          <div className="h-2.5 w-full bg-navy-950/80 rounded-full overflow-hidden border border-white/[0.08]">
            <div
              style={{ width: `${overallProgress}%` }}
              className="h-full bg-gradient-to-r from-brand-violet to-brand-violet-light transition-all duration-500 rounded-full"
            />
          </div>
        </div>

        {/* Live Safety Checks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-3 border-t border-white/[0.08]">
          <div className="flex items-center justify-between p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.08]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Spendable Cash Margin:
            </span>
            <span className="font-mono font-bold text-slate-200">
              {formatINR(metrics.spendableAfterCommitments)}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.08]">
            <span className="flex items-center gap-1.5 text-slate-400">
              {metrics.savingsFeasible ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
              Feasibility Status:
            </span>
            <span className={`font-semibold ${metrics.savingsFeasible ? 'text-emerald-400' : 'text-amber-400'}`}>
              {metrics.savingsFeasible ? '100% Achievable' : `Shortfall: ${formatINR(metrics.savingsShortfall)}`}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Goals Cards List */}
      {goals.length === 0 ? (
        <GlassCard variant="subtle" className="p-12 text-center max-w-xl mx-auto space-y-4 my-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400">
            <Target className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">No Savings Goals Active</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Create goal envelopes to set aside portions of your discretionary capital for emergency reserves, gadgets, or travel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-violet-light text-navy-950 hover:bg-violet-300 transition-all shadow-glow-violet cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Create Your First Goal
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const { progressPercent, remainingTarget: remaining, isCompleted } = calculateGoalProgress(goal);

            return (
              <GlassCard
                key={goal.id}
                variant="panel"
                hoverEffect
                className="p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{goal.name}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{getTargetDateLabel(goal.targetDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setGoalToEdit(goal)}
                        title="Edit goal"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalToDelete(goal)}
                        title="Delete goal"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.04] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.08] mb-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Target Amount:</span>
                      <span className="font-mono font-bold text-slate-200">{formatINR(goal.targetAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Already Saved:</span>
                      <span className="font-mono font-bold text-emerald-400">{formatINR(goal.alreadySaved)}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-white/[0.08]">
                      <span className="text-slate-400">Remaining Needed:</span>
                      <span className="font-mono text-slate-300 font-semibold">{formatINR(remaining)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-400">Funded</span>
                      <span className="font-mono text-brand-violet-light">{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-navy-950/80 rounded-full overflow-hidden border border-white/[0.08]">
                      <div
                        style={{ width: `${progressPercent}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-400' : 'bg-brand-violet'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-white/[0.08]">
                  {isCompleted ? (
                    <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Target 100% Achieved</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setGoalToContribute(goal)}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-navy-950 bg-brand-lime hover:bg-brand-lime-dim transition-all shadow-glow-lime flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PiggyBank className="w-4 h-4" />
                      <span>Contribute to Goal</span>
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Decision Lab Callout */}
      <GlassCard variant="subtle" className="p-5 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-brand-lime shrink-0" />
          <span>
            The Decision Lab automatically tests prospective purchases against your total {formatINR(totalTarget)} goals portfolio.
          </span>
        </div>
        <button
          type="button"
          onClick={onNavigateToDecisionLab}
          className="self-start sm:self-auto px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 rounded-xl font-semibold transition-colors border border-white/[0.08] flex items-center gap-1.5 shrink-0"
        >
          <span>Test in Decision Lab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </GlassCard>

      {/* Modals */}
      <GoalModal
        isOpen={isCreateModalOpen || goalToEdit !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setGoalToEdit(null);
        }}
        goalToEdit={goalToEdit}
      />

      <GoalContributionModal
        isOpen={goalToContribute !== null}
        onClose={() => setGoalToContribute(null)}
        goal={goalToContribute}
      />

      <DeleteConfirmModal
        isOpen={goalToDelete !== null}
        onClose={() => setGoalToDelete(null)}
        onConfirm={() => {
          if (goalToDelete) deleteGoal(goalToDelete.id);
        }}
        title="Delete Savings Goal?"
        message={`Are you sure you want to delete "${goalToDelete?.name}"? Any allocated funds will be returned to your spendable cash.`}
        confirmLabel="Yes, Delete Goal"
      />
    </div>
  );
};
