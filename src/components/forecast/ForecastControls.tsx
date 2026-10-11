import React, { useState } from 'react';
import { Sliders, RotateCcw, Sparkles, Plus, X } from 'lucide-react';
import { ForecastScenarioOptions } from '../../types/finance';
import { formatINR } from '../../finance/calculations';

interface ForecastControlsProps {
  options: ForecastScenarioOptions;
  baselineAllowance: number;
  daysRemaining: number;
  onChange: (options: ForecastScenarioOptions) => void;
  onReset: () => void;
}

export const ForecastControls: React.FC<ForecastControlsProps> = ({
  options,
  baselineAllowance,
  daysRemaining,
  onChange,
  onReset,
}) => {
  const currentWindow = options.daysWindow || 30;
  const currentAllowance =
    options.plannedDailyAllowance !== undefined
      ? options.plannedDailyAllowance
      : baselineAllowance;

  const [isExpenseOpen, setIsExpenseOpen] = useState(
    Boolean(options.hypotheticalExpense && options.hypotheticalExpense.amount > 0)
  );

  const [expenseTitle, setExpenseTitle] = useState(
    options.hypotheticalExpense?.title || ''
  );
  const [expenseAmount, setExpenseAmount] = useState(
    options.hypotheticalExpense?.amount ? options.hypotheticalExpense.amount.toString() : ''
  );
  const [expenseDay, setExpenseDay] = useState(
    options.hypotheticalExpense?.day ? options.hypotheticalExpense.day.toString() : '5'
  );

  const isScenarioActive =
    options.daysWindow !== undefined && options.daysWindow !== 30 ||
    options.plannedDailyAllowance !== undefined ||
    (options.hypotheticalExpense && options.hypotheticalExpense.amount > 0);

  const handleWindowChange = (win: 7 | 14 | 30) => {
    onChange({
      ...options,
      daysWindow: win,
    });
  };

  const handleAllowanceChange = (val: number) => {
    onChange({
      ...options,
      plannedDailyAllowance: Math.max(0, val),
    });
  };

  const handleApplyHypotheticalExpense = (amountNum: number, titleStr: string, dayNum: number) => {
    if (amountNum > 0) {
      onChange({
        ...options,
        hypotheticalExpense: {
          amount: amountNum,
          title: titleStr.trim() || 'Hypothetical Purchase',
          day: Math.max(1, Math.min(dayNum, currentWindow)),
        },
      });
    } else {
      const next = { ...options };
      delete next.hypotheticalExpense;
      onChange(next);
    }
  };

  const handleRemoveHypotheticalExpense = () => {
    setIsExpenseOpen(false);
    setExpenseTitle('');
    setExpenseAmount('');
    const next = { ...options };
    delete next.hypotheticalExpense;
    onChange(next);
  };

  return (
    <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-4 sm:p-5 shadow-card-dark space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-navy-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Scenario Controls & Horizon Tuning
              {isScenarioActive && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Scenario Active
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Adjust projection timeframe and test discretionary burn rates without altering confirmed accounts.
            </p>
          </div>
        </div>

        {isScenarioActive && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-slate-100 bg-navy-800 hover:bg-navy-750 border border-navy-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Scenario</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Horizon Toggle */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Forecast Horizon
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-navy-950 p-1 rounded-xl border border-navy-800">
            {([7, 14, 30] as const).map((win) => (
              <button
                key={win}
                type="button"
                onClick={() => handleWindowChange(win)}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  currentWindow === win
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {win} Days
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Window limited to max {Math.min(currentWindow, daysRemaining)} remaining active days.
          </span>
        </div>

        {/* Planned Discretionary Burn Rate */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Planned Daily Burn
            </label>
            <span className="text-xs font-mono font-bold text-brand-lime">
              {formatINR(currentAllowance, { decimals: 0 })}/day
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={currentAllowance}
              onChange={(e) => handleAllowanceChange(Number(e.target.value))}
              className="w-full accent-brand-lime bg-navy-950 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>₹0/day</span>
              <button
                type="button"
                onClick={() => {
                  const next = { ...options };
                  delete next.plannedDailyAllowance;
                  onChange(next);
                }}
                className="text-slate-400 hover:text-brand-lime transition-colors underline cursor-pointer"
              >
                Reset to Baseline ({formatINR(baselineAllowance, { decimals: 0 })})
              </button>
              <span>₹500/day</span>
            </div>
          </div>
        </div>

        {/* Hypothetical One-time Expense */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Hypothetical Outflow
            </label>
            {!isExpenseOpen ? (
              <button
                type="button"
                onClick={() => setIsExpenseOpen(true)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Simulate One-off</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRemoveHypotheticalExpense}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {isExpenseOpen ? (
            <div className="p-2.5 rounded-xl bg-navy-950 border border-purple-500/30 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    placeholder="Expense title"
                    value={expenseTitle}
                    onChange={(e) => {
                      setExpenseTitle(e.target.value);
                      const amt = parseFloat(expenseAmount);
                      if (!isNaN(amt) && amt > 0) {
                        handleApplyHypotheticalExpense(amt, e.target.value, parseInt(expenseDay) || 5);
                      }
                    }}
                    className="w-full px-2 py-1 bg-navy-900 border border-navy-750 rounded text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    value={expenseAmount}
                    onChange={(e) => {
                      setExpenseAmount(e.target.value);
                      const amt = parseFloat(e.target.value);
                      if (!isNaN(amt) && amt > 0) {
                        handleApplyHypotheticalExpense(amt, expenseTitle, parseInt(expenseDay) || 5);
                      } else {
                        handleApplyHypotheticalExpense(0, expenseTitle, parseInt(expenseDay) || 5);
                      }
                    }}
                    className="w-full px-2 py-1 bg-navy-900 border border-navy-750 rounded text-slate-200 placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Charge falls on:</span>
                <select
                  value={expenseDay}
                  onChange={(e) => {
                    setExpenseDay(e.target.value);
                    const amt = parseFloat(expenseAmount);
                    if (!isNaN(amt) && amt > 0) {
                      handleApplyHypotheticalExpense(amt, expenseTitle, parseInt(e.target.value) || 5);
                    }
                  }}
                  className="bg-navy-900 border border-navy-750 rounded px-2 py-0.5 text-slate-200 text-xs focus:outline-none"
                >
                  {Array.from({ length: currentWindow }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Day {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="h-14 flex items-center justify-center border border-dashed border-navy-800 rounded-xl text-xs text-slate-500 bg-navy-950/40">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                No hypothetical purchase simulated
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
