import React, { useState } from 'react';
import {
  Compass,
  LayoutDashboard,
  Sparkles,
  Receipt,
  Target,
  TrendingDown,
  RotateCcw,
  Menu,
  X,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ResetModal } from '../common/ResetModal';

export type NavTab = 'overview' | 'decision-lab' | 'transactions' | 'goals' | 'forecast';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { state, metrics, resetDemo, notification, clearNotification } = useFinance();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string | number; highlight?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'decision-lab', label: 'Decision Lab', icon: Sparkles, highlight: true },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: Receipt,
      badge: state.transactions.length > 0 ? state.transactions.length : undefined,
    },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'forecast', label: 'Forecast', icon: TrendingDown },
  ];

  const handleNavClick = (tab: NavTab) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-navy-950/85 backdrop-blur-md border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-lime to-emerald-400 p-0.5 shadow-glow-lime flex items-center justify-center">
                <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center text-brand-lime">
                  <Compass className="w-5 h-5" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight text-slate-100 font-sans">
                    Paisa<span className="text-brand-lime">Pilot</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-brand-violet/20 text-brand-violet-light border border-brand-violet/30 rounded">
                    Fintech Lab
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 tracking-wide hidden sm:block">
                  30-Day Decision Simulator
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-navy-900/90 p-1 rounded-xl border border-navy-800">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? item.highlight
                          ? 'bg-brand-lime text-navy-950 shadow-glow-lime font-bold'
                          : 'bg-navy-800 text-slate-100 shadow-sm'
                        : item.highlight
                        ? 'text-brand-lime hover:bg-brand-lime/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-navy-850'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isActive
                            ? 'bg-navy-950 text-slate-100'
                            : 'bg-navy-750 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Live Stats Pill & Reset Control */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-3 bg-navy-900/60 px-3 py-1.5 rounded-xl border border-navy-800 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Spendable:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ₹{metrics.spendableAfterCommitments.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-px h-3 bg-navy-750" />
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Daily:</span>
                  <span className="font-mono font-bold text-brand-lime">
                    ₹{metrics.dailyAllowance.toFixed(0)}/d
                  </span>
                </div>
              </div>

              {/* Reset Demo Button */}
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                title="Reset to initial ₹10,000 / 30-day demo state"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-navy-900 hover:bg-navy-850 border border-navy-800 hover:border-navy-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Demo</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="md:hidden p-2 text-slate-400 hover:text-slate-200 bg-navy-900 rounded-xl border border-navy-800"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-navy-900 border-b border-navy-800 px-4 pt-2 pb-4 space-y-1 animate-fade-in">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? item.highlight
                        ? 'bg-brand-lime text-navy-950 font-bold'
                        : 'bg-navy-800 text-slate-100'
                      : 'text-slate-400 hover:bg-navy-850'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-navy-950 text-slate-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Toast / Notification Bar */}
        {notification && (
          <div className="bg-brand-lime/10 border-b border-brand-lime/30 px-4 py-2 text-xs text-brand-lime flex items-center justify-between">
            <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
              <Check className="w-4 h-4 shrink-0 text-brand-lime" />
              <span>{notification}</span>
            </div>
            <button
              onClick={clearNotification}
              className="text-brand-lime/70 hover:text-brand-lime p-1"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* Reset Confirmation Dialog */}
      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={resetDemo}
      />
    </>
  );
};
