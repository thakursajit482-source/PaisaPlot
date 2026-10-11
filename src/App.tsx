import React, { useState, Suspense, lazy } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Navbar, NavTab } from './components/layout/Navbar';
import { OverviewView } from './components/overview/OverviewView';
import { Compass, ShieldCheck } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy-loaded secondary views for code splitting and optimal bundle pacing
const DecisionLab = lazy(() =>
  import('./components/decision/DecisionLab').then((m) => ({ default: m.DecisionLab }))
);
const TransactionsView = lazy(() =>
  import('./components/transactions/TransactionsView').then((m) => ({ default: m.TransactionsView }))
);
const GoalsView = lazy(() =>
  import('./components/goals/GoalsView').then((m) => ({ default: m.GoalsView }))
);
const ForecastView = lazy(() =>
  import('./components/forecast/ForecastView').then((m) => ({ default: m.ForecastView }))
);

const ViewLoadingFallback: React.FC = () => (
  <div
    className="w-full py-20 flex flex-col items-center justify-center space-y-4 animate-fade-in"
    role="status"
    aria-live="polite"
    aria-label="Loading view"
  >
    <div className="w-12 h-12 rounded-2xl bg-navy-900 border border-navy-750 flex items-center justify-center shadow-card-dark">
      <Compass className="w-6 h-6 text-brand-lime animate-spin" />
    </div>
    <div className="space-y-2 text-center">
      <p className="text-sm font-semibold text-slate-300">Loading Module...</p>
      <p className="text-xs text-slate-500">Preparing deterministic financial simulator</p>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-brand-lime selection:text-navy-950 relative overflow-x-hidden">
      {/* Ambient background light gradients for frosted glass refraction */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-brand-violet/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-96 h-96 bg-brand-lime/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 right-12 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <Suspense fallback={<ViewLoadingFallback />}>
          {activeTab === 'overview' && (
            <OverviewView
              onNavigateToDecisionLab={() => setActiveTab('decision-lab')}
              onNavigateToTransactions={() => setActiveTab('transactions')}
              onNavigateToGoals={() => setActiveTab('goals')}
              onNavigateToForecast={() => setActiveTab('forecast')}
            />
          )}
          {activeTab === 'decision-lab' && <DecisionLab />}
          {activeTab === 'transactions' && (
            <TransactionsView onNavigateToDecisionLab={() => setActiveTab('decision-lab')} />
          )}
          {activeTab === 'goals' && (
            <GoalsView onNavigateToDecisionLab={() => setActiveTab('decision-lab')} />
          )}
          {activeTab === 'forecast' && (
            <ForecastView onNavigateToDecisionLab={() => setActiveTab('decision-lab')} />
          )}
        </Suspense>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-navy-900 bg-navy-950/60 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-brand-lime" />
            <span className="font-semibold text-slate-300">PaisaPilot</span>
            <span>—</span>
            <span>30-Day Decision Simulator for ₹10,000 Budget Sandbox</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Client-Side Private
            </span>
            <span>•</span>
            <span>React + Vite + Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </ErrorBoundary>
  );
};

export default App;
