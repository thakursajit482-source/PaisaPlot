import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  FinancialState,
  FinancialMetrics,
  PurchaseSimulationInput,
  SimulationResult,
  Transaction,
  SavingsGoal,
  BillCommitment,
  Subscription,
  SubscriptionFrequency,
} from '../types/finance';
import {
  calculateFinancialMetrics,
  simulatePurchase,
} from '../finance/calculations';
import {
  loadFinancialState,
  saveFinancialState,
  resetFinancialState as resetStorage,
} from '../finance/storage';
import {
  sanitizeString,
  sanitizeAmount,
  sanitizeDate,
} from '../utils/sanitization';

interface FinanceContextType {
  state: FinancialState;
  metrics: FinancialMetrics;
  previewPurchase: (input: PurchaseSimulationInput) => SimulationResult;
  addExpenseTransaction: (
    title: string,
    category: string,
    amount: number,
    notes?: string,
    date?: string
  ) => { success: boolean; error?: string };
  addIncomeTransaction: (
    title: string,
    category: string,
    amount: number,
    date?: string,
    notes?: string
  ) => { success: boolean; error?: string };
  recordUnexpectedExpense: (
    title: string,
    category: string,
    amount: number,
    date?: string,
    notes?: string
  ) => { success: boolean; error?: string };
  // Goals
  addGoal: (name: string, targetAmount: number, targetDate?: string) => { success: boolean; error?: string };
  editGoal: (id: string, name: string, targetAmount: number, targetDate?: string) => { success: boolean; error?: string };
  deleteGoal: (id: string) => { success: boolean; error?: string };
  contributeToGoal: (goalId: string, amount: number) => { success: boolean; error?: string };
  // Bills
  addBill: (title: string, amount: number, dueDate: string, category?: string) => { success: boolean; error?: string };
  editBill: (id: string, title: string, amount: number, dueDate: string, category?: string) => { success: boolean; error?: string };
  deleteBill: (id: string) => { success: boolean; error?: string };
  toggleBillPaid: (id: string) => { success: boolean; error?: string };
  // Subscriptions
  addSubscription: (
    name: string,
    amount: number,
    frequency: SubscriptionFrequency,
    nextBillingDate: string,
    category: string,
    notes?: string
  ) => { success: boolean; error?: string };
  editSubscription: (
    id: string,
    name: string,
    amount: number,
    frequency: SubscriptionFrequency,
    nextBillingDate: string,
    category: string,
    notes?: string
  ) => { success: boolean; error?: string };
  deleteSubscription: (id: string) => { success: boolean; error?: string };
  toggleSubscriptionActive: (id: string) => { success: boolean; error?: string };
  // General
  resetDemo: () => void;
  notification: string | null;
  clearNotification: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Financial source state initialized from validated localStorage or demo default
  const [state, setState] = useState<FinancialState>(() => loadFinancialState());
  const [notification, setNotification] = useState<string | null>(null);

  // Automatically save state on change to localStorage
  useEffect(() => {
    saveFinancialState(state);
  }, [state]);

  // Derived metrics are computed dynamically from single source of truth
  const metrics = useMemo(() => {
    return calculateFinancialMetrics(state);
  }, [state]);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Temporary simulation - does NOT mutate source state
  const previewPurchase = useCallback(
    (input: PurchaseSimulationInput): SimulationResult => {
      return simulatePurchase(state, input);
    },
    [state]
  );

  // Commit an expense transaction to actual financial state
  const addExpenseTransaction = useCallback(
    (
      title: string,
      category: string,
      amount: number,
      notes?: string,
      date?: string
    ): { success: boolean; error?: string } => {
      const sanitizedTitle = sanitizeString(title, 100);
      const amountValidation = sanitizeAmount(amount);

      if (!sanitizedTitle) {
        return { success: false, error: 'Please enter a purchase title.' };
      }

      if (!amountValidation.isValid) {
        return { success: false, error: amountValidation.error };
      }

      const sanitizedAmount = amountValidation.amount;

      // Check current solvency using shared calculations
      const current = calculateFinancialMetrics(state);

      if (sanitizedAmount > current.balance) {
        return {
          success: false,
          error: `Purchase of ₹${sanitizedAmount.toLocaleString('en-IN')} exceeds total balance of ₹${current.balance.toLocaleString('en-IN')}.`,
        };
      }

      const simulatedSpendable = current.balance - sanitizedAmount - state.unpaidCommitments;
      if (simulatedSpendable < 0) {
        return {
          success: false,
          error: `Purchase leaves ₹${Math.abs(simulatedSpendable).toLocaleString('en-IN')} deficit against your ₹${state.unpaidCommitments.toLocaleString('en-IN')} essential commitments. Unaffordable.`,
        };
      }

      const txDate = sanitizeDate(date);
      const sanitizedNotes = notes ? sanitizeString(notes, 300) : undefined;

      const newTransaction: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: sanitizedTitle,
        category: sanitizeString(category, 50) || 'Other',
        amount: sanitizedAmount,
        date: txDate,
        type: 'expense',
        notes: sanitizedNotes,
      };

      setState((prev) => ({
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
      }));

      setNotification(`Recorded ₹${sanitizedAmount.toLocaleString('en-IN')} for "${sanitizedTitle}". State updated.`);
      return { success: true };
    },
    [state]
  );

  // Record an unexpected expense quick-action
  const recordUnexpectedExpense = useCallback(
    (
      title: string,
      category: string,
      amount: number,
      date?: string,
      notes?: string
    ): { success: boolean; error?: string } => {
      const result = addExpenseTransaction(
        title,
        category || 'Healthcare',
        amount,
        notes ? `[Unexpected Expense] ${notes}` : '[Unexpected Expense]',
        date
      );
      if (result.success) {
        setNotification(`Recorded unexpected expense of ₹${Number(amount).toLocaleString('en-IN')} for "${sanitizeString(title, 100)}". Runway recalibrated.`);
      }
      return result;
    },
    [addExpenseTransaction]
  );

  // Commit an income transaction to actual financial state
  const addIncomeTransaction = useCallback(
    (
      title: string,
      category: string,
      amount: number,
      date?: string,
      notes?: string
    ): { success: boolean; error?: string } => {
      const sanitizedTitle = sanitizeString(title, 100);
      const sanitizedCategory = sanitizeString(category, 50);
      const amountValidation = sanitizeAmount(amount);

      if (!sanitizedTitle) {
        return { success: false, error: 'Please enter an income source/title.' };
      }

      if (!sanitizedCategory) {
        return { success: false, error: 'Please select or enter a valid category.' };
      }

      if (!amountValidation.isValid) {
        return { success: false, error: amountValidation.error };
      }

      const sanitizedAmount = amountValidation.amount;
      const isoDate = sanitizeDate(date);
      const sanitizedNotes = notes ? sanitizeString(notes, 300) : undefined;

      const newTransaction: Transaction = {
        id: `tx-inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: sanitizedTitle,
        category: sanitizedCategory,
        amount: sanitizedAmount,
        date: isoDate,
        type: 'income',
        notes: sanitizedNotes,
      };

      setState((prev) => ({
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
      }));

      setNotification(`Added income of ₹${sanitizedAmount.toLocaleString('en-IN')} from "${sanitizedTitle}". Balance and runway updated.`);
      return { success: true };
    },
    []
  );

  // ---------------- GOALS OPERATIONS ----------------
  const addGoal = useCallback(
    (name: string, targetAmount: number, targetDate?: string): { success: boolean; error?: string } => {
      const trimmed = sanitizeString(name, 80);
      const amountValidation = sanitizeAmount(targetAmount);

      if (!trimmed) {
        return { success: false, error: 'Goal name cannot be empty.' };
      }
      if (!amountValidation.isValid) {
        return { success: false, error: amountValidation.error };
      }
      if (targetDate && isNaN(new Date(targetDate).getTime())) {
        return { success: false, error: 'Please specify a valid target date.' };
      }

      const amount = amountValidation.amount;
      const targetDateFormatted = targetDate ? sanitizeDate(targetDate) : undefined;

      const newGoal: SavingsGoal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: trimmed,
        targetAmount: amount,
        alreadySaved: 0,
        targetDate: targetDateFormatted,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => {
        const nextGoals = [...prev.goals, newGoal];
        const nextGoalTarget = nextGoals.reduce((sum, g) => sum + g.targetAmount, 0);
        return {
          ...prev,
          goals: nextGoals,
          savingsGoal: nextGoalTarget,
        };
      });

      setNotification(`Created new savings goal: "${trimmed}" with target ₹${amount.toLocaleString('en-IN')}.`);
      return { success: true };
    },
    []
  );

  const editGoal = useCallback(
    (id: string, name: string, targetAmount: number, targetDate?: string): { success: boolean; error?: string } => {
      const trimmed = sanitizeString(name, 80);
      const amountValidation = sanitizeAmount(targetAmount);

      if (!trimmed) {
        return { success: false, error: 'Goal name cannot be empty.' };
      }
      if (!amountValidation.isValid) {
        return { success: false, error: amountValidation.error };
      }

      const amount = amountValidation.amount;
      const targetGoal = state.goals.find((g) => g.id === id);
      if (!targetGoal) {
        return { success: false, error: 'Goal not found.' };
      }
      if (amount < targetGoal.alreadySaved) {
        return {
          success: false,
          error: `Target amount cannot be less than already saved ₹${targetGoal.alreadySaved.toLocaleString('en-IN')}.`,
        };
      }

      const targetDateFormatted = targetDate ? sanitizeDate(targetDate) : undefined;

      setState((prev) => {
        const nextGoals = prev.goals.map((g) =>
          g.id === id
            ? { ...g, name: trimmed, targetAmount: amount, targetDate: targetDateFormatted }
            : g
        );
        const nextGoalTarget = nextGoals.reduce((sum, g) => sum + g.targetAmount, 0);
        return {
          ...prev,
          goals: nextGoals,
          savingsGoal: nextGoalTarget,
        };
      });

      setNotification(`Updated goal "${trimmed}".`);
      return { success: true };
    },
    [state.goals]
  );

  const deleteGoal = useCallback(
    (id: string): { success: boolean; error?: string } => {
      const existing = state.goals.find((g) => g.id === id);
      if (!existing) {
        return { success: false, error: 'Goal not found.' };
      }

      setState((prev) => {
        const nextGoals = prev.goals.filter((g) => g.id !== id);
        const nextGoalTarget = nextGoals.reduce((sum, g) => sum + g.targetAmount, 0);
        const nextSaved = nextGoals.reduce((sum, g) => sum + g.alreadySaved, 0);
        return {
          ...prev,
          goals: nextGoals,
          savingsGoal: nextGoalTarget,
          alreadySaved: nextSaved,
        };
      });

      setNotification(`Deleted savings goal "${existing.name}".`);
      return { success: true };
    },
    [state.goals]
  );

  const contributeToGoal = useCallback(
    (goalId: string, amount: number): { success: boolean; error?: string } => {
      const amountValidation = sanitizeAmount(amount);
      if (!amountValidation.isValid) {
        return { success: false, error: amountValidation.error };
      }

      const sanitizedAmount = amountValidation.amount;
      const goal = state.goals.find((g) => g.id === goalId);
      if (!goal) {
        return { success: false, error: 'Goal not found.' };
      }

      const remainingNeeded = goal.targetAmount - goal.alreadySaved;
      if (sanitizedAmount > remainingNeeded) {
        return {
          success: false,
          error: `Contribution of ₹${sanitizedAmount.toLocaleString('en-IN')} exceeds remaining goal target of ₹${remainingNeeded.toLocaleString('en-IN')}.`,
        };
      }

      // Check spendable cash availability
      const current = calculateFinancialMetrics(state);
      if (sanitizedAmount > current.spendableAfterCommitments) {
        return {
          success: false,
          error: `Contribution of ₹${sanitizedAmount.toLocaleString('en-IN')} exceeds available spendable cash of ₹${current.spendableAfterCommitments.toLocaleString('en-IN')}.`,
        };
      }

      setState((prev) => {
        const nextGoals = prev.goals.map((g) =>
          g.id === goalId ? { ...g, alreadySaved: Math.round((g.alreadySaved + sanitizedAmount) * 100) / 100 } : g
        );
        const nextSaved = nextGoals.reduce((sum, g) => sum + g.alreadySaved, 0);
        return {
          ...prev,
          goals: nextGoals,
          alreadySaved: nextSaved,
        };
      });

      setNotification(`Allocated ₹${sanitizedAmount.toLocaleString('en-IN')} to "${goal.name}". Target now ${Math.round(((goal.alreadySaved + sanitizedAmount) / goal.targetAmount) * 100)}% funded.`);
      return { success: true };
    },
    [state]
  );

  // ---------------- BILLS OPERATIONS ----------------
  const addBill = useCallback(
    (title: string, amount: number, dueDate: string, category?: string): { success: boolean; error?: string } => {
      const trimmed = sanitizeString(title, 100);
      const amountValidation = sanitizeAmount(amount);

      if (!trimmed) {
        return { success: false, error: 'Bill title cannot be empty.' };
      }
      if (!amountValidation.isValid) {
        return { success: false, error: amountValidation.error };
      }
      if (!dueDate || isNaN(new Date(dueDate).getTime())) {
        return { success: false, error: 'Please provide a valid due date.' };
      }

      const sanitizedAmount = amountValidation.amount;
      const dueDateSanitized = sanitizeDate(dueDate).split('T')[0];

      const newBill: BillCommitment = {
        id: `bill-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: trimmed,
        amount: sanitizedAmount,
        dueDate: dueDateSanitized,
        isPaid: false,
        category: sanitizeString(category, 50) || 'Bills & Utilities',
      };

      setState((prev) => {
        const nextBills = [...prev.bills, newBill];
        const nextUnpaid = nextBills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
        return {
          ...prev,
          bills: nextBills,
          unpaidCommitments: nextUnpaid,
        };
      });

      setNotification(`Added bill commitment: "${trimmed}" (₹${sanitizedAmount.toLocaleString('en-IN')}).`);
      return { success: true };
    },
    []
  );

  const editBill = useCallback(
    (id: string, title: string, amount: number, dueDate: string, category?: string): { success: boolean; error?: string } => {
      const trimmed = sanitizeString(title, 100);
      const amountValidation = sanitizeAmount(amount);

      if (!trimmed) {
        return { success: false, error: 'Bill title cannot be empty.' };
      }
      if (!amountValidation.isValid) {
        return { success: false, error: amountValidation.error };
      }
      if (!dueDate || isNaN(new Date(dueDate).getTime())) {
        return { success: false, error: 'Please provide a valid due date.' };
      }

      const sanitizedAmount = amountValidation.amount;
      const dueDateSanitized = sanitizeDate(dueDate).split('T')[0];

      setState((prev) => {
        const nextBills = prev.bills.map((b) =>
          b.id === id ? { ...b, title: trimmed, amount: sanitizedAmount, dueDate: dueDateSanitized, category: sanitizeString(category, 50) || b.category } : b
        );
        const nextUnpaid = nextBills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
        return {
          ...prev,
          bills: nextBills,
          unpaidCommitments: nextUnpaid,
        };
      });

      setNotification(`Updated bill "${trimmed}".`);
      return { success: true };
    },
    []
  );

  const deleteBill = useCallback(
    (id: string): { success: boolean; error?: string } => {
      const existing = state.bills.find((b) => b.id === id);
      if (!existing) {
        return { success: false, error: 'Bill not found.' };
      }

      setState((prev) => {
        const nextBills = prev.bills.filter((b) => b.id !== id);
        // Also remove any linked transaction if this bill was marked paid
        const nextTransactions = prev.transactions.filter((tx) => tx.id !== `tx-bill-paid-${id}`);
        const nextUnpaid = nextBills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
        return {
          ...prev,
          bills: nextBills,
          transactions: nextTransactions,
          unpaidCommitments: nextUnpaid,
        };
      });

      setNotification(`Deleted bill commitment "${existing.title}".`);
      return { success: true };
    },
    [state.bills]
  );

  const toggleBillPaid = useCallback(
    (id: string): { success: boolean; error?: string } => {
      const bill = state.bills.find((b) => b.id === id);
      if (!bill) {
        return { success: false, error: 'Bill not found.' };
      }

      if (!bill.isPaid) {
        // Mark as PAID:
        // Transition unpaid commitment into recorded actual expense
        // Spendable cash remains conserved (not double-deducted)
        const current = calculateFinancialMetrics(state);
        if (bill.amount > current.balance) {
          return {
            success: false,
            error: `Cannot pay bill: amount ₹${bill.amount.toLocaleString('en-IN')} exceeds current cash balance of ₹${current.balance.toLocaleString('en-IN')}.`,
          };
        }

        const paymentTx: Transaction = {
          id: `tx-bill-paid-${bill.id}`,
          title: `Bill Paid: ${bill.title}`,
          category: bill.category || 'Bills & Utilities',
          amount: bill.amount,
          date: new Date().toISOString(),
          type: 'expense',
          notes: `Reconciled payment for scheduled commitment: ${bill.title}`,
        };

        setState((prev) => {
          const nextBills = prev.bills.map((b) =>
            b.id === id ? { ...b, isPaid: true, paidAt: new Date().toISOString() } : b
          );
          const nextUnpaid = nextBills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
          return {
            ...prev,
            bills: nextBills,
            transactions: [paymentTx, ...prev.transactions],
            unpaidCommitments: nextUnpaid,
          };
        });

        setNotification(`Marked "${bill.title}" as PAID. Recorded ₹${bill.amount.toLocaleString('en-IN')} expense.`);
        return { success: true };
      } else {
        // Reopen as UNPAID:
        // Undo payment transaction and restore bill to unpaid commitments
        setState((prev) => {
          const nextBills = prev.bills.map((b) => (b.id === id ? { ...b, isPaid: false, paidAt: undefined } : b));
          const nextTransactions = prev.transactions.filter((tx) => tx.id !== `tx-bill-paid-${id}`);
          const nextUnpaid = nextBills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
          return {
            ...prev,
            bills: nextBills,
            transactions: nextTransactions,
            unpaidCommitments: nextUnpaid,
          };
        });

        setNotification(`Reopened bill "${bill.title}" as unpaid.`);
        return { success: true };
      }
    },
    [state]
  );

  // ---------------- SUBSCRIPTIONS OPERATIONS ----------------
  const addSubscription = useCallback(
    (
      name: string,
      amount: number,
      frequency: SubscriptionFrequency,
      nextBillingDate: string,
      category: string,
      notes?: string
    ): { success: boolean; error?: string } => {
      const trimmed = sanitizeString(name, 80);
      const amountValidation = sanitizeAmount(amount);

      if (!trimmed) {
        return { success: false, error: 'Subscription name cannot be empty.' };
      }
      if (!amountValidation.isValid) {
        return { success: false, error: amountValidation.error };
      }
      if (!nextBillingDate || isNaN(new Date(nextBillingDate).getTime())) {
        return { success: false, error: 'Please provide a valid next billing date.' };
      }

      const sanitizedAmount = amountValidation.amount;
      const billingDateSanitized = sanitizeDate(nextBillingDate).split('T')[0];
      const sanitizedNotes = notes ? sanitizeString(notes, 300) : undefined;

      const newSub: Subscription = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: trimmed,
        amount: sanitizedAmount,
        frequency,
        nextBillingDate: billingDateSanitized,
        active: true,
        category: sanitizeString(category, 50) || 'Entertainment',
        notes: sanitizedNotes,
      };

      setState((prev) => ({
        ...prev,
        subscriptions: [...prev.subscriptions, newSub],
      }));

      setNotification(`Added subscription: "${trimmed}" (₹${sanitizedAmount.toLocaleString('en-IN')}/${frequency}).`);
      return { success: true };
    },
    []
  );

  const editSubscription = useCallback(
    (
      id: string,
      name: string,
      amount: number,
      frequency: SubscriptionFrequency,
      nextBillingDate: string,
      category: string,
      notes?: string
    ): { success: boolean; error?: string } => {
      const trimmed = sanitizeString(name, 80);
      const amountValidation = sanitizeAmount(amount);

      if (!trimmed) {
        return { success: false, error: 'Subscription name cannot be empty.' };
      }
      if (!amountValidation.isValid) {
        return { success: false, error: amountValidation.error };
      }
      if (!nextBillingDate || isNaN(new Date(nextBillingDate).getTime())) {
        return { success: false, error: 'Please provide a valid next billing date.' };
      }

      const sanitizedAmount = amountValidation.amount;
      const billingDateSanitized = sanitizeDate(nextBillingDate).split('T')[0];
      const sanitizedNotes = notes ? sanitizeString(notes, 300) : undefined;

      setState((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.map((s) =>
          s.id === id
            ? {
                ...s,
                name: trimmed,
                amount: sanitizedAmount,
                frequency,
                nextBillingDate: billingDateSanitized,
                category: sanitizeString(category, 50) || s.category,
                notes: sanitizedNotes,
              }
            : s
        ),
      }));

      setNotification(`Updated subscription "${trimmed}".`);
      return { success: true };
    },
    []
  );

  const deleteSubscription = useCallback(
    (id: string): { success: boolean; error?: string } => {
      const existing = state.subscriptions.find((s) => s.id === id);
      if (!existing) {
        return { success: false, error: 'Subscription not found.' };
      }

      setState((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.filter((s) => s.id !== id),
      }));

      setNotification(`Deleted subscription "${existing.name}".`);
      return { success: true };
    },
    [state.subscriptions]
  );

  const toggleSubscriptionActive = useCallback(
    (id: string): { success: boolean; error?: string } => {
      const existing = state.subscriptions.find((s) => s.id === id);
      if (!existing) {
        return { success: false, error: 'Subscription not found.' };
      }

      const nextStatus = !existing.active;
      setState((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.map((s) => (s.id === id ? { ...s, active: nextStatus } : s)),
      }));

      setNotification(`${nextStatus ? 'Activated' : 'Paused'} subscription "${existing.name}".`);
      return { success: true };
    },
    [state.subscriptions]
  );

  // ---------------- GENERAL ----------------
  const resetDemo = useCallback(() => {
    const fresh = resetStorage();
    setState(fresh);
    setNotification('Demo reset to initial ₹10,000 / 30-day baseline with default goals and commitments.');
  }, []);

  const value = useMemo(
    () => ({
      state,
      metrics,
      previewPurchase,
      addExpenseTransaction,
      addIncomeTransaction,
      recordUnexpectedExpense,
      addGoal,
      editGoal,
      deleteGoal,
      contributeToGoal,
      addBill,
      editBill,
      deleteBill,
      toggleBillPaid,
      addSubscription,
      editSubscription,
      deleteSubscription,
      toggleSubscriptionActive,
      resetDemo,
      notification,
      clearNotification,
    }),
    [
      state,
      metrics,
      previewPurchase,
      addExpenseTransaction,
      addIncomeTransaction,
      recordUnexpectedExpense,
      addGoal,
      editGoal,
      deleteGoal,
      contributeToGoal,
      addBill,
      editBill,
      deleteBill,
      toggleBillPaid,
      addSubscription,
      editSubscription,
      deleteSubscription,
      toggleSubscriptionActive,
      resetDemo,
      notification,
      clearNotification,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export function useFinance(): FinanceContextType {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
