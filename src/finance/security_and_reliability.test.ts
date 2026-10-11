import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeAmount,
  sanitizeDate,
  MAX_SAFE_FINANCIAL_AMOUNT,
} from '../utils/sanitization';
import {
  calculateBalance,
  calculateFinancialMetrics,
  filterTransactions,
  formatINR,
} from './calculations';
import { FinancialState, Transaction } from '../types/finance';

describe('Security & Data Sanitization (utils/sanitization.ts)', () => {
  describe('sanitizeString', () => {
    it('strips non-printable ASCII control characters', () => {
      const malicious = 'Rent\u0000\u0007\u001F Payment';
      expect(sanitizeString(malicious)).toBe('Rent Payment');
    });

    it('trims leading and trailing whitespace', () => {
      expect(sanitizeString('   Internet Bill   ')).toBe('Internet Bill');
    });

    it('clamps strings to maxLength without memory blowup', () => {
      const longInput = 'A'.repeat(500);
      const sanitized = sanitizeString(longInput, 100);
      expect(sanitized.length).toBe(100);
      expect(sanitized).toBe('A'.repeat(100));
    });

    it('handles non-string types safely without throwing', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(12345)).toBe('');
      expect(sanitizeString({})).toBe('');
    });
  });

  describe('sanitizeAmount', () => {
    it('accepts valid positive numbers and rounds to 2 decimals', () => {
      const resRoundUp = sanitizeAmount(1499.996);
      expect(resRoundUp.isValid).toBe(true);
      expect(resRoundUp.amount).toBe(1500);

      const resRoundDown = sanitizeAmount(1499.994);
      expect(resRoundDown.isValid).toBe(true);
      expect(resRoundDown.amount).toBe(1499.99);
    });

    it('parses valid numeric strings', () => {
      const res = sanitizeAmount(' 2500.50 ');
      expect(res.isValid).toBe(true);
      expect(res.amount).toBe(2500.5);
    });

    it('rejects zero and negative amounts', () => {
      expect(sanitizeAmount(0).isValid).toBe(false);
      expect(sanitizeAmount(-100).isValid).toBe(false);
      expect(sanitizeAmount('-50').isValid).toBe(false);
    });

    it('rejects NaN and non-finite inputs', () => {
      expect(sanitizeAmount(NaN).isValid).toBe(false);
      expect(sanitizeAmount(Infinity).isValid).toBe(false);
      expect(sanitizeAmount(-Infinity).isValid).toBe(false);
      expect(sanitizeAmount('not-a-number').isValid).toBe(false);
      expect(sanitizeAmount('').isValid).toBe(false);
    });

    it('rejects extreme amounts exceeding safe ceiling (₹1,00,00,000)', () => {
      const extreme = MAX_SAFE_FINANCIAL_AMOUNT + 1;
      const res = sanitizeAmount(extreme);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('cannot exceed');
    });
  });

  describe('sanitizeDate', () => {
    it('normalizes valid ISO and calendar date strings', () => {
      const iso = sanitizeDate('2026-10-15');
      expect(iso).toContain('2026-10-15');
    });

    it('falls back safely when given an invalid date string', () => {
      const fallback = '2026-10-11T00:00:00.000Z';
      expect(sanitizeDate('invalid-date', fallback)).toBe(fallback);
      expect(sanitizeDate('', fallback)).toBe(fallback);
      expect(sanitizeDate(null, fallback)).toBe(fallback);
    });
  });
});

describe('Defensive Resilience in Calculations (calculations.ts)', () => {
  it('calculateBalance is immune to NaN and negative transaction amounts', () => {
    const corruptedTxs: Transaction[] = [
      { id: '1', title: 'Salary', category: 'Income', amount: 5000, date: '2026-10-01', type: 'income' },
      // Corrupted amounts
      { id: '2', title: 'Bad Expense', category: 'Misc', amount: NaN, date: '2026-10-02', type: 'expense' },
      { id: '3', title: 'Negative Inflow', category: 'Misc', amount: -200, date: '2026-10-03', type: 'income' },
      { id: '4', title: 'Normal Expense', category: 'Food', amount: 1200, date: '2026-10-04', type: 'expense' },
    ];

    const result = calculateBalance(10000, corruptedTxs);
    // 10000 + 5000 (valid income) - 1200 (valid expense) = 13800
    expect(result.balance).toBe(13800);
    expect(result.totalIncome).toBe(5000);
    expect(result.totalExpenses).toBe(1200);
    expect(isNaN(result.balance)).toBe(false);
  });

  it('calculateFinancialMetrics computes unpaid commitments from modern bills array', () => {
    const state: FinancialState = {
      startingBudget: 10000,
      daysRemaining: 30,
      unpaidCommitments: 3000, // Stale legacy scalar
      savingsGoal: 2000,
      alreadySaved: 0,
      transactions: [],
      goals: [{ id: 'g1', name: 'Reserve', targetAmount: 2000, alreadySaved: 0 }],
      bills: [{ id: 'b1', title: 'WiFi', amount: 800, dueDate: '2026-10-20', isPaid: false }],
      subscriptions: [],
    };

    const metrics = calculateFinancialMetrics(state);
    // Should compute 800 unpaid commitments from bills array (overriding stale 3000 scalar)
    // Spendable: 10000 - 800 = 9200; Allowance: (9200 - 2000) / 30 = 240
    expect(metrics.spendableAfterCommitments).toBe(9200);
    expect(metrics.dailyAllowance).toBe(240);
  });

  it('filterTransactions handles undefined tx fields and regex special chars without throwing', () => {
    const malformedTxs = [
      { id: '1', title: 'Coffee (Starbucks)', category: 'Food', amount: 350, date: '2026-10-01', type: 'expense' } as Transaction,
      { id: '2', title: undefined as unknown as string, category: null as unknown as string, amount: 200, date: '2026-10-02', type: 'expense' } as Transaction,
    ];

    // Search query with regex chars: "(Starbucks)"
    const searchWithRegex = filterTransactions(malformedTxs, { searchQuery: '(Starbucks)' });
    expect(searchWithRegex.length).toBe(1);
    expect(searchWithRegex[0].id).toBe('1');

    // Search matching nothing against the malformed entry
    const searchOther = filterTransactions(malformedTxs, { searchQuery: 'random' });
    expect(searchOther.length).toBe(0);
  });

  it('formatINR handles edge cases (NaN, Infinity, negative zero, Indian groupings) without breaking', () => {
    expect(formatINR(NaN)).toBe('₹0');
    expect(formatINR(Infinity)).toBe('₹0');
    expect(formatINR(-Infinity)).toBe('₹0');
    expect(formatINR(-0)).toBe('₹0');

    // Indian numbering: ₹1,50,000 and ₹1,00,00,000
    expect(formatINR(150000)).toBe('₹1,50,000');
    expect(formatINR(10000000)).toBe('₹1,00,00,000');
    expect(formatINR(-4500, { includeSign: true })).toBe('−₹4,500');
    expect(formatINR(4500, { includeSign: true })).toBe('+₹4,500');
  });
});
