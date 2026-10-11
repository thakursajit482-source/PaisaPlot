# PaisaPilot 🧭

> **Premium personal-finance decision simulator for managing ₹10,000 over 30 days.**  
> Preview prospective purchases with zero risk before committing real capital.

---

## ⚡ What is PaisaPilot?

**PaisaPilot** is designed for the modern individual managing a tight monthly budget. Instead of waiting until month-end to realize you overspent on weekend dining, PaisaPilot's signature **What-If Decision Lab** lets you test-drive prospective purchases before making them.

It calculates the mathematical ripple effects of every purchase across:
1. **Total Cash Balance**
2. **Spendable Cash after Unpaid Commitments** (preserves ₹3,000 locked for rent/bills without double-counting)
3. **Daily Discretionary Allowance** (recalculated over remaining days)
4. **Savings Goal Feasibility** (protects your ₹2,000 cushion)
5. **Composite Financial Health Score & Risk Level**

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite 6
- **Language**: TypeScript 5 (Strict mode, zero `any`)
- **Styling**: Tailwind CSS 3.4 (Custom dark fintech palette: Charcoal/Navy surfaces, Neon-Lime accents, Violet highlights)
- **Icons**: Lucide React
- **Testing**: Vitest 2.1
- **Persistence**: `localStorage` with automated validation schema & safe recovery fallback

---

## 📐 Core Financial Model & Calculation Rules

All metrics are computed via pure, deterministic functions located in `src/finance/calculations.ts` using a single source of truth (`FinancialState`):

- **Current Balance**:
  $$\text{Balance} = \text{Starting Budget} + \sum \text{Income} - \sum \text{Expenses}$$
  *(Seed: ₹10,000)*

- **Spendable After Commitments**:
  $$\text{Spendable} = \text{Balance} - \text{Unpaid Commitments}$$
  *(Seed: ₹10,000 − ₹3,000 = ₹7,000. Commitments are never deducted twice)*

- **Remaining Savings Target**:
  $$\text{Remaining Target} = \max(0, \text{Savings Goal} - \text{Already Saved})$$
  *(Seed: ₹2,000)*

- **Daily Discretionary Allowance**:
  $$\text{Daily Allowance} = \frac{\max(0, \text{Spendable} - \text{Remaining Target})}{\text{Days Remaining}}$$
  *(Returns 0 if no days remain. Seed: $\max(0, 7000 - 2000) / 30 = \text{₹}166.67/\text{day}$)*

- **Savings Progress**:
  $$\text{Progress \%} = \min\left(100, \frac{\text{Already Saved}}{\text{Savings Goal}} \times 100\right)$$
  *(Safe handling when goal is 0)*

- **Risk Levels**:
  - `critical`: Spendable < 0 (breaches locked commitments)
  - `high_risk`: Spendable < savings target OR daily allowance < ₹50/day
  - `caution`: Daily allowance between ₹50 and ₹150/day
  - `safe`: Daily allowance ≥ ₹150/day and savings target protected

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- npm (v9+)

### Installation
```bash
npm install
```

### Development Server
Run the local development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Unit Tests
Execute the Vitest suite verifying all core calculation rules and simulation behavior:
```bash
npm test
```

### Production Build
Compile TypeScript and bundle optimized static assets:
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## 🧪 Project Structure

```
PaisaPlot/
├── src/
│   ├── types/
│   │   └── finance.ts              # Strict TypeScript definitions & category taxonomies
│   ├── finance/
│   │   ├── calculations.ts         # Pure calculations, search/filter, and formatINR
│   │   ├── calculations.test.ts    # 28 Vitest tests covering Phase 1 & 2 requirements
│   │   └── storage.ts              # LocalStorage persistence & runtime schema validation
│   ├── context/
│   │   └── FinanceContext.tsx       # Centralized state provider with income/expense execution
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navbar.tsx          # Responsive navigation shell & status bar
│   │   ├── common/
│   │   │   ├── ResetModal.tsx      # Reset demo confirmation dialog
│   │   │   └── AddIncomeModal.tsx  # Accessible income inflow entry dialog
│   │   ├── decision/
│   │   │   ├── DecisionLab.tsx     # What-If simulator with live before/after grid
│   │   │   └── ConfirmationModal.tsx # Safe review & purchase execution modal
│   │   ├── overview/
│   │   │   └── OverviewView.tsx    # Upgraded 8-metric dashboard & recent transactions
│   │   ├── transactions/
│   │   │   └── TransactionsView.tsx # Ledger with search, category/type filter, & clear
│   │   ├── goals/
│   │   │   └── GoalsView.tsx       # Savings target tracking & Phase 3 roadmap
│   │   └── forecast/
│   │       └── ForecastView.tsx    # Runway trajectory milestones & Phase 4 roadmap
│   ├── App.tsx                     # Top-level shell and tab switcher
│   ├── main.tsx                    # React DOM entrypoint
│   └── index.css                   # Tailwind base, dark palette, accessible focus
├── index.html                      # App entry with typography preconnects
├── tailwind.config.js              # Charcoal/navy palette, neon-lime, violet
├── tsconfig.json                   # Strict TypeScript compiler options
└── vite.config.ts                  # Vite + React plugin configuration
```

---

## 🔒 Verification & Compliance
- **Zero fake AI claims or real bank mocks**: Pure deterministic financial mathematics.
- **Accessible keyboard support**: Escape-key modals, visible focus rings, aria roles.
- **Client-Side Privacy**: Data stays 100% inside your browser localStorage.
- **Test Suite**: 28 automated tests passing across core calculations, income entry, filtering, and storage.
