import React from 'react';
import { ArrowUpRight, ArrowDownRight, Sliders, Sparkles } from 'lucide-react';

export interface GlassCardMetric {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface GlassCardProps {
  children?: React.ReactNode;
  variant?: 'panel' | 'elevated' | 'subtle';
  glow?: 'none' | 'emerald' | 'lime' | 'violet' | 'rose';
  hoverEffect?: boolean;
  className?: string;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  'aria-label'?: string;
}

/**
 * Reusable GlassCard container implementing PaisaPilot 2.1 frosted glass design system.
 * 
 * Specifications:
 * - Frosted background: rgba(18, 20, 28, 0.65)
 * - Backdrop filter: blur(20px) with solid dark fallback
 * - Border: 1px solid rgba(255, 255, 255, 0.08)
 * - Ambient shadows & subtle inset top highlight
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'panel',
  glow = 'none',
  hoverEffect = false,
  className = '',
  onClick,
  role,
  tabIndex,
  onKeyDown,
  'aria-label': ariaLabel,
}) => {
  const variantClass =
    variant === 'elevated'
      ? 'glass-panel-elevated'
      : variant === 'subtle'
      ? 'glass-subtle'
      : 'glass-panel';

  const glowClass =
    glow === 'emerald'
      ? 'glow-emerald'
      : glow === 'lime'
      ? 'glow-lime'
      : glow === 'violet'
      ? 'glow-violet'
      : glow === 'rose'
      ? 'glow-rose'
      : '';

  const hoverClass = hoverEffect
    ? 'transition-all duration-300 hover:border-white/[0.14] hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.45),0_0_32px_-4px_rgba(204,255,0,0.18)] cursor-pointer'
    : 'transition-all duration-300';

  return (
    <div
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      className={`rounded-2xl relative overflow-hidden text-slate-100 ${variantClass} ${glowClass} ${hoverClass} ${className}`}
    >
      {/* Subtle top light-sheen hairline */}
      <div className="absolute -top-[1px] left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};

export interface GlassmorphismCardProps {
  title: string;
  tag?: string;
  version?: string;
  mainLabel?: string;
  amount: string;
  amountDecimals?: string;
  amountChange?: string;
  isPositiveChange?: boolean;
  subtitle?: string;
  metrics?: GlassCardMetric[];
  onAction?: () => void;
  onSecondaryAction?: () => void;
  actionLabel?: string;
  secondaryActionLabel?: string;
  keyboardShortcut?: string;
  glow?: 'none' | 'emerald' | 'lime' | 'violet' | 'rose';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Structured pro-developer GlassmorphismCard presenting high-impact financial anchors
 * with Linear/Vercel typography, hairline telemetry, and accessible action handlers.
 */
export const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({
  title,
  tag,
  version,
  mainLabel = 'Available Balance',
  amount,
  amountDecimals,
  amountChange,
  isPositiveChange = true,
  subtitle,
  metrics,
  onAction,
  onSecondaryAction,
  actionLabel = 'Simulate Purchase',
  secondaryActionLabel = 'Configure',
  keyboardShortcut,
  glow = 'lime',
  className = '',
  children,
}) => {
  return (
    <GlassCard variant="panel" glow={glow} className={`p-6 sm:p-7 ${className}`}>
      {/* Card Header (Linear / Vercel style) */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {tag && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-brand-lime/10 text-brand-lime border border-brand-lime/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-lime animate-pulse" />
                {tag}
              </span>
            )}
            {version && <span className="text-[11px] font-mono text-slate-400">{version}</span>}
          </div>
          <h3 className="text-base font-semibold text-slate-100 tracking-tight font-sans">
            {title}
          </h3>
        </div>

        {keyboardShortcut && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-1 rounded-md border border-white/[0.06] select-none">
            <span>{keyboardShortcut}</span>
          </div>
        )}
      </div>

      {/* Main Metric Anchor */}
      <div className="py-5 space-y-1">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
          <span>{mainLabel}</span>
          {amountChange && (
            <span
              className={`font-mono font-medium text-xs flex items-center gap-0.5 ${
                isPositiveChange ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositiveChange ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {amountChange}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            {amount}
          </span>
          {amountDecimals && (
            <span className="text-2xl font-light text-slate-400">{amountDecimals}</span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Secondary Telemetry Grid */}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 py-4 border-y border-white/[0.06] font-mono text-xs">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className="bg-white/[0.025] p-2.5 rounded-xl border border-white/[0.06] space-y-1"
            >
              <span className="text-[10px] text-slate-400 block tracking-tight uppercase">
                {m.label}
              </span>
              <span className="font-bold text-slate-200 block text-sm truncate">
                {m.value}
              </span>
              {m.subtext && (
                <span
                  className={`text-[10px] block truncate ${
                    m.trend === 'up'
                      ? 'text-emerald-400'
                      : m.trend === 'down'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {m.subtext}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom slotted content */}
      {children && <div className="py-4">{children}</div>}

      {/* Action Footer */}
      {(onAction || onSecondaryAction) && (
        <div className="pt-5 flex items-center justify-between gap-3">
          {onSecondaryAction ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="px-3.5 py-2 text-xs font-mono text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>{secondaryActionLabel}</span>
            </button>
          ) : (
            <div />
          )}

          {onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-4 py-2 text-xs font-bold text-navy-950 bg-brand-lime hover:bg-brand-lime-dim rounded-xl transition-all shadow-glow-lime flex items-center gap-1.5 cursor-pointer active:scale-95 font-sans"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{actionLabel}</span>
            </button>
          )}
        </div>
      )}
    </GlassCard>
  );
};
