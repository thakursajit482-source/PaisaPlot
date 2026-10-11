import React from 'react';
import {
  X,
  Activity,
  ShieldCheck,
  TrendingUp,
  Target,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { HealthScoreBreakdown } from '../../types/finance';

interface HealthScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: HealthScoreBreakdown;
}

const factorIcons: Record<string, React.ReactNode> = {
  solvency: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
  trough: <TrendingUp className="w-4 h-4 text-cyan-400" />,
  savings: <Target className="w-4 h-4 text-amber-400" />,
  runway: <Compass className="w-4 h-4 text-purple-400" />,
};

const statusColors: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  excellent: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bar: 'bg-emerald-400',
  },
  good: {
    bg: 'bg-brand-lime/10',
    text: 'text-brand-lime',
    border: 'border-brand-lime/30',
    bar: 'bg-brand-lime',
  },
  caution: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    bar: 'bg-amber-400',
  },
  critical: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    bar: 'bg-rose-400',
  },
};

export const HealthScoreModal: React.FC<HealthScoreModalProps> = ({
  isOpen,
  onClose,
  breakdown,
}) => {
  if (!isOpen) return null;

  const { totalScore, riskLabel, factors, actionableGuidance, disclaimer } = breakdown;

  const scoreColor =
    totalScore >= 80
      ? 'text-emerald-400'
      : totalScore >= 60
      ? 'text-brand-lime'
      : totalScore >= 40
      ? 'text-amber-400'
      : 'text-rose-400';

  const riskBadgeColor =
    breakdown.riskLevel === 'safe'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : breakdown.riskLevel === 'caution'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      : breakdown.riskLevel === 'high_risk'
      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
      : 'bg-rose-500/15 text-rose-300 border-rose-500/30';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="health-score-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] glass-panel-elevated rounded-2xl shadow-[0_24px_60px_0_rgba(0,0,0,0.65)] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-800 bg-navy-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-lime/10 border border-brand-lime/20 text-brand-lime">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="health-score-modal-title"
                className="text-base font-bold text-slate-100 flex items-center gap-2.5"
              >
                Financial Health Score Breakdown
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${riskBadgeColor}`}>
                  {riskLabel}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transparent mathematical scoring across 4 solvency and runway factors.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Top Score Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-navy-950 border border-navy-800">
            <div className="flex items-center gap-4">
              <div className="flex items-baseline font-mono">
                <span className={`text-4xl font-extrabold ${scoreColor}`}>{totalScore}</span>
                <span className="text-slate-500 text-sm ml-1">/100</span>
              </div>
              <div className="border-l border-navy-800 pl-4 space-y-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Aggregate Rating
                </span>
                <span className="text-sm font-bold text-slate-200">
                  {totalScore >= 80
                    ? 'Excellent Financial Cushion'
                    : totalScore >= 60
                    ? 'Stable Operating Runway'
                    : totalScore >= 40
                    ? 'Constrained Cash Margin'
                    : 'Critical Solvency Alert'}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 sm:text-right">
              <span className="block font-medium text-slate-300">100% Deterministic Engine</span>
              <span className="block text-slate-500 text-[11px]">No opaque black-box AI ratings</span>
            </div>
          </div>

          {/* 4 Factor Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              The 4 Evaluated Pillars
            </h3>

            <div className="space-y-3">
              {factors.map((factor) => {
                const colors = statusColors[factor.status] || statusColors.good;
                const percent = Math.min(100, Math.round((factor.score / factor.maxScore) * 100));

                return (
                  <div
                    key={factor.id}
                    className="p-3.5 rounded-xl bg-navy-950/70 border border-navy-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {factorIcons[factor.id]}
                        <span className="text-sm font-bold text-slate-200">{factor.name}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-navy-800 text-slate-400 font-mono">
                          {factor.weightPercent}% weight
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-slate-200">
                          {factor.score}
                          <span className="text-slate-500 font-normal"> / {factor.maxScore} pts</span>
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {factor.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-navy-850 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${colors.bar}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs">
                      <p className="text-slate-300 font-medium">{factor.headline}</p>
                      <p className="text-slate-400 text-[11px] sm:text-right">{factor.description}</p>
                    </div>

                    <div className="pt-1.5 border-t border-navy-850/80 flex items-start gap-1.5 text-[11px] text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-lime shrink-0 mt-0.5" />
                      <span>{factor.guidance}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actionable Non-Judgmental Guidance */}
          {actionableGuidance.length > 0 && (
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Actionable Optimization Guidance
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {actionableGuidance.map((guidance, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand-lime font-bold">•</span>
                    <span>{guidance}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Educational Simulator Notice */}
          <div className="p-3.5 rounded-xl bg-navy-950/40 border border-navy-800/80 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>{disclaimer}</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-navy-800 bg-navy-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-lime text-slate-950 hover:bg-lime-400 transition-colors cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
