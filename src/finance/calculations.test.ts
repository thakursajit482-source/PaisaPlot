import { describe, it, expect } from 'vitest';
import {
  calculateBalance,
  calculateSpendableAfterCommitments,
  calculateRemainingSavingsTarget,
  calculateDailyAllowance,
  calculateSavingsProgress,
  calculateRiskLevel,
  calculateHealthScore,
  calculateHealthScoreBreakdown,
  calculateFinancialMetrics,
  simulatePurchase,
  filterTransactions,
  getUniqueCategories,
  formatINR,
  calculateGoalProgress,
  calculateGoalsTotals,
  calculateTotalUnpaidBills,
  calculateSubscriptionOccurrencesInWindow,
  calculate30DaySubscriptionCost,
  generateForecast,
  isSubscriptionPaidForDate,
} from './calculations';
import {
  FinancialState,
  Transaction,
  SavingsGoal,
  Subscription,
  BillCommitment,
} from '../types/finance';
import {
  isValidSavingsGoal,
  isValidBillCommitment,
  isValidSubscription,
  migrateFinancialState,
} from './storage';

describe('Financial Calculations Core Rules', () => {
  const initialTransactions: Transaction[] = [];

  const defaultDemoState: FinancialState = {
    startingBudget: 10000,
    daysRemaining: 30,
    unpaidCommitments: 3000,
    savingsGoal: 2000,
    alreadySaved: 0,
    transactions: initialTransactions,
    goals: [],
    bills: [],
    subscriptions: [],
  };

  it('calculates initial seeded demo balance correctly (₹10,000)', () => {
    const res = calculateBalance(10000, []);
    expect(res.balance).toBe(10000);
    expect(res.totalIncome).toBe(0);
    expect(res.totalExpenses).toBe(0);
  });

  it('updates balance accurately when income and expenses are recorded', () => {
    const txs: Transaction[] = [
      { id: '1', title: 'Salary Bonus', category: 'Other', amount: 2500, date: '2026-10-01', type: 'income' },
      { id: '2', title: 'Groceries', category: 'Food & Dining', amount: 1500, date: '2026-10-02', type: 'expense' },
    ];
    const res = calculateBalance(10000, txs);
    // 10000 + 2500 - 1500 = 11000
    expect(res.balance).toBe(11000);
    expect(res.totalIncome).toBe(2500);
    expect(res.totalExpenses).toBe(1500);
  });

  it('calculates spendable after commitments without double-counting', () => {
    // 10000 - 3000 = 7000
    const spendable = calculateSpendableAfterCommitments(10000, 3000);
    expect(spendable).toBe(7000);
  });

  it('calculates remaining savings target with max(0, goal - saved)', () => {
    expect(calculateRemainingSavingsTarget(2000, 0)).toBe(2000);
    expect(calculateRemainingSavingsTarget(2000, 500)).toBe(1500);
    expect(calculateRemainingSavingsTarget(2000, 2500)).toBe(0);
  });

  it('calculates daily allowance correctly: max(0, spendable - target) / days', () => {
    // Spendable: 7000, Target: 2000 => Discretionary: 5000 / 30 = 166.67
    const allowance = calculateDailyAllowance(7000, 2000, 30);
    expect(allowance).toBe(166.67);
  });

  it('returns zero daily allowance when no days remain', () => {
    expect(calculateDailyAllowance(7000, 2000, 0)).toBe(0);
    expect(calculateDailyAllowance(7000, 2000, -5)).toBe(0);
  });

  it('returns zero daily allowance when spendable does not exceed savings target', () => {
    // Spendable: 1500, Target: 2000 => max(0, -500) / 30 = 0
    expect(calculateDailyAllowance(1500, 2000, 30)).toBe(0);
  });

  it('calculates savings progress capped at 100% and handles zero targets safely', () => {
    expect(calculateSavingsProgress(0, 2000)).toBe(0);
    expect(calculateSavingsProgress(1000, 2000)).toBe(50);
    expect(calculateSavingsProgress(2500, 2000)).toBe(100);
    expect(calculateSavingsProgress(0, 0)).toBe(100);
  });

  it('evaluates comprehensive metrics for seeded state', () => {
    const metrics = calculateFinancialMetrics(defaultDemoState);
    expect(metrics.balance).toBe(10000);
    expect(metrics.spendableAfterCommitments).toBe(7000);
    expect(metrics.remainingSavingsTarget).toBe(2000);
    expect(metrics.dailyAllowance).toBe(166.67);
    expect(metrics.savingsFeasible).toBe(true);
    expect(metrics.savingsShortfall).toBe(0);
    expect(metrics.riskLevel).toBe('safe');
    expect(metrics.healthScore).toBeGreaterThanOrEqual(90);
    const directHealth = calculateHealthScore(10000, 3000, 7000, 2000, 166.67);
    expect(directHealth).toBe(metrics.healthScore);
  });

  it('correctly simulates a purchase without mutating original state', () => {
    const simulation = simulatePurchase(defaultDemoState, {
      title: 'Ergonomic Mouse',
      category: 'Shopping & Tech',
      amount: 1500,
    });

    // Original state metrics
    expect(defaultDemoState.transactions.length).toBe(0);
    expect(simulation.currentMetrics.balance).toBe(10000);
    expect(simulation.currentMetrics.dailyAllowance).toBe(166.67);

    // Simulated metrics
    expect(simulation.simulatedMetrics.balance).toBe(8500);
    expect(simulation.simulatedMetrics.spendableAfterCommitments).toBe(5500);
    // (5500 - 2000) / 30 = 3500 / 30 = 116.67
    expect(simulation.simulatedMetrics.dailyAllowance).toBe(116.67);
    expect(simulation.deltas.balance).toBe(-1500);
    expect(simulation.deltas.spendable).toBe(-1500);
    expect(simulation.deltas.dailyAllowance).toBe(-50);
    expect(simulation.isAffordable).toBe(true);
    expect(simulation.affordabilityStatus).toBe('affordable');
  });

  it('detects when purchase strains savings goal', () => {
    // Current spendable: 7000. Purchase: 6000.
    // New spendable: 1000. Target is 2000 => shortfall of 1000.
    const sim = simulatePurchase(defaultDemoState, {
      title: 'Gaming Console',
      category: 'Entertainment',
      amount: 6000,
    });

    expect(sim.simulatedMetrics.balance).toBe(4000);
    expect(sim.simulatedMetrics.spendableAfterCommitments).toBe(1000);
    expect(sim.simulatedMetrics.savingsFeasible).toBe(false);
    expect(sim.simulatedMetrics.savingsShortfall).toBe(1000);
    expect(sim.simulatedMetrics.dailyAllowance).toBe(0);
    expect(sim.affordabilityStatus).toBe('strains_savings');
    expect(sim.simulatedMetrics.riskLevel).toBe('high_risk');
  });

  it('detects when purchase impairs commitments', () => {
    // Current balance: 10000, commitments: 3000.
    // Purchase: 8000 => new balance: 2000.
    // Spendable: 2000 - 3000 = -1000.
    const sim = simulatePurchase(defaultDemoState, {
      title: 'Luxury Trip',
      category: 'Entertainment',
      amount: 8000,
    });

    expect(sim.simulatedMetrics.spendableAfterCommitments).toBe(-1000);
    expect(sim.affordabilityStatus).toBe('impairs_commitments');
    expect(sim.isAffordable).toBe(false);
    expect(sim.simulatedMetrics.riskLevel).toBe('critical');
  });

  it('detects when purchase exceeds total balance', () => {
    const sim = simulatePurchase(defaultDemoState, {
      title: 'New Bike',
      category: 'Transport',
      amount: 15000,
    });

    expect(sim.affordabilityStatus).toBe('exceeds_balance');
    expect(sim.isAffordable).toBe(false);
  });

  it('correctly assesses risk levels across thresholds', () => {
    // Critical: spendable < 0
    expect(calculateRiskLevel(-100, 2000, 0).riskLevel).toBe('critical');

    // High risk: spendable < target
    expect(calculateRiskLevel(1500, 2000, 0).riskLevel).toBe('high_risk');

    // Caution: daily allowance between 50 and 150
    expect(calculateRiskLevel(5000, 2000, 100).riskLevel).toBe('caution');

    // Safe: daily allowance >= 150 and spendable covers target
    expect(calculateRiskLevel(7000, 2000, 166.67).riskLevel).toBe('safe');
  });
});

describe('Phase 2 — Income Entry & Financial Inflow Impact', () => {
  const baseDemoState: FinancialState = {
    startingBudget: 10000,
    daysRemaining: 30,
    unpaidCommitments: 3000,
    savingsGoal: 2000,
    alreadySaved: 0,
    transactions: [],
    goals: [],
    bills: [],
    subscriptions: [],
  };

  it('updates balance, totalIncome, spendable cash, and daily allowance after recording income', () => {
    const incomeTx: Transaction = {
      id: 'tx-inc-1',
      title: 'Freelance Web Project',
      category: 'Freelance & Gigs',
      amount: 5000,
      date: '2026-10-12T10:00:00Z',
      type: 'income',
    };

    const stateWithIncome: FinancialState = {
      ...baseDemoState,
      transactions: [incomeTx],
    };

    const metrics = calculateFinancialMetrics(stateWithIncome);

    // Balance: 10000 starting + 5000 income - 0 expense = 15000
    expect(metrics.balance).toBe(15000);
    expect(metrics.totalIncome).toBe(5000);
    expect(metrics.totalExpenses).toBe(0);

    // Spendable: 15000 - 3000 commitments = 12000
    expect(metrics.spendableAfterCommitments).toBe(12000);

    // Daily allowance: (12000 - 2000 savings target) / 30 = 10000 / 30 = 333.33/day
    expect(metrics.dailyAllowance).toBe(333.33);

    // Savings goal remains fully feasible
    expect(metrics.savingsFeasible).toBe(true);
    expect(metrics.riskLevel).toBe('safe');
  });

  it('ensures income transaction appears exactly once and does not double count', () => {
    const incomeTx: Transaction = {
      id: 'tx-inc-1',
      title: 'Stipend',
      category: 'Salary & Stipend',
      amount: 2500,
      date: '2026-10-12T12:00:00Z',
      type: 'income',
    };

    const state: FinancialState = {
      ...baseDemoState,
      transactions: [incomeTx],
    };

    // Exactly one transaction in state
    expect(state.transactions.length).toBe(1);
    expect(state.transactions[0].id).toBe('tx-inc-1');

    const bal = calculateBalance(state.startingBudget, state.transactions);
    expect(bal.totalIncome).toBe(2500);
    expect(bal.balance).toBe(12500);
  });

  it('correctly calculates net balance with interleaved income and expenses', () => {
    const txs: Transaction[] = [
      { id: '1', title: 'Consulting Gig', category: 'Freelance & Gigs', amount: 4000, date: '2026-10-02', type: 'income' },
      { id: '2', title: 'Groceries', category: 'Food & Dining', amount: 1200, date: '2026-10-03', type: 'expense' },
      { id: '3', title: 'Cashback Reward', category: 'Refunds & Cashback', amount: 350, date: '2026-10-04', type: 'income' },
      { id: '4', title: 'Utility Bill', category: 'Bills & Utilities', amount: 800, date: '2026-10-05', type: 'expense' },
    ];

    const state: FinancialState = {
      ...baseDemoState,
      transactions: txs,
    };

    const metrics = calculateFinancialMetrics(state);

    // Starting 10,000 + (4000 + 350) - (1200 + 800) = 10000 + 4350 - 2000 = 12350
    expect(metrics.totalIncome).toBe(4350);
    expect(metrics.totalExpenses).toBe(2000);
    expect(metrics.balance).toBe(12350);
    expect(metrics.spendableAfterCommitments).toBe(9350);
  });
});

describe('Phase 2 — Transaction Filtering and Search', () => {
  const sampleTransactions: Transaction[] = [
    { id: 'tx-1', title: 'Client Freelance Payment', category: 'Freelance & Gigs', amount: 4500, date: '2026-10-01T10:00:00Z', type: 'income' },
    { id: 'tx-2', title: 'Organic Grocery Market', category: 'Food & Dining', amount: 850, date: '2026-10-02T12:00:00Z', type: 'expense' },
    { id: 'tx-3', title: 'Cinema & Popcorn', category: 'Entertainment', amount: 600, date: '2026-10-03T18:00:00Z', type: 'expense' },
    { id: 'tx-4', title: 'Investment Dividend', category: 'Investments & Dividends', amount: 1200, date: '2026-10-04T09:00:00Z', type: 'income' },
    { id: 'tx-5', title: 'Dinner at Italian Bistro', category: 'Food & Dining', amount: 1400, date: '2026-10-05T20:00:00Z', type: 'expense' },
  ];

  it('searches transactions by title (case-insensitive substring match)', () => {
    const results = filterTransactions(sampleTransactions, { searchQuery: 'freelance' });
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Client Freelance Payment');

    const foodResults = filterTransactions(sampleTransactions, { searchQuery: 'DINNER' });
    expect(foodResults.length).toBe(1);
    expect(foodResults[0].title).toBe('Dinner at Italian Bistro');
  });

  it('searches transactions by category name', () => {
    const results = filterTransactions(sampleTransactions, { searchQuery: 'Food & Dining' });
    expect(results.length).toBe(2);
  });

  it('filters transactions by type (All, Income, Expense)', () => {
    const all = filterTransactions(sampleTransactions, { typeFilter: 'all' });
    expect(all.length).toBe(5);

    const incomeOnly = filterTransactions(sampleTransactions, { typeFilter: 'income' });
    expect(incomeOnly.length).toBe(2);
    expect(incomeOnly.every((t) => t.type === 'income')).toBe(true);

    const expenseOnly = filterTransactions(sampleTransactions, { typeFilter: 'expense' });
    expect(expenseOnly.length).toBe(3);
    expect(expenseOnly.every((t) => t.type === 'expense')).toBe(true);
  });

  it('filters transactions by specific category', () => {
    const foodOnly = filterTransactions(sampleTransactions, { categoryFilter: 'Food & Dining' });
    expect(foodOnly.length).toBe(2);
    expect(foodOnly.every((t) => t.category === 'Food & Dining')).toBe(true);

    const entertainmentOnly = filterTransactions(sampleTransactions, { categoryFilter: 'Entertainment' });
    expect(entertainmentOnly.length).toBe(1);
  });

  it('combines search query, type filter, and category filter together', () => {
    // Search 'bistro' with type 'expense' and category 'Food & Dining'
    const match = filterTransactions(sampleTransactions, {
      searchQuery: 'bistro',
      typeFilter: 'expense',
      categoryFilter: 'Food & Dining',
    });
    expect(match.length).toBe(1);
    expect(match[0].id).toBe('tx-5');

    // Conflicting filter: searching 'bistro' with type 'income' yields 0
    const conflict = filterTransactions(sampleTransactions, {
      searchQuery: 'bistro',
      typeFilter: 'income',
      categoryFilter: 'Food & Dining',
    });
    expect(conflict.length).toBe(0);
  });

  it('handles empty transaction list and returns empty array safely', () => {
    const emptyResult = filterTransactions([], { searchQuery: 'test' });
    expect(emptyResult).toEqual([]);
  });

  it('handles no-results when query matches nothing', () => {
    const noMatch = filterTransactions(sampleTransactions, { searchQuery: 'nonexistent-query-xyz' });
    expect(noMatch.length).toBe(0);
  });

  it('sorts transactions newest first by date', () => {
    const sorted = filterTransactions(sampleTransactions, {});
    expect(sorted[0].id).toBe('tx-5'); // Oct 5
    expect(sorted[sorted.length - 1].id).toBe('tx-1'); // Oct 1
  });

  it('extracts unique categories correctly', () => {
    const categories = getUniqueCategories(sampleTransactions);
    expect(categories).toContain('Freelance & Gigs');
    expect(categories).toContain('Food & Dining');
    expect(categories).toContain('Entertainment');
    expect(categories).toContain('Investments & Dividends');
    expect(categories.length).toBe(4);
  });
});

describe('Phase 2 — Currency Formatting and Persistence Validation', () => {
  it('formats amounts using Indian numbering system (formatINR)', () => {
    expect(formatINR(10000)).toBe('₹10,000');
    expect(formatINR(150000)).toBe('₹1,50,000');
    expect(formatINR(166.67, { decimals: 2 })).toBe('₹166.67');
    expect(formatINR(2500, { includeSign: true })).toBe('+₹2,500');
    expect(formatINR(-1500, { includeSign: true })).toBe('−₹1,500');
    expect(formatINR(0)).toBe('₹0');
  });

  it('validates transaction schemas correctly via storage validator', async () => {
    const { isValidTransaction, isValidFinancialState } = await import('./storage');

    const validIncomeTx: Transaction = {
      id: 'tx-inc-99',
      title: 'Bonus',
      category: 'Salary & Stipend',
      amount: 5000,
      date: '2026-10-11T12:00:00Z',
      type: 'income',
    };
    expect(isValidTransaction(validIncomeTx)).toBe(true);

    const validExpenseTx: Transaction = {
      id: 'tx-exp-99',
      title: 'Coffee',
      category: 'Food & Dining',
      amount: 150,
      date: '2026-10-11T12:00:00Z',
      type: 'expense',
    };
    expect(isValidTransaction(validExpenseTx)).toBe(true);

    // Invalid amounts or negative values
    expect(isValidTransaction({ ...validIncomeTx, amount: -50 })).toBe(false);
    expect(isValidTransaction({ ...validIncomeTx, amount: NaN })).toBe(false);
    expect(isValidTransaction({ ...validIncomeTx, type: 'invalid_type' })).toBe(false);
    expect(isValidTransaction(null)).toBe(false);

    // Validate entire state with transactions
    const validState: FinancialState = {
      startingBudget: 10000,
      daysRemaining: 30,
      unpaidCommitments: 3000,
      savingsGoal: 2000,
      alreadySaved: 0,
      transactions: [validIncomeTx, validExpenseTx],
      goals: [],
      bills: [],
      subscriptions: [],
    };
    expect(isValidFinancialState(validState)).toBe(true);
  });
});

describe('Phase 3 — Interconnected Financial Planning Engine', () => {
  const deterministicRefDate = new Date('2026-10-15T00:00:00.000Z');

  describe('Multi-Goal Envelopes and Accounting Conservation', () => {
    const goalA: SavingsGoal = {
      id: 'goal-emergency',
      name: 'Emergency Fund',
      targetAmount: 2000,
      alreadySaved: 500,
      priority: 'high',
      targetDate: '2026-11-15',
      category: 'Emergency',
    };

    const goalB: SavingsGoal = {
      id: 'goal-tech',
      name: 'Workstation Monitor',
      targetAmount: 1500,
      alreadySaved: 500,
      priority: 'medium',
      targetDate: '2026-11-20',
      category: 'Equipment',
    };

    it('calculates individual goal progress, remaining target, and completion status', () => {
      const progA = calculateGoalProgress(goalA);
      expect(progA.progressPercent).toBe(25);
      expect(progA.remainingTarget).toBe(1500);
      expect(progA.isCompleted).toBe(false);

      const completedGoal: SavingsGoal = {
        ...goalA,
        alreadySaved: 2000,
      };
      const progDone = calculateGoalProgress(completedGoal);
      expect(progDone.progressPercent).toBe(100);
      expect(progDone.remainingTarget).toBe(0);
      expect(progDone.isCompleted).toBe(true);

      // Capped at 100% even if overfunded
      const overfundedGoal: SavingsGoal = {
        ...goalA,
        alreadySaved: 2500,
      };
      expect(calculateGoalProgress(overfundedGoal).progressPercent).toBe(100);
      expect(calculateGoalProgress(overfundedGoal).remainingTarget).toBe(0);
    });

    it('calculates collective goals totals across multiple goals', () => {
      const totals = calculateGoalsTotals([goalA, goalB]);
      expect(totals.totalTarget).toBe(3500);
      expect(totals.totalAlreadySaved).toBe(1000);
      expect(totals.totalRemainingTarget).toBe(2500);
      // 1000 / 3500 = ~29%
      expect(totals.overallProgressPercent).toBe(29);
    });

    it('handles empty goals list gracefully', () => {
      const totals = calculateGoalsTotals([]);
      expect(totals.totalTarget).toBe(0);
      expect(totals.totalAlreadySaved).toBe(0);
      expect(totals.totalRemainingTarget).toBe(0);
      expect(totals.overallProgressPercent).toBe(0);
    });

    it('enforces that contributing to a goal reallocates spendable cash without altering total balance', () => {
      // Baseline state with ₹10,000 balance, ₹3,000 unpaid bills, ₹2,000 target (₹500 already saved)
      const stateBefore: FinancialState = {
        startingBudget: 10000,
        daysRemaining: 30,
        unpaidCommitments: 3000,
        savingsGoal: 2000,
        alreadySaved: 500,
        goals: [goalA],
        bills: [],
        subscriptions: [],
        transactions: [],
      };

      const metricsBefore = calculateFinancialMetrics(stateBefore);
      expect(metricsBefore.balance).toBe(10000);
      expect(metricsBefore.spendableAfterCommitments).toBe(7000);
      expect(metricsBefore.remainingSavingsTarget).toBe(1500);
      expect(metricsBefore.dailyAllowance).toBe(183.33); // (7000 - 1500) / 30 = 5500 / 30 = 183.33

      // Simulate a ₹500 contribution to goalA
      const updatedGoal: SavingsGoal = {
        ...goalA,
        alreadySaved: goalA.alreadySaved + 500, // now 1000
      };
      const stateAfter: FinancialState = {
        ...stateBefore,
        alreadySaved: stateBefore.alreadySaved + 500,
        goals: [updatedGoal],
      };

      const metricsAfter = calculateFinancialMetrics(stateAfter);
      // Total bank balance is NOT modified by internal goal allocation
      expect(metricsAfter.balance).toBe(10000);
      // Spendable cash is conserved
      expect(metricsAfter.spendableAfterCommitments).toBe(7000);
      // Remaining target dropped from 1500 to 1000
      expect(metricsAfter.remainingSavingsTarget).toBe(1000);
      // Daily allowance increased because less savings remain to be funded! (7000 - 1000) / 30 = 200/day
      expect(metricsAfter.dailyAllowance).toBe(200);
      expect(metricsAfter.savingsProgressPercent).toBe(50);
    });
  });

  describe('Recurring Subscriptions 30-Day Window Calculations', () => {
    const weeklySub: Subscription = {
      id: 'sub-weekly',
      name: 'Gym Pass',
      amount: 250,
      frequency: 'weekly',
      nextBillingDate: '2026-10-18', // 3 days after Oct 15
      category: 'Health & Fitness',
      active: true,
    };

    const monthlySub: Subscription = {
      id: 'sub-monthly',
      name: 'Cloud Storage',
      amount: 199,
      frequency: 'monthly',
      nextBillingDate: '2026-10-25', // 10 days after Oct 15
      category: 'Subscriptions',
      active: true,
    };

    it('calculates weekly subscription occurrences within 30-day window correctly', () => {
      // Oct 18, Oct 25, Nov 1, Nov 8 (4 occurrences)
      const res = calculateSubscriptionOccurrencesInWindow(weeklySub, deterministicRefDate, 30);
      expect(res.occurrences).toBe(4);
      expect(res.totalCost).toBe(1000); // 4 * 250
      expect(res.dates.length).toBe(4);
    });

    it('calculates monthly subscription occurrences within 30-day window correctly', () => {
      // Oct 25 (1 occurrence within 30 days)
      const res = calculateSubscriptionOccurrencesInWindow(monthlySub, deterministicRefDate, 30);
      expect(res.occurrences).toBe(1);
      expect(res.totalCost).toBe(199);
      expect(res.dates.length).toBe(1);
    });

    it('produces 0 occurrences and 0 cost for paused subscriptions', () => {
      const pausedSub: Subscription = {
        ...weeklySub,
        active: false,
      };
      const res = calculateSubscriptionOccurrencesInWindow(pausedSub, deterministicRefDate, 30);
      expect(res.occurrences).toBe(0);
      expect(res.totalCost).toBe(0);
      expect(res.dates.length).toBe(0);
      expect(calculate30DaySubscriptionCost([pausedSub], deterministicRefDate.toISOString())).toBe(0);
    });
  });

  describe('Unpaid Commitments & Bill Payment Reconciliation', () => {
    const demoBills: BillCommitment[] = [
      { id: 'b-1', title: 'Apartment Rent', amount: 2200, dueDate: '2026-10-20', category: 'Housing', isPaid: false },
      { id: 'b-2', title: 'High-Speed WiFi', amount: 800, dueDate: '2026-10-25', category: 'Utilities', isPaid: false },
    ];

    it('sums only unpaid bills via calculateTotalUnpaidBills', () => {
      expect(calculateTotalUnpaidBills(demoBills)).toBe(3000);

      const onePaid: BillCommitment[] = [
        demoBills[0],
        { ...demoBills[1], isPaid: true },
      ];
      expect(calculateTotalUnpaidBills(onePaid)).toBe(2200);

      const allPaid: BillCommitment[] = demoBills.map((b) => ({ ...b, isPaid: true }));
      expect(calculateTotalUnpaidBills(allPaid)).toBe(0);
    });

    it('preserves spendable cash without double-deduction when a bill is marked paid', () => {
      // Day 0 baseline state
      const stateBefore: FinancialState = {
        startingBudget: 10000,
        daysRemaining: 30,
        unpaidCommitments: 3000,
        savingsGoal: 2000,
        alreadySaved: 0,
        bills: demoBills,
        goals: [],
        subscriptions: [],
        transactions: [],
      };

      const metricsBefore = calculateFinancialMetrics(stateBefore);
      expect(metricsBefore.balance).toBe(10000);
      expect(metricsBefore.spendableAfterCommitments).toBe(7000); // 10000 - 3000
      expect(metricsBefore.dailyAllowance).toBe(166.67); // (7000 - 2000) / 30

      // When Rent (₹2,200) is marked paid:
      // 1. An expense transaction of ₹2,200 is recorded
      const billTx: Transaction = {
        id: 'tx-bill-paid-b-1',
        title: 'Paid: Apartment Rent',
        category: 'Housing',
        amount: 2200,
        date: '2026-10-20T10:00:00.000Z',
        type: 'expense',
      };
      // 2. The bill's isPaid is marked true
      const updatedBills: BillCommitment[] = [
        { ...demoBills[0], isPaid: true },
        demoBills[1],
      ];

      const stateAfterPaid: FinancialState = {
        ...stateBefore,
        transactions: [billTx],
        bills: updatedBills,
        unpaidCommitments: 800, // only WiFi remains
        goals: [],
        subscriptions: [],
      };

      const metricsAfter = calculateFinancialMetrics(stateAfterPaid);
      // Actual balance decreased by 2,200
      expect(metricsAfter.balance).toBe(7800);
      // Unpaid commitments decreased to 800
      // Spendable after commitments is strictly conserved: 7800 - 800 = 7000!
      expect(metricsAfter.spendableAfterCommitments).toBe(7000);
      // Daily allowance is unaffected because spendable cash was conserved!
      expect(metricsAfter.dailyAllowance).toBe(166.67);
      expect(metricsAfter.savingsFeasible).toBe(true);
    });

    it('correctly reverts balance and unpaid commitments when a paid bill is reopened', () => {
      // Reopened bill (removing the linked transaction and setting isPaid = false)
      const stateReverted: FinancialState = {
        startingBudget: 10000,
        daysRemaining: 30,
        unpaidCommitments: 3000,
        savingsGoal: 2000,
        alreadySaved: 0,
        bills: demoBills,
        goals: [],
        subscriptions: [],
        transactions: [],
      };

      const metrics = calculateFinancialMetrics(stateReverted);
      expect(metrics.balance).toBe(10000);
      expect(metrics.spendableAfterCommitments).toBe(7000);
      expect(metrics.dailyAllowance).toBe(166.67);
    });
  });

  describe('30-Day Milestone Forecast Projection', () => {
    it('projects scheduled bills and subscriptions on calendar dates and identifies trough balance', () => {
      const state: FinancialState = {
        startingBudget: 10000,
        daysRemaining: 30,
        unpaidCommitments: 3000,
        savingsGoal: 2000,
        alreadySaved: 0,
        goals: [],
        bills: [
          { id: 'b-1', title: 'Rent', amount: 2200, dueDate: '2026-10-20', category: 'Housing', isPaid: false },
          { id: 'b-2', title: 'WiFi', amount: 800, dueDate: '2026-10-25', category: 'Utilities', isPaid: false },
        ],
        subscriptions: [
          { id: 's-1', name: 'Cloud', amount: 199, frequency: 'monthly', nextBillingDate: '2026-10-22', category: 'Subscriptions', active: true },
        ],
        transactions: [],
      };

      const forecast = generateForecast(state, undefined, deterministicRefDate);
      expect(forecast.days.length).toBeGreaterThanOrEqual(15);
      expect(forecast.totalExpectedBills).toBe(3000);
      expect(forecast.totalExpectedSubscriptions).toBe(199);
      expect(forecast.totalExpectedFutureCharges).toBe(3199);
      expect(forecast.lowestProjectedBalance).toBeGreaterThanOrEqual(0);
      expect(forecast.lowestBalanceDay).toBeGreaterThan(0);
      expect(forecast.assumptions.totalDays).toBe(30);
      expect(forecast.assumptions.unpaidCommitments).toBe(3000);
    });

    it('flags insufficient funds warning when balance on a due day cannot cover the bill', () => {
      // Low balance state: ₹1,500 total balance, but Rent of ₹2,200 due on Day 5 (Oct 20)
      const lowState: FinancialState = {
        startingBudget: 1500,
        daysRemaining: 30,
        unpaidCommitments: 2200,
        savingsGoal: 500,
        alreadySaved: 0,
        goals: [],
        bills: [
          { id: 'b-rent', title: 'Rent', amount: 2200, dueDate: '2026-10-20', category: 'Housing', isPaid: false },
        ],
        subscriptions: [],
        transactions: [],
      };

      const forecast = generateForecast(lowState, undefined, deterministicRefDate);
      expect(forecast.warnings.length).toBeGreaterThan(0);
      const rentWarning = forecast.warnings.find((w) => w.obligationName.includes('Rent'));
      expect(rentWarning).toBeDefined();
      expect(rentWarning?.requiredAmount).toBe(2200);
    });
  });

  describe('Storage Validation & Migration to Phase 3 Schema', () => {
    it('validates savings goal schema via isValidSavingsGoal', () => {
      const validGoal: SavingsGoal = {
        id: 'g-valid',
        name: 'Emergency',
        targetAmount: 2000,
        alreadySaved: 200,
        priority: 'high',
        targetDate: '2026-11-01',
        category: 'Emergency',
      };
      expect(isValidSavingsGoal(validGoal)).toBe(true);
      expect(isValidSavingsGoal({ ...validGoal, targetAmount: -10 })).toBe(false);
      expect(isValidSavingsGoal({ ...validGoal, name: '' })).toBe(false);
      expect(isValidSavingsGoal({ ...validGoal, priority: 'invalid' })).toBe(false);
      expect(isValidSavingsGoal(null)).toBe(false);
    });

    it('validates bill commitment schema via isValidBillCommitment', () => {
      const validBill: BillCommitment = {
        id: 'b-valid',
        title: 'Electricity',
        amount: 500,
        dueDate: '2026-10-22',
        category: 'Utilities',
        isPaid: false,
      };
      expect(isValidBillCommitment(validBill)).toBe(true);
      expect(isValidBillCommitment({ ...validBill, amount: 0 })).toBe(false);
      expect(isValidBillCommitment({ ...validBill, dueDate: '' })).toBe(false);
      expect(isValidBillCommitment(null)).toBe(false);
    });

    it('validates subscription schema via isValidSubscription', () => {
      const validSub: Subscription = {
        id: 's-valid',
        name: 'Streaming',
        amount: 499,
        frequency: 'monthly',
        nextBillingDate: '2026-10-25',
        category: 'Entertainment',
        active: true,
      };
      expect(isValidSubscription(validSub)).toBe(true);
      expect(isValidSubscription({ ...validSub, frequency: 'daily' as any })).toBe(false);
      expect(isValidSubscription({ ...validSub, amount: -1 })).toBe(false);
      expect(isValidSubscription(null)).toBe(false);
    });

    it('migrates legacy Phase 1/2 state by seeding defaults while preserving existing transactions', () => {
      const legacyState = {
        startingBudget: 10000,
        daysRemaining: 30,
        unpaidCommitments: 3000,
        savingsGoal: 2000,
        alreadySaved: 0,
        transactions: [
          { id: 'tx-old-1', title: 'Salary', category: 'Salary & Stipend', amount: 5000, date: '2026-10-01', type: 'income' as const },
        ],
      };

      const migrated = migrateFinancialState(legacyState);
      expect(migrated.goals).toBeDefined();
      expect(migrated.goals.length).toBeGreaterThan(0);
      expect(migrated.bills).toBeDefined();
      expect(migrated.bills.length).toBeGreaterThan(0);
      expect(migrated.subscriptions).toBeDefined();
      expect(migrated.subscriptions.length).toBeGreaterThan(0);

      // Preserved original user transactions
      expect(migrated.transactions.length).toBe(1);
      expect(migrated.transactions[0].id).toBe('tx-old-1');
      expect(migrated.startingBudget).toBe(10000);
    });
  });

  describe('Phase 4: Financial Intelligence, Health Scoring & Interactive Forecast', () => {
    const phase4DemoState: FinancialState = {
      startingBudget: 10000,
      daysRemaining: 30,
      unpaidCommitments: 3000,
      savingsGoal: 2000,
      alreadySaved: 0,
      transactions: [],
      goals: [],
      bills: [],
      subscriptions: [],
    };

    it('breaks down financial health score across 4 transparent weighted factors', () => {
      // Healthy baseline
      const breakdown = calculateHealthScoreBreakdown(
        10000, // balance
        3000,  // unpaid commitments
        7000,  // spendable
        2000,  // remaining savings
        166.67 // daily allowance (matches benchmark)
      );

      expect(breakdown.totalScore).toBe(100);
      expect(breakdown.riskLevel).toBe('safe');
      expect(breakdown.riskLabel).toBe('Low Risk');
      expect(breakdown.factors).toHaveLength(4);

      const factorIds = breakdown.factors.map((f) => f.id);
      expect(factorIds).toEqual(['solvency', 'trough', 'savings', 'runway']);

      // Exact weights sum to 100
      const totalWeight = breakdown.factors.reduce((sum, f) => sum + f.weightPercent, 0);
      expect(totalWeight).toBe(100);

      const solvency = breakdown.factors.find((f) => f.id === 'solvency')!;
      expect(solvency.weightPercent).toBe(35);
      expect(solvency.score).toBe(35);
      expect(solvency.status).toBe('excellent');

      const trough = breakdown.factors.find((f) => f.id === 'trough')!;
      expect(trough.weightPercent).toBe(25);
      expect(trough.score).toBe(25);
      expect(trough.status).toBe('excellent');

      const savings = breakdown.factors.find((f) => f.id === 'savings')!;
      expect(savings.weightPercent).toBe(20);
      expect(savings.score).toBe(20);
      expect(savings.status).toBe('excellent');

      const runway = breakdown.factors.find((f) => f.id === 'runway')!;
      expect(runway.weightPercent).toBe(20);
      expect(runway.score).toBe(20);
      expect(runway.status).toBe('excellent');

      // Includes educational disclaimer
      expect(breakdown.disclaimer).toContain('Educational Decision Simulator');
      expect(breakdown.disclaimer).toContain('not a credit score');
    });

    it('penalizes individual health factors when financial constraints are breached', () => {
      // Impaired balance: balance 2,000 < commitments 3,000 => spendable -1,000
      const impaired = calculateHealthScoreBreakdown(
        2000,  // balance
        3000,  // unpaid commitments
        -1000, // spendable
        2000,  // remaining savings
        0,     // daily allowance
        -500   // negative trough
      );

      expect(impaired.totalScore).toBeLessThan(40);
      expect(impaired.riskLevel).toBe('critical');
      expect(impaired.riskLabel).toBe('Critical Risk');

      const solvency = impaired.factors.find((f) => f.id === 'solvency')!;
      expect(solvency.status).toBe('critical');
      expect(solvency.score).toBeLessThan(35);

      const trough = impaired.factors.find((f) => f.id === 'trough')!;
      expect(trough.status).toBe('critical');
      expect(trough.score).toBe(0);

      const savings = impaired.factors.find((f) => f.id === 'savings')!;
      expect(savings.status).toBe('critical');
      expect(savings.score).toBe(0);

      const runway = impaired.factors.find((f) => f.id === 'runway')!;
      expect(runway.status).toBe('critical');
      expect(runway.score).toBe(0);

      // Non-judgmental actionable guidance generated
      expect(impaired.actionableGuidance.length).toBeGreaterThan(0);
      expect(impaired.actionableGuidance.some((g) => g.toLowerCase().includes('commitments') || g.toLowerCase().includes('income'))).toBe(true);
    });

    it('ensures consistent risk labels across calculateRiskLevel and calculateHealthScoreBreakdown', () => {
      const safeLevel = calculateRiskLevel(7000, 2000, 166.67);
      expect(safeLevel.riskLevel).toBe('safe');
      expect(safeLevel.riskLabel).toBe('Low Risk');

      const cautionLevel = calculateRiskLevel(7000, 2000, 120);
      expect(cautionLevel.riskLevel).toBe('caution');
      expect(cautionLevel.riskLabel).toBe('Moderate Risk');

      const highRiskLevel = calculateRiskLevel(1500, 2000, 0);
      expect(highRiskLevel.riskLevel).toBe('high_risk');
      expect(highRiskLevel.riskLabel).toBe('High Risk');

      const criticalLevel = calculateRiskLevel(-500, 2000, 0);
      expect(criticalLevel.riskLevel).toBe('critical');
      expect(criticalLevel.riskLabel).toBe('Critical Risk');
    });

    it('deduplicates subscription charges against actual recorded expense transactions', () => {
      const sub: Subscription = {
        id: 'sub-netflix',
        name: 'Netflix Subscription',
        amount: 499,
        frequency: 'monthly',
        nextBillingDate: '2026-10-15',
        category: 'Entertainment',
        active: true,
      };

      const scheduledDate = new Date('2026-10-15');

      // No transactions => not paid
      expect(isSubscriptionPaidForDate(sub, scheduledDate, [])).toBe(false);

      // An actual expense transaction exists for Netflix around that date
      const recordedTx: Transaction[] = [
        {
          id: 'tx-netflix-paid',
          title: 'Netflix Subscription Payment',
          category: 'Entertainment',
          amount: 499,
          date: '2026-10-15T10:00:00.000Z',
          type: 'expense',
        },
      ];

      expect(isSubscriptionPaidForDate(sub, scheduledDate, recordedTx)).toBe(true);

      // calculateSubscriptionOccurrencesInWindow should skip the paid date
      const refDate = new Date('2026-10-10');
      const withoutTx = calculateSubscriptionOccurrencesInWindow(sub, refDate, 30, []);
      expect(withoutTx.occurrences).toBe(1);
      expect(withoutTx.totalCost).toBe(499);

      const withTx = calculateSubscriptionOccurrencesInWindow(sub, refDate, 30, recordedTx);
      expect(withTx.occurrences).toBe(0);
      expect(withTx.totalCost).toBe(0);
    });

    it('conserves spendable cash without double-deducting scheduled bills in forecast projection', () => {
      const fixedRefDate = new Date('2026-10-01');
      const stateWithBills: FinancialState = {
        startingBudget: 10000,
        daysRemaining: 30,
        unpaidCommitments: 3000,
        savingsGoal: 2000,
        alreadySaved: 0,
        transactions: [],
        goals: [],
        bills: [
          {
            id: 'b-rent',
            title: 'Apartment Rent',
            amount: 3000,
            dueDate: '2026-10-05',
            category: 'Housing & Rent',
            isPaid: false,
          },
        ],
        subscriptions: [],
      };

      const forecast = generateForecast(stateWithBills, undefined, fixedRefDate);

      // Day 0: balance is 10,000, commitments are 3,000 => spendable is 7,000
      const day0 = forecast.days[0];
      expect(day0.baselineBalance).toBe(10000);
      expect(day0.baselineSpendable).toBe(7000);

      // Day 3 (before bill due on Oct 5): bill has not deducted balance yet
      const day3 = forecast.days[3];
      expect(day3.dueBillsCost).toBe(0);

      // Day 4 (Oct 5 is 4 days after Oct 1): bill is due and accounted
      const day4 = forecast.days[4];
      expect(day4.dueBillsCost).toBe(3000);
      expect(forecast.totalExpectedBills).toBe(3000);

      // Throughout the forecast, baseline spendable never double-counts the rent commitment
      forecast.days.forEach((dayPt) => {
        // baselineSpendable is mathematically: balance - remainingCommitments
        expect(dayPt.baselineSpendable).toBeLessThanOrEqual(dayPt.baselineBalance);
        expect(dayPt.baselineSpendable).toBeGreaterThanOrEqual(0);
      });
    });

    it('supports 7, 14, and 30 day scenario windows with custom daily burn rate', () => {
      const fixedRefDate = new Date('2026-10-01');

      // 7-day window
      const forecast7 = generateForecast(phase4DemoState, { daysWindow: 7 }, fixedRefDate);
      expect(forecast7.days).toHaveLength(8); // Day 0 to Day 7 inclusive
      expect(forecast7.assumptions.totalDays).toBe(7);

      // 14-day window
      const forecast14 = generateForecast(phase4DemoState, { daysWindow: 14 }, fixedRefDate);
      expect(forecast14.days).toHaveLength(15); // Day 0 to Day 14 inclusive
      expect(forecast14.assumptions.totalDays).toBe(14);

      // 30-day window
      const forecast30 = generateForecast(phase4DemoState, { daysWindow: 30 }, fixedRefDate);
      expect(forecast30.days).toHaveLength(31); // Day 0 to Day 30 inclusive
      expect(forecast30.assumptions.totalDays).toBe(30);

      // Planned allowance override (burn ₹250/day instead of baseline ~₹166.67/day)
      const forecastOverride = generateForecast(
        phase4DemoState,
        { daysWindow: 30, plannedDailyAllowance: 250 },
        fixedRefDate
      );

      expect(forecastOverride.assumptions.dailyBurnSimulated).toBe(250);
      expect(forecastOverride.simulatedEndBalance).toBeDefined();
      expect(forecastOverride.simulatedEndBalance!).toBeLessThan(forecastOverride.baselineEndBalance);

      // Hypothetical one-time expense (₹1,500 on Day 10)
      const forecastHypothetical = generateForecast(
        phase4DemoState,
        {
          daysWindow: 30,
          hypotheticalExpense: {
            amount: 1500,
            title: 'Weekend Getaway',
            day: 10,
          },
        },
        fixedRefDate
      );

      expect(forecastHypothetical.simulatedEndBalance).toBeDefined();
      // On day 9, simulated is same as baseline (if daily burn is identical)
      const day9 = forecastHypothetical.days[9];
      expect(day9.simulatedBalance).toBe(day9.baselineBalance);

      // On day 10, simulated drops by 1500 compared to baseline
      const day10 = forecastHypothetical.days[10];
      expect(day10.simulatedBalance).toBe(day10.baselineBalance - 1500);

      // Baseline balance is completely unaffected by the scenario
      expect(forecastHypothetical.baselineEndBalance).toBe(forecast30.baselineEndBalance);
    });

    it('generates clear, deduplicated warnings when bill commitments exceed cash balance', () => {
      const tightState: FinancialState = {
        startingBudget: 2000,
        daysRemaining: 30,
        unpaidCommitments: 5000,
        savingsGoal: 1000,
        alreadySaved: 0,
        transactions: [],
        goals: [],
        bills: [
          {
            id: 'b-hefty-rent',
            title: 'Hefty Rent',
            amount: 3500,
            dueDate: '2026-10-05',
            category: 'Housing & Rent',
            isPaid: false,
          },
        ],
        subscriptions: [],
      };

      const fixedRefDate = new Date('2026-10-01');
      const forecast = generateForecast(tightState, undefined, fixedRefDate);

      expect(forecast.warnings.length).toBeGreaterThan(0);
      const rentWarning = forecast.warnings.find((w) => w.obligationName.includes('Hefty Rent'));
      expect(rentWarning).toBeDefined();
      expect(rentWarning!.message).toContain('insufficient');
      expect(rentWarning!.requiredAmount).toBe(3500);
      expect(rentWarning!.day).toBeGreaterThan(0);
    });
  });

  describe('Phase 5: Functional Regression, Reconciliation Integrity & Boundary Audit', () => {
    it('guarantees bill payment reconciliation conserves spendable cash without double deduction', () => {
      // Starting: balance 10,000, bill 2,200 unpaid => spendable 7,800
      const bill: BillCommitment = {
        id: 'b-rent-recon',
        title: 'Monthly Rent',
        amount: 2200,
        dueDate: '2026-10-15',
        category: 'Housing & Rent',
        isPaid: false,
      };

      const initialState: FinancialState = {
        startingBudget: 10000,
        daysRemaining: 30,
        unpaidCommitments: 2200,
        savingsGoal: 2000,
        alreadySaved: 0,
        transactions: [],
        goals: [],
        bills: [bill],
        subscriptions: [],
      };

      const initialMetrics = calculateFinancialMetrics(initialState);
      expect(initialMetrics.balance).toBe(10000);
      expect(initialMetrics.spendableAfterCommitments).toBe(7800);

      // STEP A: Pay the bill
      const paidTx: Transaction = {
        id: `tx-bill-paid-${bill.id}`,
        title: `Bill Paid: ${bill.title}`,
        category: bill.category || 'Bills & Utilities',
        amount: bill.amount,
        date: '2026-10-15T10:00:00.000Z',
        type: 'expense',
      };

      const paidState: FinancialState = {
        ...initialState,
        bills: [{ ...bill, isPaid: true, paidAt: '2026-10-15T10:00:00.000Z' }],
        transactions: [paidTx],
        unpaidCommitments: 0,
      };

      const paidMetrics = calculateFinancialMetrics(paidState);
      expect(paidMetrics.balance).toBe(7800); // 10000 - 2200
      expect(paidMetrics.totalExpenses).toBe(2200);
      expect(paidMetrics.spendableAfterCommitments).toBe(7800); // 7800 - 0 = 7800!
      // Invariant: Spendable cash is CONSERVED before and after paying the bill!
      expect(paidMetrics.spendableAfterCommitments).toBe(initialMetrics.spendableAfterCommitments);

      // STEP B: Reopen the bill as unpaid
      const reopenedState: FinancialState = {
        ...initialState,
        bills: [{ ...bill, isPaid: false }],
        transactions: [], // transaction removed
        unpaidCommitments: 2200,
      };

      const reopenedMetrics = calculateFinancialMetrics(reopenedState);
      expect(reopenedMetrics.balance).toBe(10000);
      expect(reopenedMetrics.totalExpenses).toBe(0);
      expect(reopenedMetrics.spendableAfterCommitments).toBe(7800);
      // Invariant: Reversing the bill restores the exact initial balance and spendable cash!
      expect(reopenedMetrics.balance).toBe(initialMetrics.balance);
    });

    it('reallocates spendable cash to savings goals without mutating total balance or income', () => {
      const goal: SavingsGoal = {
        id: 'g-reserve',
        name: 'Emergency Fund',
        targetAmount: 2000,
        alreadySaved: 0,
      };

      const stateBefore: FinancialState = {
        startingBudget: 10000,
        daysRemaining: 30,
        unpaidCommitments: 3000,
        savingsGoal: 2000,
        alreadySaved: 0,
        transactions: [],
        goals: [goal],
        bills: [],
        subscriptions: [],
      };

      const metricsBefore = calculateFinancialMetrics(stateBefore);
      expect(metricsBefore.balance).toBe(10000);
      expect(metricsBefore.totalIncome).toBe(0);
      expect(metricsBefore.dailyAllowance).toBe(166.67);

      // User allocates ₹500 from spendable cash into the goal
      const stateAfter: FinancialState = {
        ...stateBefore,
        goals: [{ ...goal, alreadySaved: 500 }],
        alreadySaved: 500,
      };

      const metricsAfter = calculateFinancialMetrics(stateAfter);
      // Invariant: Total balance is NOT changed by goal reallocations
      expect(metricsAfter.balance).toBe(10000);
      expect(metricsAfter.totalIncome).toBe(0);
      expect(metricsAfter.totalExpenses).toBe(0);

      // Remaining target decreases by 500
      expect(metricsAfter.remainingSavingsTarget).toBe(1500);
      expect(metricsAfter.savingsProgressPercent).toBe(25);

      // Daily allowance increases because less remaining target needs to be saved over the 30 days
      // (7000 - 1500) / 30 = 5500 / 30 = 183.33
      expect(metricsAfter.dailyAllowance).toBe(183.33);
      expect(metricsAfter.dailyAllowance).toBeGreaterThan(metricsBefore.dailyAllowance);
    });

    it('safely handles zero and negative boundaries in financial functions', () => {
      // calculateDailyAllowance handles zero or negative days remaining
      expect(calculateDailyAllowance(5000, 2000, 0)).toBe(0);
      expect(calculateDailyAllowance(5000, 2000, -5)).toBe(0);

      // calculateDailyAllowance handles negative spendable funds
      expect(calculateDailyAllowance(-1000, 2000, 30)).toBe(0);

      // calculateRemainingSavingsTarget handles overfunded target safely
      expect(calculateRemainingSavingsTarget(2000, 2500)).toBe(0);
      expect(calculateRemainingSavingsTarget(0, 0)).toBe(0);

      // calculateSavingsProgress caps at 100% and handles zero target
      expect(calculateSavingsProgress(2500, 2000)).toBe(100);
      expect(calculateSavingsProgress(500, 0)).toBe(100);
      expect(calculateSavingsProgress(0, 0)).toBe(100);

      // formatINR handles edge cases
      expect(formatINR(NaN)).toBe('₹0');
      expect(formatINR(Infinity)).toBe('₹0');
      expect(formatINR(-0)).toBe('₹0');
      expect(formatINR(-1500)).toBe('−₹1,500');
      expect(formatINR(1500, { includeSign: true })).toBe('+₹1,500');
    });

    it('excludes paused subscriptions from forecast occurrences and future charges', () => {
      const pausedSub: Subscription = {
        id: 's-paused',
        name: 'Gym Membership',
        amount: 1200,
        frequency: 'monthly',
        nextBillingDate: '2026-10-18',
        category: 'Health & Wellness',
        active: false, // Paused
      };

      const refDate = new Date('2026-10-10');
      const subResult = calculateSubscriptionOccurrencesInWindow(pausedSub, refDate, 30);
      expect(subResult.occurrences).toBe(0);
      expect(subResult.totalCost).toBe(0);

      const stateWithPaused: FinancialState = {
        startingBudget: 10000,
        daysRemaining: 30,
        unpaidCommitments: 0,
        savingsGoal: 2000,
        alreadySaved: 0,
        transactions: [],
        goals: [],
        bills: [],
        subscriptions: [pausedSub],
      };

      const forecast = generateForecast(stateWithPaused, undefined, refDate);
      expect(forecast.totalExpectedSubscriptions).toBe(0);
      expect(forecast.totalExpectedFutureCharges).toBe(0);
    });

    it('guarantees pure simulation immutability and rejects unaffordable purchases safely', () => {
      const baseState: FinancialState = {
        startingBudget: 10000,
        daysRemaining: 30,
        unpaidCommitments: 3000,
        savingsGoal: 2000,
        alreadySaved: 0,
        transactions: [],
        goals: [],
        bills: [],
        subscriptions: [],
      };

      // 1. Simulation with eligible purchase
      const sim = simulatePurchase(baseState, {
        title: 'New Shoes',
        category: 'Shopping & Tech',
        amount: 1500,
      });

      // Simulation gives expected projections
      expect(sim.isAffordable).toBe(true);
      expect(sim.simulatedMetrics.balance).toBe(8500);

      // Invariant: baseState is completely unmutated
      expect(baseState.transactions).toHaveLength(0);
      expect(baseState.startingBudget).toBe(10000);

      // 2. Simulation exceeding total balance
      const simExceeds = simulatePurchase(baseState, {
        title: 'Motorbike',
        category: 'Transport & Fuel',
        amount: 15000,
      });
      expect(simExceeds.isAffordable).toBe(false);
      expect(simExceeds.affordabilityStatus).toBe('exceeds_balance');

      // 3. Simulation impairing commitments (balance 10,000, commitment 3,000, purchase 8,000 => balance 2,000 < 3,000)
      const simImpairs = simulatePurchase(baseState, {
        title: 'High-end Laptop',
        category: 'Shopping & Tech',
        amount: 8000,
      });
      expect(simImpairs.isAffordable).toBe(false);
      expect(simImpairs.affordabilityStatus).toBe('impairs_commitments');
    });
  });
});


