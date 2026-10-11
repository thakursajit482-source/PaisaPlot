import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Calendar,
  Shield,
  Clock,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Receipt,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { generateForecast, formatINR } from '../../finance/calculations';
import { BillCommitment, Subscription, ForecastScenarioOptions } from '../../types/finance';
import { BillModal } from './BillModal';
import { SubscriptionModal } from './SubscriptionModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { ForecastChart } from './ForecastChart';
import { ForecastControls } from './ForecastControls';

interface ForecastViewProps {
  onNavigateToDecisionLab: () => void;
}

type ForecastTab = 'trajectory' | 'bills' | 'subscriptions';

export const ForecastView: React.FC<ForecastViewProps> = ({ onNavigateToDecisionLab }) => {
  const {
    state,
    metrics,
    toggleBillPaid,
    deleteBill,
    toggleSubscriptionActive,
    deleteSubscription,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<ForecastTab>('trajectory');

  // Modals state
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<BillCommitment | null>(null);
  const [billToDelete, setBillToDelete] = useState<BillCommitment | null>(null);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subToEdit, setSubToEdit] = useState<Subscription | null>(null);
  const [subToDelete, setSubToDelete] = useState<Subscription | null>(null);

  const [scenarioOptions, setScenarioOptions] = useState<ForecastScenarioOptions>({});

  const forecast = useMemo(() => {
    return generateForecast(state, scenarioOptions);
  }, [state, scenarioOptions]);

  const isScenarioActive = Boolean(
    (scenarioOptions.daysWindow !== undefined && scenarioOptions.daysWindow !== 30) ||
    scenarioOptions.plannedDailyAllowance !== undefined ||
    (scenarioOptions.hypotheticalExpense && scenarioOptions.hypotheticalExpense.amount > 0)
  );

  const bills = state.bills || [];
  const subscriptions = state.subscriptions || [];

  const unpaidBillsCount = bills.filter((b) => !b.isPaid).length;
  const activeSubsCount = subscriptions.filter((s) => s.active).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Interconnected 30-Day Forecast
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Simulates dynamic cash flow by linking your bank balance, due bills, and recurring subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsBillModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-navy-850 hover:bg-navy-800 text-slate-200 border border-navy-750 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Bill</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSubModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-navy-850 hover:bg-navy-800 text-slate-200 border border-navy-750 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-lime" />
            <span>Add Subscription</span>
          </button>
        </div>
      </div>

      {/* Warning Banner if cash crunch or trough risks exist */}
      {forecast.warnings && forecast.warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-300">
              Cash Flow Bottleneck Alert ({forecast.warnings.length})
            </h4>
            {forecast.warnings.map((w, idx) => (
              <p key={idx} className="text-xs text-amber-200/90 leading-relaxed">
                {w.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current Actual Balance */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Current Balance
          </span>
          <span className="text-2xl font-bold text-slate-100 font-mono">
            {formatINR(metrics.balance)}
          </span>
          <span className="text-xs text-slate-500 block mt-1">Starting point for day 0</span>
        </div>

        {/* Metric 2: Expected Future Charges */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Future Charges ({scenarioOptions.daysWindow || 30}d)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Bills + Subs</span>
          </div>
          <span className="text-2xl font-bold text-amber-400 font-mono">
            {formatINR(forecast.totalExpectedFutureCharges || 0)}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            Bills: {formatINR(forecast.totalExpectedBills || 0)} • Subs: {formatINR(forecast.totalExpectedSubscriptions || 0)}
          </span>
        </div>

        {/* Metric 3: Lowest Projected Trough Balance */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Lowest Projected Balance
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Day {forecast.lowestBalanceDay ?? 0}
            </span>
          </div>
          <span
            className={`text-2xl font-bold font-mono ${
              (forecast.lowestProjectedBalance ?? 0) < 0
                ? 'text-rose-400'
                : (forecast.lowestProjectedBalance ?? 0) < 2000
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {formatINR(forecast.lowestProjectedBalance ?? 0)}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            {(forecast.lowestProjectedBalance ?? 0) >= 2000 ? 'Comfortably above savings cushion' : 'Tight trough margin'}
          </span>
        </div>

        {/* Metric 4: Estimated End Balance */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Estimated Day {scenarioOptions.daysWindow || 30} Balance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-lime font-mono">
              {formatINR(forecast.baselineEndBalance)}
            </span>
            {isScenarioActive && forecast.simulatedEndBalance !== undefined && (
              <span className="text-xs font-mono text-purple-300 font-semibold">
                (Sim: {formatINR(forecast.simulatedEndBalance)})
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 block mt-1">
            Pacing {formatINR(forecast.assumptions.dailyBurnSimulated ?? forecast.assumptions.dailyBurnBaseline, { decimals: 0 })}/day discretionary
          </span>
        </div>
      </div>

      {/* Forecast Navigation Tabs */}
      <div className="flex border-b border-navy-800 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('trajectory')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'trajectory'
              ? 'border-brand-lime text-brand-lime'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>30-Day Milestone Trajectory</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bills')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'bills'
              ? 'border-brand-lime text-brand-lime'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Bills & Commitments ({unpaidBillsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'subscriptions'
              ? 'border-brand-lime text-brand-lime'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Subscriptions ({activeSubsCount})</span>
        </button>
      </div>

      {/* TAB 1: Milestone Trajectory */}
      {activeTab === 'trajectory' && (
        <div className="space-y-6">
          {/* Interactive Scenario Controls */}
          <ForecastControls
            options={scenarioOptions}
            baselineAllowance={metrics.dailyAllowance}
            daysRemaining={state.daysRemaining}
            onChange={setScenarioOptions}
            onReset={() => setScenarioOptions({})}
          />

          {/* Interactive Recharts Cash Flow Chart */}
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 shadow-card-dark space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-brand-lime" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Interactive Cash Flow Trajectory
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {scenarioOptions.daysWindow || 30}-Day Projection Horizon
              </span>
            </div>
            <ForecastChart forecast={forecast} isScenarioActive={isScenarioActive} />
          </div>

          {/* Detailed Milestone Progression Table */}
          <div className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden shadow-card-dark">
            <div className="px-6 py-4 border-b border-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-lime" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Daily Milestone Ledger & Outflows
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Pacing: {formatINR(forecast.assumptions.dailyBurnSimulated ?? forecast.assumptions.dailyBurnBaseline, { decimals: 0 })}/day
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-navy-800">
                  <tr>
                    <th className="py-3 px-6">Timeline</th>
                    <th className="py-3 px-6">Baseline Balance</th>
                    {isScenarioActive && <th className="py-3 px-6 text-purple-300">Simulated Balance</th>}
                    <th className="py-3 px-6">Due Obligations</th>
                    <th className="py-3 px-6">Spendable Cash (Post-Bills)</th>
                    <th className="py-3 px-6">Status / Buffer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/60 font-mono">
                  {forecast.days.map((pt) => {
                    const hasObligations = pt.obligations && pt.obligations.length > 0;
                    return (
                      <tr
                        key={pt.day}
                        className={`hover:bg-navy-850/40 transition-colors ${
                          pt.isWarning ? 'bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-6 font-sans font-semibold text-slate-300">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{pt.label}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({pt.formattedDate || pt.date})
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-6 text-slate-100 font-bold">
                          {formatINR(pt.baselineBalance)}
                        </td>

                        {isScenarioActive && (
                          <td className="py-3.5 px-6 text-purple-300 font-bold">
                            {pt.simulatedBalance !== undefined ? formatINR(pt.simulatedBalance) : '—'}
                          </td>
                        )}

                        <td className="py-3.5 px-6 font-sans">
                          {hasObligations ? (
                            <div className="space-y-1">
                              {pt.obligations?.map((ob, idx) => (
                                <div
                                  key={idx}
                                  className={`text-[11px] inline-flex items-center gap-1.5 px-2 py-0.5 rounded border mr-1 mb-1 ${
                                    ob.type === 'bill'
                                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                      : 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                                  }`}
                                >
                                  <span>{ob.name}:</span>
                                  <span className="font-mono font-bold">−{formatINR(ob.amount)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px] font-mono">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-6 text-emerald-400 font-semibold">
                          {formatINR(pt.baselineSpendable)}
                        </td>

                        <td className="py-3.5 px-6 font-sans">
                          {pt.isWarning ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              Tight Margin
                            </span>
                          ) : pt.baselineBalance >= pt.savingsFloor ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-500/20">
                              <Shield className="w-3 h-3" />
                              Safe (Target Protected)
                            </span>
                          ) : pt.baselineBalance >= pt.commitmentFloor ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-500/20">
                              Savings Target Floor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-[11px] font-semibold border border-rose-500/20">
                              Deficit
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Bills & Commitments Management */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-card-dark">
            <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Scheduled Bill Commitments</h3>
                <p className="text-xs text-slate-400">
                  Bills reduce spendable cash while unpaid. Marking as paid records an expense without double-deduction.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBillToEdit(null);
                  setIsBillModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-navy-950 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Bill</span>
              </button>
            </div>

            {bills.length === 0 ? (
              <div className="text-center py-10 bg-navy-950/40 rounded-xl border border-navy-800">
                <Receipt className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No Bill Commitments Found</p>
                <p className="text-xs text-slate-500 mt-1">Add upcoming rent or utility bills to protect cash.</p>
              </div>
            ) : (
              <div className="divide-y divide-navy-800/80">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-navy-850/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleBillPaid(bill.id)}
                        title={bill.isPaid ? 'Reopen as unpaid' : 'Mark as paid'}
                        className={`p-2 rounded-xl border mt-0.5 transition-all cursor-pointer ${
                          bill.isPaid
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-navy-850 text-slate-500 border-navy-750 hover:border-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-bold ${bill.isPaid ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {bill.title}
                          </h4>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                              bill.isPaid
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {bill.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>Due: <strong className="text-slate-300 font-mono">{bill.dueDate}</strong></span>
                          <span>•</span>
                          <span>Category: <strong className="text-slate-300">{bill.category || 'Bills'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-base font-extrabold font-mono text-slate-100">
                          {formatINR(bill.amount)}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {bill.isPaid ? 'Reconciled in expenses' : 'Locked from spendable'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setBillToEdit(bill);
                            setIsBillModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-navy-850 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillToDelete(bill)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-navy-850 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Subscriptions Management */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-card-dark">
            <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Recurring Subscriptions</h3>
                <p className="text-xs text-slate-400">
                  Model recurring weekly or monthly charges without prematurely deducting them from actual balance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubToEdit(null);
                  setIsSubModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-lime hover:bg-brand-lime-dim text-navy-950 transition-all shadow-glow-lime flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Subscription</span>
              </button>
            </div>

            {subscriptions.length === 0 ? (
              <div className="text-center py-10 bg-navy-950/40 rounded-xl border border-navy-800">
                <RefreshCw className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No Subscriptions Tracked</p>
                <p className="text-xs text-slate-500 mt-1">Add Netflix, gym, or software subscriptions.</p>
              </div>
            ) : (
              <div className="divide-y divide-navy-800/80">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-navy-850/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSubscriptionActive(sub.id)}
                        title={sub.active ? 'Pause subscription' : 'Activate subscription'}
                        className="text-brand-lime hover:text-brand-lime-dim transition-colors mt-0.5 cursor-pointer"
                      >
                        {sub.active ? (
                          <ToggleRight className="w-6 h-6 text-brand-lime" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-600" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-bold ${sub.active ? 'text-slate-100' : 'text-slate-500'}`}>
                            {sub.name}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              sub.active
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {sub.active ? 'Active' : 'Paused'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>Next Billing: <strong className="text-slate-300 font-mono">{sub.nextBillingDate}</strong></span>
                          <span>•</span>
                          <span className="capitalize">{sub.frequency} Cycle</span>
                          {sub.notes && (
                            <>
                              <span>•</span>
                              <span className="italic text-slate-500">{sub.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-base font-extrabold font-mono text-slate-100">
                          {formatINR(sub.amount)}
                          <span className="text-xs text-slate-400 font-sans font-normal ml-1">/{sub.frequency === 'weekly' ? 'wk' : 'mo'}</span>
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {sub.active ? 'Factored in forecast' : 'Excluded from forecast'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSubToEdit(sub);
                            setIsSubModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-navy-850 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubToDelete(sub)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-navy-850 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assumptions & Limitations Disclosure */}
      <div className="bg-navy-900/40 border border-navy-800/80 rounded-2xl p-6 text-xs text-slate-400 space-y-2.5">
        <div className="flex items-center gap-2 text-brand-lime font-bold text-sm">
          <Clock className="w-4 h-4" />
          <span>Forecast Assumptions & Mathematical Model</span>
        </div>
        <p className="leading-relaxed">
          PaisaPilot projections are deterministic financial models based on currently scheduled data, not guaranteed forecasts:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-400">
          <li>Unpaid bills are scheduled to deduct cash on their specific calendar due dates.</li>
          <li>Active subscriptions recur on their configured weekly or monthly billing dates.</li>
          <li>Free discretionary spending is paced evenly according to your calculated daily allowance of <strong className="text-slate-300 font-mono">{formatINR(forecast.assumptions.dailyBurnBaseline, { decimals: 2 })}/day</strong>.</li>
          <li>Future commitments are never deducted from your current bank balance before they occur.</li>
        </ul>
        <div className="pt-2">
          <button
            type="button"
            onClick={onNavigateToDecisionLab}
            className="px-4 py-2 bg-navy-800 hover:bg-navy-750 text-slate-200 rounded-xl font-medium transition-colors border border-navy-700 flex items-center gap-1.5"
          >
            <span>Simulate purchase impact on this forecast</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <BillModal
        isOpen={isBillModalOpen}
        onClose={() => {
          setIsBillModalOpen(false);
          setBillToEdit(null);
        }}
        billToEdit={billToEdit}
      />

      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => {
          setIsSubModalOpen(false);
          setSubToEdit(null);
        }}
        subscriptionToEdit={subToEdit}
      />

      <DeleteConfirmModal
        isOpen={billToDelete !== null}
        onClose={() => setBillToDelete(null)}
        onConfirm={() => {
          if (billToDelete) deleteBill(billToDelete.id);
        }}
        title="Delete Bill Commitment?"
        message={`Are you sure you want to delete "${billToDelete?.title}" (${formatINR(billToDelete?.amount || 0)})?`}
        confirmLabel="Yes, Delete Bill"
      />

      <DeleteConfirmModal
        isOpen={subToDelete !== null}
        onClose={() => setSubToDelete(null)}
        onConfirm={() => {
          if (subToDelete) deleteSubscription(subToDelete.id);
        }}
        title="Delete Subscription?"
        message={`Are you sure you want to delete "${subToDelete?.name}" (${formatINR(subToDelete?.amount || 0)})?`}
        confirmLabel="Yes, Delete Subscription"
      />
    </div>
  );
};
