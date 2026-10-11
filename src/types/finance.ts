export type TransactionType = 'income' | 'expense';

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Shopping & Tech'
  | 'Entertainment'
  | 'Transport'
  | 'Bills & Utilities'
  | 'Healthcare'
  | 'Education'
  | 'Personal Care'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Shopping & Tech',
  'Entertainment',
  'Transport',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Personal Care',
  'Other',
];

export type IncomeCategory =
  | 'Salary & Stipend'
  | 'Freelance & Gigs'
  | 'Investments & Dividends'
  | 'Gifts & Allowance'
  | 'Refunds & Cashback'
  | 'Other Income';

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salary & Stipend',
  'Freelance & Gigs',
  'Investments & Dividends',
  'Gifts & Allowance',
  'Refunds & Cashback',
  'Other Income',
];

export type TransactionCategory = ExpenseCategory | IncomeCategory | string;

export interface Transaction {
  id: string;
  title: string;
  category: TransactionCategory;
  amount: number;
  date: string; // ISO format: YYYY-MM-DD or full timestamp
  type: TransactionType;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  alreadySaved: number;
  targetDate?: string; // ISO format or YYYY-MM-DD
  createdAt?: string; // ISO format
  category?: string;
  priority?: 'high' | 'medium' | 'low';
}

export type SubscriptionFrequency = 'weekly' | 'monthly';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: SubscriptionFrequency;
  nextBillingDate: string; // ISO format or YYYY-MM-DD
  active: boolean;
  category: string;
  notes?: string;
}

export interface BillCommitment {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // ISO format or YYYY-MM-DD
  isPaid: boolean;
  category?: string;
  paidAt?: string;
}

export interface FinancialState {
  startingBudget: number;
  daysRemaining: number;
  unpaidCommitments: number;
  savingsGoal: number;
  alreadySaved: number;
  transactions: Transaction[];
  goals: SavingsGoal[];
  bills: BillCommitment[];
  subscriptions: Subscription[];
}

export type RiskLevel = 'safe' | 'caution' | 'high_risk' | 'critical';

export interface HealthScoreFactor {
  id: 'solvency' | 'trough' | 'savings' | 'runway';
  name: string;
  score: number;
  maxScore: number;
  weightPercent: number;
  status: 'excellent' | 'good' | 'caution' | 'critical';
  headline: string;
  description: string;
  guidance: string;
}

export interface HealthScoreBreakdown {
  totalScore: number; // 0 - 100
  riskLevel: RiskLevel;
  riskLabel: string;
  factors: HealthScoreFactor[];
  actionableGuidance: string[];
  disclaimer: string;
}

export interface FinancialMetrics {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  spendableAfterCommitments: number;
  remainingSavingsTarget: number;
  dailyAllowance: number;
  savingsProgressPercent: number;
  savingsFeasible: boolean;
  savingsShortfall: number;
  riskLevel: RiskLevel;
  riskLabel: string;
  healthScore: number; // 0 - 100
  healthBreakdown?: HealthScoreBreakdown;
  discretionaryRemaining: number;
}

export interface PurchaseSimulationInput {
  title: string;
  category: ExpenseCategory | string;
  amount: number;
}

export type AffordabilityStatus =
  | 'affordable'
  | 'strains_savings'
  | 'impairs_commitments'
  | 'exceeds_balance';

export interface SimulationResult {
  input: PurchaseSimulationInput;
  currentMetrics: FinancialMetrics;
  simulatedMetrics: FinancialMetrics;
  deltas: {
    balance: number;
    spendable: number;
    dailyAllowance: number;
    dailyAllowancePercentChange: number;
    healthScoreDelta: number;
    savingsShortfall: number;
  };
  isAffordable: boolean;
  affordabilityStatus: AffordabilityStatus;
  impactAnalysis: {
    severity: 'neutral' | 'warning' | 'danger';
    headline: string;
    description: string;
    runwayImpactText: string;
    goalImpactText: string;
  };
}

export interface ForecastObligationItem {
  id: string;
  name: string;
  amount: number;
  day: number;
  date: string;
  type: 'bill' | 'subscription';
}

export interface ForecastDayPoint {
  day: number;
  label: string;
  date?: string;
  formattedDate?: string;
  baselineBalance: number;
  simulatedBalance?: number;
  baselineSpendable: number;
  simulatedSpendable?: number;
  savingsFloor: number;
  commitmentFloor: number;
  dueBillsCost?: number;
  dueSubscriptionsCost?: number;
  scheduledCharges?: number;
  obligations?: ForecastObligationItem[];
  isWarning?: boolean;
  warningMessage?: string;
}

export interface ForecastWarning {
  day: number;
  date: string;
  projectedBalance: number;
  requiredAmount: number;
  message: string;
  obligationName: string;
}

export interface ForecastScenarioOptions {
  windowDays?: 7 | 14 | 30;
  daysWindow?: 7 | 14 | 30;
  plannedDailyAllowance?: number;
  hypotheticalExpense?: {
    amount: number;
    title: string;
    day: number;
    category?: string;
  };
}

export interface ForecastProjection {
  days: ForecastDayPoint[];
  baselineEndBalance: number;
  simulatedEndBalance?: number;
  lowestProjectedBalance: number;
  lowestBalanceDay: number;
  totalExpectedBills: number;
  totalExpectedSubscriptions: number;
  totalExpectedFutureCharges: number;
  warnings: ForecastWarning[];
  assumptions: {
    dailyBurnBaseline: number;
    dailyBurnSimulated?: number;
    totalDays: number;
    unpaidCommitments: number;
    totalSubscriptionsCost?: number;
  };
  scenario?: ForecastScenarioOptions;
}

export interface FinancialRunway {
  runwayDays: number; // 0 to daysRemaining (e.g. 30)
  status: 'solvent' | 'caution' | 'critical';
  statusLabel: string;
  dailyBurnRate: number; // current pace per day
  daysUntilTrough: number;
  troughBalance: number;
  runwayPercent: number; // 0 - 100%
  description: string;
}

export interface FinancialInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  metricLabel?: string;
  actionText?: string;
  actionTab?: 'decision-lab' | 'transactions' | 'goals' | 'forecast';
}

