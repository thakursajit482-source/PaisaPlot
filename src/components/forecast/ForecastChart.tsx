import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ForecastDayPoint, ForecastProjection } from '../../types/finance';
import { formatINR } from '../../finance/calculations';
import { AlertCircle, Calendar, Shield, RefreshCw } from 'lucide-react';

interface ForecastChartProps {
  forecast: ForecastProjection;
  isScenarioActive?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: ForecastDayPoint;
  }>;
  label?: string | number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const dataPoint: ForecastDayPoint = payload[0].payload;
  const hasObligations = dataPoint.obligations && dataPoint.obligations.length > 0;

  return (
    <div className="bg-navy-950/95 border border-navy-750 backdrop-blur-md p-3.5 rounded-xl shadow-2xl text-xs space-y-2 max-w-xs z-50">
      <div className="flex items-center justify-between border-b border-navy-800 pb-2">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <Calendar className="w-3.5 h-3.5 text-brand-lime" />
          <span>{dataPoint.formattedDate || `Day ${dataPoint.day}`}</span>
          <span className="text-[10px] text-slate-500 font-mono">({dataPoint.label})</span>
        </div>
        {dataPoint.isWarning && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-2.5 h-2.5" />
            Alert
          </span>
        )}
      </div>

      <div className="space-y-1.5 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Baseline Balance:</span>
          <span className="font-bold text-brand-lime">{formatINR(dataPoint.baselineBalance)}</span>
        </div>

        {dataPoint.simulatedBalance !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-purple-300">Simulated Scenario:</span>
            <span className="font-bold text-purple-400">{formatINR(dataPoint.simulatedBalance)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-400">
          <span>Spendable (Post-Bills):</span>
          <span className={dataPoint.baselineSpendable < 0 ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
            {formatINR(dataPoint.baselineSpendable)}
          </span>
        </div>

        {(dataPoint.scheduledCharges ?? 0) > 0 && (
          <div className="flex items-center justify-between pt-1 border-t border-navy-800/80">
            <span className="text-amber-400">Due Charges:</span>
            <span className="font-bold text-amber-300">{formatINR(dataPoint.scheduledCharges ?? 0)}</span>
          </div>
        )}
      </div>

      {hasObligations && (
        <div className="pt-2 border-t border-navy-800/80 space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
            Scheduled on this day:
          </span>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {dataPoint.obligations?.map((ob, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] bg-navy-900/80 px-2 py-1 rounded">
                <span className="flex items-center gap-1 text-slate-300 truncate max-w-[140px]">
                  {ob.type === 'bill' ? (
                    <Shield className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  ) : (
                    <RefreshCw className="w-2.5 h-2.5 text-brand-lime shrink-0" />
                  )}
                  <span className="truncate">{ob.name}</span>
                </span>
                <span className="font-mono text-slate-200 shrink-0">{formatINR(ob.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dataPoint.warningMessage && (
        <div className="pt-1 text-[11px] text-amber-300 leading-snug bg-amber-950/40 p-1.5 rounded border border-amber-500/30">
          {dataPoint.warningMessage}
        </div>
      )}
    </div>
  );
};

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecast, isScenarioActive }) => {
  const data = forecast.days;
  const lowestBal = forecast.lowestProjectedBalance ?? 0;
  const lowestDay = forecast.lowestBalanceDay ?? 0;

  // Compute nice Y domain boundaries
  const maxBalance = Math.max(
    ...data.map((d) => Math.max(d.baselineBalance, d.simulatedBalance ?? 0)),
    1000
  );
  const minBalance = Math.min(
    ...data.map((d) => Math.min(d.baselineBalance, d.simulatedBalance ?? 0)),
    0
  );

  const yDomainMax = Math.ceil((maxBalance * 1.08) / 1000) * 1000;
  const yDomainMin = minBalance < 0 ? Math.floor(minBalance / 1000) * 1000 : 0;

  return (
    <div className="w-full space-y-3">
      {/* Chart Legend / Summary Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs px-2">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-lime/80 shadow-[0_0_8px_rgba(163,230,53,0.5)]" />
            <span className="text-slate-300 font-medium">Baseline Cash Trajectory</span>
          </div>

          {isScenarioActive && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-purple-400" />
              <span className="text-purple-300 font-medium">Hypothetical Simulation</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t-2 border-dotted border-amber-400" />
            <span className="text-amber-300 font-medium">
              Lowest Trough: {formatINR(lowestBal)} (Day {lowestDay})
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Hover points to inspect scheduled charges & spendable cash
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-72 sm:h-80 min-h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
          <AreaChart
            data={data}
            margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
          >
            <defs>
              <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ccff00" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ccff00" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="simulatedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#172030" vertical={false} />

            <XAxis
              dataKey="day"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(day) => `Day ${day}`}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={[yDomainMin, yDomainMax]}
              tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
              width={70}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Reference Line for Lowest Trough */}
            {lowestBal >= 0 && (
              <ReferenceLine
                y={lowestBal}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Trough ₹${lowestBal.toLocaleString('en-IN')}`,
                  position: 'insideBottomRight',
                  fill: '#fbbf24',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}

            {/* Reference Line for Zero (if deficit occurs) */}
            {yDomainMin < 0 && (
              <ReferenceLine
                y={0}
                stroke="#f43f5e"
                strokeWidth={1.5}
                label={{
                  value: 'Zero Runway',
                  position: 'insideTopLeft',
                  fill: '#f43f5e',
                  fontSize: 10,
                }}
              />
            )}

            {/* Baseline Cash Area */}
            <Area
              type="monotone"
              dataKey="baselineBalance"
              name="Baseline Balance"
              stroke="#ccff00"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#baselineGradient)"
              activeDot={{ r: 5, fill: '#ccff00', stroke: '#07090e', strokeWidth: 2 }}
            />

            {/* Simulated Line if Scenario Active */}
            {isScenarioActive && (
              <Line
                type="monotone"
                dataKey="simulatedBalance"
                name="Simulated Balance"
                stroke="#a78bfa"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 5, fill: '#a78bfa', stroke: '#07090e', strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
