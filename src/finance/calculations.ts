import {
  FinancialState,
  FinancialMetrics,
  PurchaseSimulationInput,
  SimulationResult,
  AffordabilityStatus,
  RiskLevel,
  Transaction,
  ForecastProjection,
  ForecastDayPoint,
  ForecastObligationItem,
  ForecastWarning,
  SavingsGoal,
  BillCommitment,
  Subscription,
  HealthScoreFactor,
  HealthScoreBreakdown,
  ForecastScenarioOptions,
  FinancialRunway,
  FinancialInsight,
} from '../types/finance';

/**
 * Calculates current balance:
 * Balance = starting budget + recorded income − recorded expenses
 */
export function calculateBalance(
  startingBudget: number,
  transactions: Transaction[]
): { balance: number; totalIncome: number; totalExpenses: number } {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of transactions) {
    const rawAmt = typeof tx.amount === 'number' && !isNaN(tx.amount) && isFinite(tx.amount)
      ? Math.max(0, tx.amount)
      : 0;

    if (tx.type === 'income') {
      totalIncome += rawAmt;
    } else if (tx.type === 'expense') {
      totalExpenses += rawAmt;
    }
  }

  const safeBudget = typeof startingBudget === 'number' && !isNaN(startingBudget) && isFinite(startingBudget)
    ? startingBudget
    : 10000;

  const balance = safeBudget + totalIncome - totalExpenses;
  return {
    balance: Math.round(balance * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
  };
}

/**
 * Spendable after commitments:
 * Spendable = balance − unpaid commitments
 * (Do not deduct unpaid commitments twice elsewhere)
 */
export function calculateSpendableAfterCommitments(
  balance: number,
  unpaidCommitments: number
): number {
  return Math.round((balance - unpaidCommitments) * 100) / 100;
}

/**
 * Remaining savings target:
 * Target = max(0, savings goal − already saved)
 */
export function calculateRemainingSavingsTarget(
  savingsGoal: number,
  alreadySaved: number
): number {
  return Math.max(0, Math.round((savingsGoal - alreadySaved) * 100) / 100);
}

/**
 * Daily allowance:
 * Daily allowance = max(0, spendable after commitments − remaining savings target) / days remaining
 * Return zero when no days remain (daysRemaining <= 0).
 */
export function calculateDailyAllowance(
  spendableAfterCommitments: number,
  remainingSavingsTarget: number,
  daysRemaining: number
): number {
  if (daysRemaining <= 0) {
    return 0;
  }
  const discretionaryFunds = Math.max(0, spendableAfterCommitments - remainingSavingsTarget);
  const allowance = discretionaryFunds / daysRemaining;
  return Math.round(allowance * 100) / 100;
}

/**
 * Savings progress:
 * saved / target, capped at 100%; handle a zero target safely
 */
export function calculateSavingsProgress(
  alreadySaved: number,
  savingsGoal: number
): number {
  if (savingsGoal <= 0) {
    return alreadySaved >= 0 ? 100 : 0;
  }
  const percentage = (alreadySaved / savingsGoal) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage * 10) / 10));
}

/**
 * Determine financial risk level based on shared state:
 * - 'critical': Spendable < 0 (balance does not cover unpaid commitments)
 * - 'high_risk': Spendable < remaining savings target (savings goal breached) OR daily allowance < ₹50
 * - 'caution': Daily allowance is between ₹50 and ₹150 (tight budget runway)
 * - 'safe': Daily allowance >= ₹150 and spendable covers target comfortably
 */
export function calculateRiskLevel(
  spendableAfterCommitments: number,
  remainingSavingsTarget: number,
  dailyAllowance: number
): { riskLevel: RiskLevel; riskLabel: string } {
  if (spendableAfterCommitments < 0) {
    return {
      riskLevel: 'critical',
      riskLabel: 'Critical Risk',
    };
  }

  if (spendableAfterCommitments < remainingSavingsTarget || dailyAllowance < 50) {
    return {
      riskLevel: 'high_risk',
      riskLabel: 'High Risk',
    };
  }

  if (dailyAllowance < 150) {
    return {
      riskLevel: 'caution',
      riskLabel: 'Moderate Risk',
    };
  }

  return {
    riskLevel: 'safe',
    riskLabel: 'Low Risk',
  };
}

/**
 * Comprehensive, transparent, explainable Financial Health Score breakdown (0 - 100).
 * Evaluates 4 deterministic factors totaling 100 points:
 * 1. Commitment Solvency & Cash Floor (35 pts)
 * 2. Cash Runway & Trough Safety (25 pts)
 * 3. Savings Goal Viability (20 pts)
 * 4. Daily Discretionary Pacing (20 pts)
 */
export function calculateHealthScoreBreakdown(
  balance: number,
  unpaidCommitments: number,
  spendableAfterCommitments: number,
  remainingSavingsTarget: number,
  dailyAllowance: number,
  projectedMinimumBalance?: number
): HealthScoreBreakdown {
  // 1. Commitment Solvency & Buffer (35 pts)
  let solvencyScore = 35;
  let solvencyStatus: 'excellent' | 'good' | 'caution' | 'critical' = 'excellent';
  let solvencyHeadline = '100% Commitment Coverage';
  let solvencyDesc = `Your balance of ${formatINR(balance)} fully covers ${formatINR(unpaidCommitments)} in unpaid bills.`;
  let solvencyGuidance = 'Maintain this baseline to protect essential shelter and utility commitments.';

  if (unpaidCommitments > 0) {
    if (balance < unpaidCommitments) {
      solvencyScore = Math.max(0, Math.round((balance / unpaidCommitments) * 35));
      solvencyStatus = 'critical';
      solvencyHeadline = 'Commitment Insolvency Risk';
      solvencyDesc = `Current balance of ${formatINR(balance)} does not cover ${formatINR(unpaidCommitments)} in essential commitments.`;
      solvencyGuidance = 'Priority: pause non-essential spending and secure an inflow before bill due dates.';
    } else if (spendableAfterCommitments < 1000) {
      solvencyScore = Math.round(25 + Math.min(10, (spendableAfterCommitments / 1000) * 10));
      solvencyStatus = 'caution';
      solvencyHeadline = 'Thin Commitment Buffer';
      solvencyDesc = `Bills are covered, but remaining spendable buffer (${formatINR(spendableAfterCommitments)}) is slim.`;
      solvencyGuidance = 'Avoid new fixed commitments until your post-bill buffer exceeds ₹1,000.';
    }
  }

  // 2. Cash Runway & Trough Safety (25 pts)
  const minBal = projectedMinimumBalance !== undefined
    ? projectedMinimumBalance
    : spendableAfterCommitments;

  let troughScore = 25;
  let troughStatus: 'excellent' | 'good' | 'caution' | 'critical' = 'excellent';
  let troughHeadline = 'Resilient Cash Runway';
  let troughDesc = `Projected minimum cash trough remains healthy at ${formatINR(Math.max(0, minBal))}.`;
  let troughGuidance = 'Scheduled bills and subscriptions do not create a bottleneck in the projection.';

  if (minBal < 0) {
    troughScore = 0;
    troughStatus = 'critical';
    troughHeadline = 'Negative Cash Trough Projected';
    troughDesc = `Forecast indicates a deficit trough (${formatINR(minBal)}) when upcoming charges come due.`;
    troughGuidance = 'Reschedule optional bills or pause active subscriptions to avoid a cash crunch.';
  } else if (minBal < 500) {
    troughScore = 12;
    troughStatus = 'caution';
    troughHeadline = 'Vulnerable Runway Trough';
    troughDesc = `Projected cash drops to ${formatINR(minBal)} at its lowest point.`;
    troughGuidance = 'Pace daily expenses conservatively to ensure the trough point stays comfortably above zero.';
  } else if (minBal < 1500) {
    troughScore = 19;
    troughStatus = 'good';
    troughHeadline = 'Moderate Runway Buffer';
    troughDesc = `Projected cash floor of ${formatINR(minBal)} provides adequate margin.`;
    troughGuidance = 'Keep daily spending near your allowance to preserve this trough cushion.';
  }

  // 3. Savings Goal Viability (20 pts)
  let savingsScore = 20;
  let savingsStatus: 'excellent' | 'good' | 'caution' | 'critical' = 'excellent';
  let savingsHeadline = 'Savings Target Achievable';
  let savingsDesc = remainingSavingsTarget > 0
    ? `Spendable cash covers your ${formatINR(remainingSavingsTarget)} target without shortfall.`
    : 'All savings targets are fully funded or satisfied.';
  let savingsGuidance = 'Consider contributing spendable surpluses to your high-priority savings goals.';

  if (remainingSavingsTarget > 0) {
    if (spendableAfterCommitments < remainingSavingsTarget) {
      const ratio = Math.max(0, spendableAfterCommitments) / remainingSavingsTarget;
      savingsScore = Math.max(0, Math.round(ratio * 20));
      savingsStatus = ratio < 0.5 ? 'critical' : 'caution';
      savingsHeadline = 'Savings Target Strained';
      savingsDesc = `Available spendable cash (${formatINR(spendableAfterCommitments)}) is insufficient to meet the ${formatINR(remainingSavingsTarget)} target.`;
      savingsGuidance = 'Temporarily lower non-essential spending to rebuild savings viability.';
    }
  }

  // 4. Daily Discretionary Pacing (20 pts)
  const benchmarkAllowance = 166.67;
  const runwayRatio = Math.min(1, Math.max(0, dailyAllowance / benchmarkAllowance));
  let runwayScore = Math.round(runwayRatio * 20);
  let runwayStatus: 'excellent' | 'good' | 'caution' | 'critical' = 'excellent';
  let runwayHeadline = 'Comfortable Daily Runway';
  let runwayDesc = `Discretionary allowance of ${formatINR(dailyAllowance, { decimals: 2 })}/day meets benchmark pace.`;
  let runwayGuidance = 'Maintain this daily spending rhythm over the remaining days.';

  if (dailyAllowance < 25) {
    runwayStatus = 'critical';
    runwayHeadline = 'Constrained Daily Runway';
    runwayDesc = `Allowance of ${formatINR(dailyAllowance, { decimals: 2 })}/day provides very little discretionary room.`;
    runwayGuidance = 'Delay any discretionary purchases until new income arrives.';
  } else if (dailyAllowance < 75) {
    runwayStatus = 'caution';
    runwayHeadline = 'Tight Discretionary Runway';
    runwayDesc = `Allowance of ${formatINR(dailyAllowance, { decimals: 2 })}/day requires strict pacing.`;
    runwayGuidance = 'Cap daily purchases to essentials to prevent cutting into savings.';
  } else if (dailyAllowance < 150) {
    runwayStatus = 'good';
    runwayHeadline = 'Paced Discretionary Allowance';
    runwayDesc = `Allowance of ${formatINR(dailyAllowance, { decimals: 2 })}/day allows measured daily spend.`;
    runwayGuidance = 'Track small daily outflows to stay on pace.';
  }

  const totalScore = Math.min(100, Math.max(0, solvencyScore + troughScore + savingsScore + runwayScore));

  let riskLevel: RiskLevel = 'safe';
  let riskLabel = 'Low Risk';

  if (spendableAfterCommitments < 0 || (projectedMinimumBalance !== undefined && projectedMinimumBalance < 0)) {
    riskLevel = 'critical';
    riskLabel = 'Critical Risk';
  } else if (spendableAfterCommitments < remainingSavingsTarget || dailyAllowance < 50 || totalScore < 50) {
    riskLevel = 'high_risk';
    riskLabel = 'High Risk';
  } else if (dailyAllowance < 150 || totalScore < 75) {
    riskLevel = 'caution';
    riskLabel = 'Moderate Risk';
  } else {
    riskLevel = 'safe';
    riskLabel = 'Low Risk';
  }

  const factors: HealthScoreFactor[] = [
    {
      id: 'solvency',
      name: 'Commitment Solvency & Buffer',
      score: solvencyScore,
      maxScore: 35,
      weightPercent: 35,
      status: solvencyStatus,
      headline: solvencyHeadline,
      description: solvencyDesc,
      guidance: solvencyGuidance,
    },
    {
      id: 'trough',
      name: 'Cash Runway & Trough Safety',
      score: troughScore,
      maxScore: 25,
      weightPercent: 25,
      status: troughStatus,
      headline: troughHeadline,
      description: troughDesc,
      guidance: troughGuidance,
    },
    {
      id: 'savings',
      name: 'Savings Goal Viability',
      score: savingsScore,
      maxScore: 20,
      weightPercent: 20,
      status: savingsStatus,
      headline: savingsHeadline,
      description: savingsDesc,
      guidance: savingsGuidance,
    },
    {
      id: 'runway',
      name: 'Daily Discretionary Pacing',
      score: runwayScore,
      maxScore: 20,
      weightPercent: 20,
      status: runwayStatus,
      headline: runwayHeadline,
      description: runwayDesc,
      guidance: runwayGuidance,
    },
  ];

  const actionableGuidance = factors
    .filter((f) => f.status !== 'excellent')
    .map((f) => f.guidance);

  if (actionableGuidance.length === 0) {
    actionableGuidance.push('All core metrics are within safe boundaries. Continue your current paced daily allowance.');
  }

  const disclaimer = 'Educational Decision Simulator: This health score is a deterministic mathematical simulation designed to help you pace a 30-day budget sandbox. It is not a credit score, credit rating, or certified financial advice.';

  return {
    totalScore,
    riskLevel,
    riskLabel,
    factors,
    actionableGuidance,
    disclaimer,
  };
}

/**
 * Calculates a composite Financial Health Score (0 - 100)
 */
export function calculateHealthScore(
  balance: number,
  unpaidCommitments: number,
  spendableAfterCommitments: number,
  remainingSavingsTarget: number,
  dailyAllowance: number,
  projectedMinimumBalance?: number
): number {
  return calculateHealthScoreBreakdown(
    balance,
    unpaidCommitments,
    spendableAfterCommitments,
    remainingSavingsTarget,
    dailyAllowance,
    projectedMinimumBalance
  ).totalScore;
}

/**
 * Computes all derived financial metrics for a given state
 */
export function calculateFinancialMetrics(state: FinancialState): FinancialMetrics {
  const { balance, totalIncome, totalExpenses } = calculateBalance(
    state.startingBudget,
    state.transactions
  );

  // If modern bills array is present, compute unpaid commitments from unpaid bills
  const unpaidCommitments = Array.isArray(state.bills) && state.bills.length > 0
    ? calculateTotalUnpaidBills(state.bills)
    : (state.unpaidCommitments ?? 0);

  // If modern goals array is present, compute goals totals
  const { savingsGoal, alreadySaved } = Array.isArray(state.goals) && state.goals.length > 0
    ? calculateGoalsTotals(state.goals)
    : { savingsGoal: state.savingsGoal ?? 0, alreadySaved: state.alreadySaved ?? 0 };

  const spendableAfterCommitments = calculateSpendableAfterCommitments(
    balance,
    unpaidCommitments
  );

  const remainingSavingsTarget = calculateRemainingSavingsTarget(
    savingsGoal,
    alreadySaved
  );

  const dailyAllowance = calculateDailyAllowance(
    spendableAfterCommitments,
    remainingSavingsTarget,
    state.daysRemaining
  );

  const savingsProgressPercent = calculateSavingsProgress(
    alreadySaved,
    savingsGoal
  );

  const savingsFeasible = spendableAfterCommitments >= remainingSavingsTarget;
  const savingsShortfall = savingsFeasible
    ? 0
    : Math.round((remainingSavingsTarget - Math.max(0, spendableAfterCommitments)) * 100) / 100;

  const healthBreakdown = calculateHealthScoreBreakdown(
    balance,
    unpaidCommitments,
    spendableAfterCommitments,
    remainingSavingsTarget,
    dailyAllowance
  );

  const { riskLevel, riskLabel, totalScore: healthScore } = healthBreakdown;

  const discretionaryRemaining = Math.max(0, spendableAfterCommitments - remainingSavingsTarget);

  return {
    balance,
    totalIncome,
    totalExpenses,
    spendableAfterCommitments,
    remainingSavingsTarget,
    dailyAllowance,
    savingsProgressPercent,
    savingsFeasible,
    savingsShortfall,
    riskLevel,
    riskLabel,
    healthScore,
    healthBreakdown,
    discretionaryRemaining,
  };
}


/**
 * Pure simulation function:
 * Simulates the effect of a prospective purchase without mutating source state.
 */
export function simulatePurchase(
  currentState: FinancialState,
  input: PurchaseSimulationInput
): SimulationResult {
  const purchaseAmount = Math.max(0, input.amount);

  // Current baseline metrics
  const currentMetrics = calculateFinancialMetrics(currentState);

  // Hypothetical state with prospective transaction
  const hypotheticalTransaction: Transaction = {
    id: 'hypothetical-simulation',
    title: input.title.trim() || 'Simulated Purchase',
    category: input.category || 'Other',
    amount: purchaseAmount,
    date: new Date().toISOString(),
    type: 'expense',
  };

  const simulatedState: FinancialState = {
    ...currentState,
    transactions: [...currentState.transactions, hypotheticalTransaction],
  };

  const simulatedMetrics = calculateFinancialMetrics(simulatedState);

  // Deltas (rounded to 2 decimal places to avoid floating point precision artifacts)
  const balanceDelta = Math.round((simulatedMetrics.balance - currentMetrics.balance) * 100) / 100;
  const spendableDelta = Math.round((simulatedMetrics.spendableAfterCommitments - currentMetrics.spendableAfterCommitments) * 100) / 100;
  const dailyAllowanceDelta = Math.round((simulatedMetrics.dailyAllowance - currentMetrics.dailyAllowance) * 100) / 100;
  const dailyAllowancePercentChange =
    currentMetrics.dailyAllowance > 0
      ? Math.round(((simulatedMetrics.dailyAllowance - currentMetrics.dailyAllowance) / currentMetrics.dailyAllowance) * 1000) / 10
      : 0;
  const healthScoreDelta = Math.round((simulatedMetrics.healthScore - currentMetrics.healthScore) * 100) / 100;
  const savingsShortfall = Math.round(simulatedMetrics.savingsShortfall * 100) / 100;

  // Affordability classification
  let affordabilityStatus: AffordabilityStatus = 'affordable';
  let isAffordable = true;

  if (purchaseAmount > currentMetrics.balance) {
    affordabilityStatus = 'exceeds_balance';
    isAffordable = false;
  } else if (simulatedMetrics.spendableAfterCommitments < 0) {
    affordabilityStatus = 'impairs_commitments';
    isAffordable = false;
  } else if (!simulatedMetrics.savingsFeasible) {
    affordabilityStatus = 'strains_savings';
    isAffordable = true; // technically user has cash, but sacrifices savings goal
  } else {
    affordabilityStatus = 'affordable';
    isAffordable = true;
  }

  // Human-readable impact analysis explanation
  const impactAnalysis = generateImpactExplanation(
    purchaseAmount,
    input.title,
    currentMetrics,
    simulatedMetrics,
    affordabilityStatus,
    currentState.daysRemaining
  );

  return {
    input: {
      ...input,
      amount: purchaseAmount,
    },
    currentMetrics,
    simulatedMetrics,
    deltas: {
      balance: balanceDelta,
      spendable: spendableDelta,
      dailyAllowance: dailyAllowanceDelta,
      dailyAllowancePercentChange,
      healthScoreDelta,
      savingsShortfall,
    },
    isAffordable,
    affordabilityStatus,
    impactAnalysis,
  };
}

function generateImpactExplanation(
  amount: number,
  title: string,
  current: FinancialMetrics,
  simulated: FinancialMetrics,
  status: AffordabilityStatus,
  daysRemaining: number
): {
  severity: 'neutral' | 'warning' | 'danger';
  headline: string;
  description: string;
  runwayImpactText: string;
  goalImpactText: string;
} {
  const displayTitle = title.trim() || 'This purchase';
  const allowanceDrop = Math.abs(simulated.dailyAllowance - current.dailyAllowance);
  const formattedAmount = `₹${amount.toLocaleString('en-IN')}`;

  if (status === 'exceeds_balance') {
    return {
      severity: 'danger',
      headline: `Exceeds Total Balance (${formattedAmount})`,
      description: `${displayTitle} costs more than your entire available balance of ₹${current.balance.toLocaleString('en-IN')}. This transaction cannot be funded.`,
      runwayImpactText: 'Runway drops to 0 immediately due to insufficient total balance.',
      goalImpactText: 'Completely eliminates your savings target buffer.',
    };
  }

  if (status === 'impairs_commitments') {
    return {
      severity: 'danger',
      headline: `Impairs Essential Commitments`,
      description: `Spending ${formattedAmount} breaches your locked commitments. You would enter a ₹${Math.abs(simulated.spendableAfterCommitments).toLocaleString('en-IN')} deficit for upcoming bills/rent.`,
      runwayImpactText: `Daily discretionary allowance drops to ₹0/day for all ${daysRemaining} remaining days.`,
      goalImpactText: `Savings goal is 100% frozen; deficit of ₹${simulated.savingsShortfall.toLocaleString('en-IN')} created.`,
    };
  }

  if (status === 'strains_savings') {
    return {
      severity: 'warning',
      headline: `Depletes Savings Target by ₹${simulated.savingsShortfall.toLocaleString('en-IN')}`,
      description: `${displayTitle} preserves your essential commitments but eats into your ₹${current.remainingSavingsTarget.toLocaleString('en-IN')} savings goal. You will fall short by ₹${simulated.savingsShortfall.toLocaleString('en-IN')}.`,
      runwayImpactText: `Discretionary daily allowance drops to ₹${simulated.dailyAllowance.toFixed(0)}/day (reduced by ₹${allowanceDrop.toFixed(0)}/day).`,
      goalImpactText: `Savings feasibility compromised: you will only reach ₹${(current.remainingSavingsTarget - simulated.savingsShortfall).toLocaleString('en-IN')} of your ₹${current.remainingSavingsTarget.toLocaleString('en-IN')} target.`,
    };
  }

  // Affordable
  const dropPercent = Math.abs(Math.round(((current.dailyAllowance - simulated.dailyAllowance) / (current.dailyAllowance || 1)) * 100));
  return {
    severity: 'neutral',
    headline: `Affordable — Reduces Daily Allowance by ${dropPercent}%`,
    description: `${displayTitle} fits within your safe discretionary budget. Both your ₹${current.remainingSavingsTarget.toLocaleString('en-IN')} savings target and unpaid commitments remain 100% protected.`,
    runwayImpactText: `Daily runway drops from ₹${current.dailyAllowance.toFixed(0)}/day to ₹${simulated.dailyAllowance.toFixed(0)}/day (−₹${allowanceDrop.toFixed(0)}/day) over the remaining ${daysRemaining} days.`,
    goalImpactText: `Your ₹${current.remainingSavingsTarget.toLocaleString('en-IN')} savings goal remains fully achievable with zero shortfall.`,
  };
}

/**
 * Pure helper to calculate total unpaid bills
 */
export function calculateTotalUnpaidBills(bills?: BillCommitment[]): number {
  if (!bills || bills.length === 0) return 0;
  const unpaid = bills
    .filter((b) => !b.isPaid)
    .reduce((sum, b) => sum + b.amount, 0);
  return Math.round(unpaid * 100) / 100;
}

/**
 * Pure helper to calculate individual goal progress
 */
export function calculateGoalProgress(goal: SavingsGoal): {
  progressPercent: number;
  remainingTarget: number;
  isCompleted: boolean;
} {
  const target = Math.max(0, goal.targetAmount);
  const saved = Math.max(0, goal.alreadySaved);
  const remainingTarget = Math.max(0, target - saved);
  const progressPercent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 100;
  return {
    progressPercent,
    remainingTarget,
    isCompleted: saved >= target && target > 0,
  };
}

/**
 * Pure helper to calculate savings goals totals
 */
export function calculateGoalsTotals(goals?: SavingsGoal[]): {
  savingsGoal: number;
  totalTarget: number;
  alreadySaved: number;
  totalAlreadySaved: number;
  remainingSavingsTarget: number;
  totalRemainingTarget: number;
  progressPercent: number;
  overallProgressPercent: number;
} {
  if (!goals || goals.length === 0) {
    return {
      savingsGoal: 0,
      totalTarget: 0,
      alreadySaved: 0,
      totalAlreadySaved: 0,
      remainingSavingsTarget: 0,
      totalRemainingTarget: 0,
      progressPercent: 0,
      overallProgressPercent: 0,
    };
  }
  let totalTarget = 0;
  let totalSaved = 0;
  for (const g of goals) {
    totalTarget += g.targetAmount;
    totalSaved += g.alreadySaved;
  }
  const remainingSavingsTarget = Math.max(0, totalTarget - totalSaved);
  const progressPercent = totalTarget > 0
    ? Math.min(100, Math.max(0, Math.round((totalSaved / totalTarget) * 100)))
    : 100;

  return {
    savingsGoal: Math.round(totalTarget * 100) / 100,
    totalTarget: Math.round(totalTarget * 100) / 100,
    alreadySaved: Math.round(totalSaved * 100) / 100,
    totalAlreadySaved: Math.round(totalSaved * 100) / 100,
    remainingSavingsTarget: Math.round(remainingSavingsTarget * 100) / 100,
    totalRemainingTarget: Math.round(remainingSavingsTarget * 100) / 100,
    progressPercent,
    overallProgressPercent: progressPercent,
  };
}

/**
 * Checks whether an actual expense transaction already covers a scheduled subscription occurrence.
 */
export function isSubscriptionPaidForDate(
  subscription: Subscription,
  scheduledDate: Date,
  transactions?: Transaction[]
): boolean {
  if (!transactions || transactions.length === 0) return false;
  const schedTime = scheduledDate.getTime();
  const toleranceMs = subscription.frequency === 'weekly'
    ? 3 * 24 * 60 * 60 * 1000
    : 15 * 24 * 60 * 60 * 1000;

  return transactions.some((tx) => {
    if (tx.type !== 'expense') return false;
    const txTime = new Date(tx.date).getTime();
    if (isNaN(txTime)) return false;
    if (Math.abs(txTime - schedTime) > toleranceMs) return false;

    // Match by direct ID tag in notes/id, or matching title with amount tolerance
    const matchesId = tx.id.includes(subscription.id) || (tx.notes && tx.notes.includes(subscription.id));
    const matchesTitle = tx.title.toLowerCase().includes(subscription.name.toLowerCase());
    const matchesAmount = Math.abs(tx.amount - subscription.amount) < 1;

    return Boolean(matchesId || (matchesTitle && matchesAmount));
  });
}

/**
 * Calculates occurrences and costs of a subscription within a day window.
 * Skips dates that are already represented by an actual recorded expense transaction.
 */
export function calculateSubscriptionOccurrencesInWindow(
  subscription: Subscription,
  startDate: Date,
  daysWindow: number,
  existingTransactions?: Transaction[]
): { dates: Date[]; occurrences: number; totalCost: number } {
  if (!subscription.active || subscription.amount <= 0) {
    return { dates: [], occurrences: 0, totalCost: 0 };
  }

  const occurrences: Date[] = [];
  const nextDate = new Date(subscription.nextBillingDate);
  if (isNaN(nextDate.getTime())) {
    return { dates: [], occurrences: 0, totalCost: 0 };
  }

  const windowEnd = new Date(startDate.getTime() + daysWindow * 24 * 60 * 60 * 1000);
  let cur = new Date(nextDate.getTime());

  // Loop forward to collect occurrences within the window
  const maxIterations = 20; // safety ceiling
  let iter = 0;

  while (cur <= windowEnd && iter < maxIterations) {
    iter++;
    if (cur >= startDate && cur <= windowEnd) {
      if (!isSubscriptionPaidForDate(subscription, cur, existingTransactions)) {
        occurrences.push(new Date(cur.getTime()));
      }
    }

    if (subscription.frequency === 'weekly') {
      cur = new Date(cur.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      // Monthly: add ~30 days
      const nextMonth = new Date(cur.getTime());
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      cur = nextMonth;
    }
  }

  return {
    dates: occurrences,
    occurrences: occurrences.length,
    totalCost: Math.round(occurrences.length * subscription.amount * 100) / 100,
  };
}

/**
 * Calculates total 30-day projected cost for all active subscriptions
 */
export function calculate30DaySubscriptionCost(
  subscriptions?: Subscription[],
  referenceDate?: string | Date,
  existingTransactions?: Transaction[]
): number {
  if (!subscriptions || subscriptions.length === 0) return 0;
  const refDate = referenceDate
    ? typeof referenceDate === 'string'
      ? new Date(referenceDate)
      : referenceDate
    : new Date();
  let total = 0;
  for (const sub of subscriptions) {
    const { totalCost } = calculateSubscriptionOccurrencesInWindow(sub, refDate, 30, existingTransactions);
    total += totalCost;
  }
  return Math.round(total * 100) / 100;
}

/**
 * Interconnected 30-day forecast:
 * Calculates day-by-day cash flow combining balance, unpaid bills by due date,
 * active subscriptions by billing date, and paced discretionary allowance.
 * Supports interactive scenario overrides (window: 7/14/30 days, planned allowance, hypothetical purchase).
 */
export function generateForecast(
  state: FinancialState,
  simulatedExpenseOrScenario?: number | ForecastScenarioOptions,
  referenceDate?: string | Date
): ForecastProjection {
  const currentMetrics = calculateFinancialMetrics(state);

  let scenario: ForecastScenarioOptions | undefined;
  let simulatedExpense: number | undefined;

  if (typeof simulatedExpenseOrScenario === 'number') {
    simulatedExpense = simulatedExpenseOrScenario;
  } else if (simulatedExpenseOrScenario && typeof simulatedExpenseOrScenario === 'object') {
    scenario = simulatedExpenseOrScenario;
  }

  const effectiveWindow = scenario?.daysWindow ?? scenario?.windowDays ?? (state.daysRemaining > 0 ? state.daysRemaining : 30);
  const totalDays = Math.max(1, effectiveWindow);
  const refDate = referenceDate
    ? typeof referenceDate === 'string'
      ? new Date(referenceDate)
      : referenceDate
    : new Date();

  const dailyBurnBaseline = currentMetrics.dailyAllowance;
  const unpaidCommitmentsTotal = currentMetrics.balance - currentMetrics.spendableAfterCommitments;
  const savingsFloor = unpaidCommitmentsTotal + currentMetrics.remainingSavingsTarget;
  const commitmentFloor = unpaidCommitmentsTotal;

  // Prepare scheduled obligations by relative day
  const obligationsByDay: Map<number, ForecastObligationItem[]> = new Map();
  let totalExpectedBills = 0;
  let totalExpectedSubscriptions = 0;

  // 1. Map unpaid bills by relative day
  if (Array.isArray(state.bills)) {
    for (const bill of state.bills) {
      if (!bill.isPaid) {
        totalExpectedBills += bill.amount;
        const bDate = new Date(bill.dueDate);
        let dueDay = 0;
        if (!isNaN(bDate.getTime())) {
          const diffMs = bDate.getTime() - refDate.getTime();
          dueDay = Math.max(0, Math.min(totalDays, Math.round(diffMs / (1000 * 60 * 60 * 24))));
        }
        if (dueDay <= totalDays) {
          const list = obligationsByDay.get(dueDay) || [];
          list.push({
            id: bill.id,
            name: bill.title,
            amount: bill.amount,
            day: dueDay,
            date: bill.dueDate,
            type: 'bill',
          });
          obligationsByDay.set(dueDay, list);
        }
      }
    }
  } else {
    totalExpectedBills = state.unpaidCommitments;
  }

  // 2. Map active subscriptions by relative billing day (deduplicated against existing transactions)
  if (Array.isArray(state.subscriptions)) {
    for (const sub of state.subscriptions) {
      if (sub.active) {
        const { dates, totalCost } = calculateSubscriptionOccurrencesInWindow(
          sub,
          refDate,
          totalDays,
          state.transactions
        );
        totalExpectedSubscriptions += totalCost;
        for (const oDate of dates) {
          const diffMs = oDate.getTime() - refDate.getTime();
          const day = Math.max(0, Math.min(totalDays, Math.round(diffMs / (1000 * 60 * 60 * 24))));
          if (day <= totalDays) {
            const list = obligationsByDay.get(day) || [];
            list.push({
              id: `${sub.id}-${day}`,
              name: sub.name,
              amount: sub.amount,
              day,
              date: oDate.toISOString().split('T')[0],
              type: 'subscription',
            });
            obligationsByDay.set(day, list);
          }
        }
      }
    }
  }

  const totalExpectedFutureCharges = Math.round((totalExpectedBills + totalExpectedSubscriptions) * 100) / 100;

  // Scenario simulated metrics or planned daily burn
  let dailyBurnSimulated: number | undefined;
  let simulatedInitialBalance = currentMetrics.balance;

  if (typeof simulatedExpense === 'number' && simulatedExpense > 0) {
    const sim = simulatePurchase(state, {
      title: 'Forecast Simulation',
      category: 'Other',
      amount: simulatedExpense,
    });
    simulatedInitialBalance = sim.simulatedMetrics.balance;
    dailyBurnSimulated = sim.simulatedMetrics.dailyAllowance;
  } else if (scenario?.plannedDailyAllowance !== undefined) {
    dailyBurnSimulated = Math.max(0, scenario.plannedDailyAllowance);
  } else if (scenario?.hypotheticalExpense && scenario.hypotheticalExpense.amount > 0) {
    dailyBurnSimulated = dailyBurnBaseline;
  }

  const hasScenarioActive =
    dailyBurnSimulated !== undefined ||
    (scenario?.hypotheticalExpense && scenario.hypotheticalExpense.amount > 0) ||
    (typeof simulatedExpense === 'number' && simulatedExpense > 0);

  const days: ForecastDayPoint[] = [];
  const warnings: ForecastWarning[] = [];

  let lowestProjectedBalance = currentMetrics.balance;
  let lowestBalanceDay = 0;

  // Daily step intervals for clean charts
  const step = 1;

  let cumulativeObligationsCost = 0;
  let cumulativeBillsCost = 0;

  for (let d = 0; d <= totalDays; d += step) {
    const dayNumber = Math.min(d, totalDays);

    let dayObligationsCost = 0;
    let dayBillsCost = 0;
    let daySubsCost = 0;
    const currentMilestoneObligations: ForecastObligationItem[] = [];

    const items = obligationsByDay.get(dayNumber);
    if (items) {
      for (const item of items) {
        currentMilestoneObligations.push(item);
        dayObligationsCost += item.amount;
        if (item.type === 'bill') dayBillsCost += item.amount;
        else daySubsCost += item.amount;
      }
    }

    cumulativeObligationsCost += dayObligationsCost;
    cumulativeBillsCost += dayBillsCost;

    // Remaining unpaid commitments after bills due up to this day have been processed
    const remainingCommitmentsOnDay = Math.max(0, unpaidCommitmentsTotal - cumulativeBillsCost);

    // Discretionary burn up to this day
    const daySpentDiscretionary = dayNumber * dailyBurnBaseline;

    // Projected balance accounts for discretionary burn and scheduled obligations
    const projectedBalance = Math.round(
      Math.max(0, currentMetrics.balance - daySpentDiscretionary - cumulativeObligationsCost)
    );

    // Projected spendable after remaining commitments: NEVER double-deducts paid bills!
    const projectedSpendable = Math.round(projectedBalance - remainingCommitmentsOnDay);

    // Check lowest projected balance
    if (projectedBalance < lowestProjectedBalance) {
      lowestProjectedBalance = projectedBalance;
      lowestBalanceDay = dayNumber;
    }

    const mDate = new Date(refDate.getTime() + dayNumber * 24 * 60 * 60 * 1000);
    const dateStr = mDate.toISOString().split('T')[0];
    const formattedDate = mDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    // Check for insufficient funds warnings on due bills
    let isWarning = false;
    let warningMessage = '';

    if (dayBillsCost > 0 && projectedBalance < dayBillsCost) {
      isWarning = true;
      warningMessage = `Projected balance of ₹${projectedBalance.toLocaleString('en-IN')} on ${formattedDate} (Day ${dayNumber}) is insufficient to cover ₹${dayBillsCost.toLocaleString('en-IN')} in due bills.`;
      warnings.push({
        day: dayNumber,
        date: dateStr,
        projectedBalance,
        requiredAmount: dayBillsCost,
        message: warningMessage,
        obligationName: currentMilestoneObligations.map((o) => o.name).join(', '),
      });
    }

    // Check for negative runway
    if (projectedBalance <= 0 && dayNumber > 0 && !warnings.some((w) => w.message.includes('depletes to ₹0'))) {
      isWarning = true;
      warningMessage = `Projected cash runway depletes to ₹0 on ${formattedDate} (Day ${dayNumber}).`;
      warnings.push({
        day: dayNumber,
        date: dateStr,
        projectedBalance: 0,
        requiredAmount: 0,
        message: warningMessage,
        obligationName: 'Daily Discretionary Runway',
      });
    }

    if (scenario?.hypotheticalExpense && scenario.hypotheticalExpense.amount > 0 && dayNumber === scenario.hypotheticalExpense.day) {
      currentMilestoneObligations.push({
        id: `hypothetical-${dayNumber}`,
        name: `[Simulated] ${scenario.hypotheticalExpense.title || 'Hypothetical Purchase'}`,
        amount: scenario.hypotheticalExpense.amount,
        day: dayNumber,
        date: dateStr,
        type: 'bill',
      });
    }

    let simProjectedBalance: number | undefined;
    let simProjectedSpendable: number | undefined;

    if (hasScenarioActive) {
      const burnRate = dailyBurnSimulated !== undefined ? dailyBurnSimulated : dailyBurnBaseline;
      const simSpentDiscretionary = dayNumber * burnRate;
      const hypCost =
        scenario?.hypotheticalExpense &&
        scenario.hypotheticalExpense.amount > 0 &&
        dayNumber >= scenario.hypotheticalExpense.day
          ? scenario.hypotheticalExpense.amount
          : 0;
      simProjectedBalance = Math.round(
        Math.max(0, simulatedInitialBalance - simSpentDiscretionary - cumulativeObligationsCost - hypCost)
      );
      simProjectedSpendable = Math.round(simProjectedBalance - remainingCommitmentsOnDay);
    }

    days.push({
      day: dayNumber,
      label: dayNumber === 0 ? 'Today' : `Day ${dayNumber}`,
      date: dateStr,
      formattedDate,
      baselineBalance: projectedBalance,
      simulatedBalance: simProjectedBalance,
      baselineSpendable: projectedSpendable,
      simulatedSpendable: simProjectedSpendable,
      savingsFloor,
      commitmentFloor,
      dueBillsCost: dayBillsCost,
      dueSubscriptionsCost: daySubsCost,
      scheduledCharges: dayBillsCost + daySubsCost,
      obligations: currentMilestoneObligations,
      isWarning,
      warningMessage: isWarning ? warningMessage : undefined,
    });
  }

  const baselineEndBalance = days.length > 0 ? days[days.length - 1].baselineBalance : 0;
  const simulatedEndBalance =
    days.length > 0 && days[days.length - 1].simulatedBalance !== undefined
      ? days[days.length - 1].simulatedBalance
      : undefined;

  return {
    days,
    baselineEndBalance,
    simulatedEndBalance,
    lowestProjectedBalance,
    lowestBalanceDay,
    totalExpectedBills: Math.round(totalExpectedBills * 100) / 100,
    totalExpectedSubscriptions: Math.round(totalExpectedSubscriptions * 100) / 100,
    totalExpectedFutureCharges,
    warnings,
    assumptions: {
      dailyBurnBaseline,
      dailyBurnSimulated,
      totalDays,
      unpaidCommitments: unpaidCommitmentsTotal,
      totalSubscriptionsCost: Math.round(totalExpectedSubscriptions * 100) / 100,
    },
    scenario,
  };
}


/**
 * Standard Indian Rupee (INR) formatter using Indian numbering system (e.g. ₹10,000, ₹1,50,000).
 */
export function formatINR(
  amount: number,
  options: {
    includeSign?: boolean;
    decimals?: number;
    forceAbsolute?: boolean;
  } = {}
): string {
  if (isNaN(amount) || !isFinite(amount)) return '₹0';

  const { includeSign = false, decimals = 0, forceAbsolute = false } = options;

  const valueToFormat = forceAbsolute ? Math.abs(amount) : amount;
  const isNegative = amount < 0 && !forceAbsolute;
  const isPositive = amount > 0;

  const fixed = decimals > 0 ? Math.abs(valueToFormat).toFixed(decimals) : Math.round(Math.abs(valueToFormat)).toString();
  const [intPart, decPart] = fixed.split('.');

  const formattedInt = Number(intPart).toLocaleString('en-IN');
  const formattedNumber = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;

  let prefix = '';
  if (includeSign) {
    if (isNegative) prefix = '−';
    else if (isPositive) prefix = '+';
  } else if (isNegative) {
    prefix = '−';
  }

  return `${prefix}₹${formattedNumber}`;
}

export interface TransactionFilterOptions {
  searchQuery?: string;
  typeFilter?: 'all' | 'income' | 'expense';
  categoryFilter?: string;
}

/**
 * Pure function to filter transactions based on search text, type, and category.
 * Always returns transactions sorted newest first.
 */
export function filterTransactions(
  transactions: Transaction[],
  options: TransactionFilterOptions
): Transaction[] {
  const { searchQuery = '', typeFilter = 'all', categoryFilter = 'all' } = options;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return transactions
    .filter((tx) => {
      // 1. Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // 2. Category filter
      if (categoryFilter !== 'all' && categoryFilter !== '' && tx.category !== categoryFilter) {
        return false;
      }

      // 3. Search query matching title or category
      if (normalizedQuery) {
        const titleText = (tx.title || '').toLowerCase();
        const categoryText = (tx.category || '').toLowerCase();
        const matchesTitle = titleText.includes(normalizedQuery);
        const matchesCategory = categoryText.includes(normalizedQuery);
        if (!matchesTitle && !matchesCategory) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Extracts unique categories present in the given transactions list.
 */
export function getUniqueCategories(transactions: Transaction[]): string[] {
  const categoriesSet = new Set<string>();
  for (const tx of transactions) {
    if (tx.category && tx.category.trim()) {
      categoriesSet.add(tx.category.trim());
    }
  }
  return Array.from(categoriesSet).sort();
}

/**
  * Pure calculation: 30-day cash survival / runway indicator based on forecast and state.
  */
export function calculateFinancialRunway(
  state: FinancialState,
  metrics: FinancialMetrics,
  forecast: ForecastProjection
): FinancialRunway {
  const daysTotal = Math.max(1, state.daysRemaining);
  const lowestTrough = forecast.lowestProjectedBalance;
  const lowestDay = forecast.lowestBalanceDay;

  // Determine runway days: if balance dips <= 0, find first deficit day
  let runwayDays = daysTotal;
  if (lowestTrough <= 0) {
    const breachDay = forecast.days.find((d) => d.baselineBalance <= 0);
    runwayDays = breachDay ? Math.max(0, breachDay.day) : lowestDay;
  }

  const runwayPercent = Math.min(100, Math.max(0, Math.round((runwayDays / daysTotal) * 100)));
  const dailyBurnRate = forecast.assumptions?.dailyBurnBaseline ?? metrics.dailyAllowance;

  let status: 'solvent' | 'caution' | 'critical' = 'solvent';
  let statusLabel = `${daysTotal}-Day Solvent Runway`;

  if (lowestTrough <= 0) {
    status = 'critical';
    statusLabel = `Deficit Risk on Day ${runwayDays}`;
  } else if (metrics.spendableAfterCommitments < 1000 || lowestTrough < 1000) {
    status = 'caution';
    statusLabel = 'Tight Cash Runway';
  }

  const description =
    status === 'critical'
      ? `Projected balance drops to ₹${lowestTrough.toLocaleString('en-IN')} on Day ${lowestDay}. Defer non-essential expenses.`
      : status === 'caution'
      ? `Cash remains positive with a ₹${lowestTrough.toLocaleString('en-IN')} trough. Discretionary spending should be carefully paced.`
      : `Full ${daysTotal}-day horizon is solvent. ₹${state.unpaidCommitments.toLocaleString('en-IN')} in unpaid bills are fully protected.`;

  return {
    runwayDays,
    status,
    statusLabel,
    dailyBurnRate,
    daysUntilTrough: lowestDay,
    troughBalance: lowestTrough,
    runwayPercent,
    description,
  };
}

/**
 * Pure calculation: Deterministic, rule-based financial insights derived strictly from state and forecast.
 */
export function getDeterministicFinancialInsights(
  state: FinancialState,
  metrics: FinancialMetrics,
  _forecast: ForecastProjection
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  // Insight 1: Solvency & Commitments
  if (state.unpaidCommitments > 0) {
    if (metrics.spendableAfterCommitments >= 0) {
      insights.push({
        id: 'commitments-protected',
        type: 'success',
        title: 'Commitments Ring-Fenced',
        description: `₹${state.unpaidCommitments.toLocaleString('en-IN')} is safeguarded for upcoming bills without debt risk.`,
        metricLabel: `₹${metrics.spendableAfterCommitments.toLocaleString('en-IN')} spendable cash`,
        actionText: 'Review Bills',
        actionTab: 'forecast',
      });
    } else {
      insights.push({
        id: 'commitments-breached',
        type: 'critical',
        title: 'Commitments Exceed Balance',
        description: `Unpaid bills exceed current cash balance by ₹${Math.abs(metrics.spendableAfterCommitments).toLocaleString('en-IN')}. Record income or reduce goals.`,
        metricLabel: `Deficit: ₹${Math.abs(metrics.spendableAfterCommitments).toLocaleString('en-IN')}`,
        actionText: 'Record Inflow',
        actionTab: 'transactions',
      });
    }
  }

  // Insight 2: Daily Allowance Pacing
  if (metrics.dailyAllowance > 0) {
    insights.push({
      id: 'daily-pacing',
      type: metrics.dailyAllowance >= 150 ? 'info' : 'warning',
      title: 'Discretionary Burn Pace',
      description: `Spending up to ₹${metrics.dailyAllowance.toFixed(0)}/day preserves your full 30-day runway and savings cushion.`,
      metricLabel: `₹${metrics.dailyAllowance.toFixed(2)}/day`,
      actionText: 'Simulate Spend',
      actionTab: 'decision-lab',
    });
  }

  // Insight 3: Savings Goals Envelope
  const remainingSavings = metrics.remainingSavingsTarget;
  if (remainingSavings > 0) {
    if (metrics.savingsFeasible) {
      insights.push({
        id: 'savings-on-track',
        type: 'success',
        title: 'Savings Target Viable',
        description: `Current funds allow completing ₹${remainingSavings.toLocaleString('en-IN')} in savings without impairing daily essentials.`,
        metricLabel: `${metrics.savingsProgressPercent}% saved`,
        actionText: 'Fund Envelope',
        actionTab: 'goals',
      });
    } else {
      insights.push({
        id: 'savings-strained',
        type: 'warning',
        title: 'Savings Goal Under Pressure',
        description: `₹${metrics.savingsShortfall.toLocaleString('en-IN')} shortfall to achieve your targets. Avoid unvetted discretionary purchases.`,
        metricLabel: `Shortfall: ₹${metrics.savingsShortfall.toLocaleString('en-IN')}`,
        actionText: 'Optimize Goals',
        actionTab: 'goals',
      });
    }
  }

  return insights;
}

