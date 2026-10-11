import {
  FinancialState,
  Transaction,
  SavingsGoal,
  BillCommitment,
  Subscription,
} from '../types/finance';

export const STORAGE_KEY = 'paisapilot_financial_state_v1';

export const DEFAULT_DEMO_GOALS: SavingsGoal[] = [
  {
    id: 'goal-emergency-reserve',
    name: '30-Day Emergency Reserve',
    targetAmount: 2000,
    alreadySaved: 0,
    createdAt: '2026-10-11T00:00:00.000Z',
  },
];

export const DEFAULT_DEMO_BILLS: BillCommitment[] = [
  {
    id: 'bill-rent',
    title: 'House Rent & Maintenance',
    amount: 2200,
    dueDate: '2026-10-16',
    isPaid: false,
    category: 'Bills & Utilities',
  },
  {
    id: 'bill-wifi',
    title: 'Electricity & High-speed WiFi',
    amount: 800,
    dueDate: '2026-10-23',
    isPaid: false,
    category: 'Bills & Utilities',
  },
];

export const DEFAULT_DEMO_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-cloud-storage',
    name: 'Cloud Storage & Dev Tools',
    amount: 499,
    frequency: 'monthly',
    nextBillingDate: '2026-10-25',
    active: true,
    category: 'Shopping & Tech',
    notes: 'Essential productivity subscription',
  },
];

export const DEFAULT_DEMO_STATE: FinancialState = {
  startingBudget: 10000,
  daysRemaining: 30,
  unpaidCommitments: 3000, // 2200 + 800
  savingsGoal: 2000,
  alreadySaved: 0,
  transactions: [],
  goals: DEFAULT_DEMO_GOALS,
  bills: DEFAULT_DEMO_BILLS,
  subscriptions: DEFAULT_DEMO_SUBSCRIPTIONS,
};

/**
 * Validates whether an unknown value conforms to a valid Transaction object
 */
export function isValidTransaction(tx: unknown): tx is Transaction {
  if (!tx || typeof tx !== 'object') return false;
  const candidate = tx as Partial<Transaction>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.title === 'string' &&
    typeof candidate.amount === 'number' &&
    !isNaN(candidate.amount) &&
    isFinite(candidate.amount) &&
    candidate.amount >= 0 &&
    (candidate.type === 'income' || candidate.type === 'expense') &&
    typeof candidate.date === 'string'
  );
}

/**
 * Validates whether an unknown value conforms to a SavingsGoal
 */
export function isValidSavingsGoal(g: unknown): g is SavingsGoal {
  if (!g || typeof g !== 'object') return false;
  const candidate = g as Partial<SavingsGoal>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.targetAmount === 'number' &&
    !isNaN(candidate.targetAmount) &&
    isFinite(candidate.targetAmount) &&
    candidate.targetAmount > 0 &&
    typeof candidate.alreadySaved === 'number' &&
    !isNaN(candidate.alreadySaved) &&
    isFinite(candidate.alreadySaved) &&
    candidate.alreadySaved >= 0 &&
    (candidate.priority === undefined ||
      candidate.priority === 'high' ||
      candidate.priority === 'medium' ||
      candidate.priority === 'low') &&
    (typeof candidate.createdAt === 'undefined' || typeof candidate.createdAt === 'string')
  );
}

/**
 * Validates whether an unknown value conforms to a BillCommitment
 */
export function isValidBillCommitment(b: unknown): b is BillCommitment {
  if (!b || typeof b !== 'object') return false;
  const candidate = b as Partial<BillCommitment>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.title === 'string' &&
    candidate.title.trim().length > 0 &&
    typeof candidate.amount === 'number' &&
    !isNaN(candidate.amount) &&
    isFinite(candidate.amount) &&
    candidate.amount > 0 &&
    typeof candidate.dueDate === 'string' &&
    candidate.dueDate.trim().length > 0 &&
    typeof candidate.isPaid === 'boolean'
  );
}

/**
 * Validates whether an unknown value conforms to a Subscription
 */
export function isValidSubscription(s: unknown): s is Subscription {
  if (!s || typeof s !== 'object') return false;
  const candidate = s as Partial<Subscription>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.amount === 'number' &&
    !isNaN(candidate.amount) &&
    isFinite(candidate.amount) &&
    candidate.amount >= 0 &&
    (candidate.frequency === 'weekly' || candidate.frequency === 'monthly') &&
    typeof candidate.nextBillingDate === 'string' &&
    candidate.nextBillingDate.trim().length > 0 &&
    typeof candidate.active === 'boolean'
  );
}

/**
 * Validates whether an unknown value conforms to a valid FinancialState
 */
export function isValidFinancialState(data: unknown): data is FinancialState {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Partial<FinancialState>;

  const hasNumbers =
    typeof candidate.startingBudget === 'number' &&
    !isNaN(candidate.startingBudget) &&
    typeof candidate.daysRemaining === 'number' &&
    !isNaN(candidate.daysRemaining);

  if (!hasNumbers) return false;

  if (!Array.isArray(candidate.transactions) || !candidate.transactions.every(isValidTransaction)) {
    return false;
  }

  if (candidate.goals !== undefined) {
    if (!Array.isArray(candidate.goals) || !candidate.goals.every(isValidSavingsGoal)) {
      return false;
    }
  }

  if (candidate.bills !== undefined) {
    if (!Array.isArray(candidate.bills) || !candidate.bills.every(isValidBillCommitment)) {
      return false;
    }
  }

  if (candidate.subscriptions !== undefined) {
    if (!Array.isArray(candidate.subscriptions) || !candidate.subscriptions.every(isValidSubscription)) {
      return false;
    }
  }

  return true;
}

/**
 * Migrates old schema data (Phase 1/2) or unpopulated arrays to modern Phase 3 schema
 */
export function migrateFinancialState(data: unknown): FinancialState {
  if (!data || typeof data !== 'object') {
    return DEFAULT_DEMO_STATE;
  }

  const candidate = data as Partial<FinancialState>;

  const startingBudget =
    typeof candidate.startingBudget === 'number' && !isNaN(candidate.startingBudget)
      ? candidate.startingBudget
      : 10000;

  const daysRemaining =
    typeof candidate.daysRemaining === 'number' && !isNaN(candidate.daysRemaining)
      ? candidate.daysRemaining
      : 30;

  const validTransactions: Transaction[] = Array.isArray(candidate.transactions)
    ? candidate.transactions.filter(isValidTransaction)
    : [];

  // Migrate or preserve goals
  let goals: SavingsGoal[] = [];
  if (Array.isArray(candidate.goals) && candidate.goals.length > 0 && candidate.goals.every(isValidSavingsGoal)) {
    goals = candidate.goals;
  } else if (typeof candidate.savingsGoal === 'number' && candidate.savingsGoal > 0) {
    goals = [
      {
        id: 'goal-emergency-reserve',
        name: '30-Day Emergency Reserve',
        targetAmount: candidate.savingsGoal,
        alreadySaved: typeof candidate.alreadySaved === 'number' ? candidate.alreadySaved : 0,
        createdAt: new Date().toISOString(),
      },
    ];
  } else {
    goals = DEFAULT_DEMO_GOALS;
  }

  // Migrate or preserve bills
  let bills: BillCommitment[] = [];
  if (Array.isArray(candidate.bills) && candidate.bills.length > 0 && candidate.bills.every(isValidBillCommitment)) {
    bills = candidate.bills;
  } else {
    bills = DEFAULT_DEMO_BILLS;
  }

  // Migrate or preserve subscriptions
  let subscriptions: Subscription[] = [];
  if (Array.isArray(candidate.subscriptions) && candidate.subscriptions.every(isValidSubscription)) {
    subscriptions = candidate.subscriptions;
  } else {
    subscriptions = DEFAULT_DEMO_SUBSCRIPTIONS;
  }

  // Aggregate derived sources
  const unpaidCommitments = bills
    .filter((b) => !b.isPaid)
    .reduce((sum, b) => sum + b.amount, 0);

  const savingsGoal = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const alreadySaved = goals.reduce((sum, g) => sum + g.alreadySaved, 0);

  return {
    startingBudget,
    daysRemaining,
    unpaidCommitments: Math.round(unpaidCommitments * 100) / 100,
    savingsGoal: Math.round(savingsGoal * 100) / 100,
    alreadySaved: Math.round(alreadySaved * 100) / 100,
    transactions: validTransactions,
    goals,
    bills,
    subscriptions,
  };
}

/**
 * Loads the financial state from localStorage with safe migration & fallback recovery
 */
export function loadFinancialState(): FinancialState {
  if (typeof window === 'undefined') {
    return DEFAULT_DEMO_STATE;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_DEMO_STATE;
    }

    const parsed = JSON.parse(raw);
    const migrated = migrateFinancialState(parsed);
    return migrated;
  } catch (err) {
    console.error('[PaisaPilot] Failed to parse or migrate stored state. Recovering to default demo state.', err);
    return DEFAULT_DEMO_STATE;
  }
}

/**
 * Saves the source financial state to localStorage.
 * Only saves source properties; never stores transient simulation data.
 */
export function saveFinancialState(state: FinancialState): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const sanitized: FinancialState = {
      startingBudget: Number(state.startingBudget),
      daysRemaining: Number(state.daysRemaining),
      unpaidCommitments: Number(state.unpaidCommitments),
      savingsGoal: Number(state.savingsGoal),
      alreadySaved: Number(state.alreadySaved),
      transactions: state.transactions.map((tx) => ({
        id: String(tx.id),
        title: String(tx.title),
        category: String(tx.category),
        amount: Number(tx.amount),
        date: String(tx.date),
        type: tx.type === 'income' ? 'income' : 'expense',
        notes: tx.notes ? String(tx.notes) : undefined,
      })),
      goals: state.goals.map((g) => ({
        id: String(g.id),
        name: String(g.name),
        targetAmount: Number(g.targetAmount),
        alreadySaved: Number(g.alreadySaved),
        targetDate: g.targetDate ? String(g.targetDate) : undefined,
        createdAt: String(g.createdAt),
      })),
      bills: state.bills.map((b) => ({
        id: String(b.id),
        title: String(b.title),
        amount: Number(b.amount),
        dueDate: String(b.dueDate),
        isPaid: Boolean(b.isPaid),
        category: b.category ? String(b.category) : undefined,
        paidAt: b.paidAt ? String(b.paidAt) : undefined,
      })),
      subscriptions: state.subscriptions.map((s) => ({
        id: String(s.id),
        name: String(s.name),
        amount: Number(s.amount),
        frequency: s.frequency === 'weekly' ? 'weekly' : 'monthly',
        nextBillingDate: String(s.nextBillingDate),
        active: Boolean(s.active),
        category: String(s.category),
        notes: s.notes ? String(s.notes) : undefined,
      })),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    return true;
  } catch (err) {
    console.error('[PaisaPilot] Failed to save financial state to localStorage:', err);
    return false;
  }
}

/**
 * Clears stored data and returns fresh demo state
 */
export function resetFinancialState(): FinancialState {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('[PaisaPilot] Error resetting localStorage:', e);
    }
  }
  return {
    ...DEFAULT_DEMO_STATE,
    transactions: [],
    goals: [...DEFAULT_DEMO_GOALS],
    bills: [...DEFAULT_DEMO_BILLS],
    subscriptions: [...DEFAULT_DEMO_SUBSCRIPTIONS],
  };
}
