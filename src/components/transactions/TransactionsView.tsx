import React, { useState, useMemo } from 'react';
import {
  Receipt,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Calendar,
  Search,
  Filter,
  X,
  Sparkles,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatINR, filterTransactions, getUniqueCategories } from '../../finance/calculations';
import { AddIncomeModal } from '../common/AddIncomeModal';
import { UnexpectedExpenseModal } from '../common/UnexpectedExpenseModal';
import { GlassCard } from '../common/GlassmorphismCard';

interface TransactionsViewProps {
  onNavigateToDecisionLab: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onNavigateToDecisionLab }) => {
  const { state, metrics } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isUnexpectedExpenseOpen, setIsUnexpectedExpenseOpen] = useState(false);

  // Extract unique categories across all recorded transactions
  const uniqueCategories = useMemo(() => {
    return getUniqueCategories(state.transactions);
  }, [state.transactions]);

  // Pure filtering combining search, type, and category
  const filteredTransactions = useMemo(() => {
    return filterTransactions(state.transactions, {
      searchQuery,
      typeFilter,
      categoryFilter,
    });
  }, [state.transactions, searchQuery, typeFilter, categoryFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'all' || categoryFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
  };

  const netFlow = metrics.totalIncome - metrics.totalExpenses;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete record of verified expenses from the Decision Lab and manual income inflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsAddIncomeOpen(true)}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Add Income</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUnexpectedExpenseOpen(true)}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Zap className="w-4 h-4 text-rose-400" />
            <span>Unexpected Expense</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToDecisionLab}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-brand-lime hover:bg-brand-lime-dim text-navy-950 transition-all shadow-glow-lime flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Simulate Purchase</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <GlassCard variant="panel" className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Inflows
            </span>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono">
              +Income
            </span>
          </div>
          <span className="text-2xl font-bold text-emerald-400 font-mono">
            {formatINR(metrics.totalIncome, { includeSign: true })}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            {state.transactions.filter((t) => t.type === 'income').length} income records
          </span>
        </GlassCard>

        {/* Total Outflow */}
        <GlassCard variant="panel" className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Outflows
            </span>
            <span className="p-1 rounded bg-rose-500/10 text-rose-400 text-xs font-mono">
              −Expenses
            </span>
          </div>
          <span className="text-2xl font-bold text-rose-400 font-mono">
            {metrics.totalExpenses > 0 ? `−${formatINR(metrics.totalExpenses)}` : '₹0'}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            {state.transactions.filter((t) => t.type === 'expense').length} verified purchases
          </span>
        </GlassCard>

        {/* Net Cash Flow */}
        <GlassCard variant="panel" className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Net Flow
            </span>
            <span className="text-xs text-slate-400 font-mono">In − Out</span>
          </div>
          <span
            className={`text-2xl font-bold font-mono ${
              netFlow > 0 ? 'text-emerald-400' : netFlow < 0 ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {formatINR(netFlow, { includeSign: true })}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            {netFlow >= 0 ? 'Positive or neutral drift' : 'Net expenditure outflow'}
          </span>
        </GlassCard>

        {/* Live Remaining Balance */}
        <GlassCard variant="panel" className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Remaining Balance
            </span>
            <span className="p-1 rounded bg-white/[0.04] text-brand-lime text-xs font-mono">
              Live
            </span>
          </div>
          <span className="text-2xl font-bold text-brand-lime font-mono">
            {formatINR(metrics.balance)}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            Starting: {formatINR(state.startingBudget)}
          </span>
        </GlassCard>
      </div>

      {/* Search and Filters Toolbar */}
      <GlassCard variant="panel" className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or category..."
              className="w-full pl-9 pr-9 py-2 bg-[#07090e]/80 border border-white/[0.08] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search text"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter Pills */}
            <div className="flex items-center p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl">
              {(['all', 'income', 'expense'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    typeFilter === t
                      ? 'bg-white/[0.1] text-slate-100 shadow-sm border border-white/[0.12] font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {t === 'all' ? 'All Types' : t}
                </button>
              ))}
            </div>

            {/* Category Filter Dropdown */}
            {uniqueCategories.length > 0 && (
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-[#07090e]/80 border border-white/[0.08] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all cursor-pointer"
                >
                  <option value="all">All Categories ({uniqueCategories.length})</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Indicators */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-navy-800/80 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Filter className="w-3 h-3" />
              Active Filters:
            </span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy-850 border border-navy-750 text-slate-300 text-[11px]">
                Search: "{searchQuery}"
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-200 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy-850 border border-navy-750 text-slate-300 text-[11px] capitalize">
                Type: {typeFilter}
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className="text-slate-400 hover:text-slate-200 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {categoryFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy-850 border border-navy-750 text-slate-300 text-[11px]">
                Category: {categoryFilter}
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className="text-slate-400 hover:text-slate-200 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <span className="text-[11px] text-slate-400 ml-auto">
              Showing {filteredTransactions.length} of {state.transactions.length}
            </span>
          </div>
        )}
      </GlassCard>

      {/* Main Ledger Content */}
      {state.transactions.length === 0 ? (
        /* Empty State (No recorded transactions) */
        <GlassCard variant="subtle" className="p-12 text-center max-w-xl mx-auto space-y-4 my-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-navy-850 border border-navy-750 flex items-center justify-center text-slate-400">
            <Receipt className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">No Transactions Recorded Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              PaisaPilot is completely non-destructive until you review and confirm a purchase in the Decision Lab or record an income inflow.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddIncomeOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Record Inflow
            </button>
            <button
              type="button"
              onClick={onNavigateToDecisionLab}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-brand-lime text-navy-950 hover:bg-brand-lime-dim transition-all shadow-glow-lime cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Simulate Purchase
            </button>
          </div>
        </GlassCard>
      ) : filteredTransactions.length === 0 ? (
        /* No-Results State (Filters matched 0 items) */
        <GlassCard variant="subtle" className="p-12 text-center max-w-xl mx-auto space-y-4 my-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-navy-850 border border-navy-750 flex items-center justify-center text-amber-400">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">No Matching Transactions</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              No transactions matched your current search and filter criteria. Try adjusting or clearing your filters.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-navy-800 hover:bg-navy-750 border border-navy-700 text-slate-200 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All Filters
          </button>
        </GlassCard>
      ) : (
        /* Transaction Ledger List */
        <GlassCard variant="panel" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Recorded Activity ({filteredTransactions.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Sorted Newest First</span>
          </div>

          <div className="divide-y divide-white/[0.08]">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                      tx.type === 'expense'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {tx.type === 'expense' ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{tx.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08] text-[11px]">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {tx.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {tx.notes && (
                      <p className="text-xs text-slate-400 mt-1.5 italic">"{tx.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="text-right sm:self-center">
                  <span
                    className={`text-base font-extrabold font-mono ${
                      tx.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {tx.type === 'expense' ? '−' : '+'}{formatINR(tx.amount)}
                  </span>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                    {tx.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

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
    </div>
  );
};
