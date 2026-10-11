import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Navbar, NavTab } from './components/layout/Navbar';
import { OverviewView } from './components/overview/OverviewView';
import { DecisionLab } from './components/decision/DecisionLab';
import { TransactionsView } from './components/transactions/TransactionsView';
import { GoalsView } from './components/goals/GoalsView';
import { ForecastView } from './components/forecast/ForecastView';
import { Compass, ShieldCheck } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-brand-lime selection:text-navy-950">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
};

export default App;
