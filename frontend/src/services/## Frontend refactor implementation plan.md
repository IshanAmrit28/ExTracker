## Frontend refactor implementation plan

Objective: move from a mostly flat, component-heavy frontend to feature-oriented modules without changing user-visible behavior or backend APIs.

### Phase 0 — Baseline and guardrails

1. Record the current behavior of each screen:
   - Authentication
   - Dashboard
   - Daily Tracker and reimbursements
   - Income Tracker
   - Monthly/weekly/yearly analysis
   - Settings and reports

2. Add the minimum quality checks:
   - Ensure `npm run build` remains the required regression check.
   - Configure or repair frontend linting if it is currently incomplete.
   - Add unit tests for pure finance calculations before moving them.

3. Do not alter existing API endpoints or transaction payload shapes during this refactor.

Acceptance: current production build succeeds before and after every phase.

### Phase 1 — Target folder structure

Create a feature-based structure while retaining the current entry point:

```text
src/
  app/
    App.jsx
    AppShell.jsx
    routes.jsx
  features/
    auth/
    dashboard/
    transactions/
    income/
    settings/
    reports/
    analytics/
  components/
    ui/
    layout/
  hooks/
  services/
  utils/
  styles/
```

Migration rule:

- A feature owns its screen, subcomponents, hooks, and feature-only styles.
- `components/ui` contains only reusable visual primitives.
- `services` owns requests; screens must not call Axios directly.
- `utils` contains pure reusable calculations and formatting.

Acceptance: imports continue resolving and the app UI remains unchanged.

### Phase 2 — Shared finance domain layer

Extract repeated business logic into small, tested modules:

```text
src/utils/finance/
  transactions.js     // expense/income/split-share classification
  dates.js            // month/week/day keys and range helpers
  budget.js           // current/adjusted daily budget calculations
  summaries.js        // totals, balances, category and bank grouping
  currency.js         // money display and rounding
```

Examples of shared functions:

- `getExpenseShare(transaction)`
- `getTransactionsForMonth(transactions, monthKey)`
- `getBankBalances(transactions)`
- `calculateSmartBudget(transactions, monthlyLimit, date)`
- `formatCurrency(amount, currency)`

Acceptance: Dashboard, trackers, analysis screens, and reports derive the same totals as before. Unit tests cover split expenses, reimbursements, month boundaries, and midnight daily-budget rollover.

### Phase 3 — Shared UI and layout primitives

Extract duplicated visual patterns into reusable components:

```text
src/components/ui/
  PageHeader.jsx
  StatCard.jsx
  EmptyState.jsx
  MoneyAmount.jsx
  LoadingScreen.jsx
  SelectField.jsx
  ConfirmButton.jsx

src/components/layout/
  Sidebar.jsx
  MobileHeader.jsx
  AppShell.jsx
```

Replace repeated inline structures only when they are truly shared. Keep feature-specific layout inside the feature.

Acceptance: no visual or interaction change; repeated card/table/loading markup is reduced.

### Phase 4 — Transactions feature

The Daily Tracker split is already underway. Complete it as the reference feature:

```text
src/features/transactions/
  DailyTrackerPage.jsx
  components/
    TransactionForm.jsx
    TransactionTable.jsx
    TransactionRow.jsx
    SplitExpensePanel.jsx
    SmartBudgetWidget.jsx
  hooks/
    useTransactionFilters.js
    useReimbursementForm.js
  utils/
    transactionFilters.js
```

Move request actions into the existing shared API service. Extract filter state, reimbursement form state, and totals into hooks.

Acceptance:

- Add, delete, filter, split, and reimbursement flows work unchanged.
- Smart daily budget updates correctly at midnight.
- `DailyTrackerPage` coordinates components instead of containing business logic.

### Phase 5 — Income and settings features

Refactor the next two largest screens:

```text
src/features/income/
  IncomeTrackerPage.jsx
  components/IncomeForm.jsx
  components/IncomeTable.jsx
  hooks/useIncomeForm.js

src/features/settings/
  SettingsPage.jsx
  components/BudgetSettingsForm.jsx
  components/BankManager.jsx
  components/CategoryManager.jsx
  components/ReportActions.jsx
  hooks/useSettingsForm.js
```

Acceptance:

- Income creation/deletion and monthly filtering stay identical.
- Settings save behavior, bank services, categories, and manual reports continue working.
- Each page is primarily composition; form state and side effects live in hooks.

### Phase 6 — Dashboard, reports, and analytics

Modularize data-heavy display screens:

```text
src/features/dashboard/
  DashboardPage.jsx
  components/SummaryCards.jsx
  components/BankBalances.jsx
  components/SpendingCharts.jsx

src/features/reports/
  ReportsPage.jsx
  components/ReportList.jsx
  components/ReportPreview.jsx
  components/ReportActions.jsx

src/features/analytics/
  MonthlyAnalysisPage.jsx
  WeeklyAnalysisPage.jsx
  YearlyCalendarPage.jsx
```

All charts and summaries should consume the shared finance utilities, preventing totals from drifting across screens.

Acceptance: values agree between Dashboard, reports, and analysis for the same period.

### Phase 7 — Styling cleanup

1. Keep global colors, typography, and layout tokens in `index.css`.
2. Move page-specific styles next to their respective feature.
3. Replace large inline style objects only where it improves readability.
4. Preserve the existing dark theme and responsive behavior.

Acceptance: no CSS regressions at desktop and mobile widths.

### Phase 8 — Final regression and documentation

1. Run build and lint.
2. Test each core user journey manually:
   - Register/login/logout
   - Create regular expense
   - Create split expense and reimbursement
   - Create/delete income
   - Update settings
   - Generate/email/download reports
   - Confirm dashboard and analysis totals
3. Update README with the new frontend architecture.

Implementation order:

1. Baseline and tests
2. Shared finance utilities
3. Transactions feature
4. Income feature
5. Settings feature
6. Reports/dashboard/analytics
7. Shared UI and styling polish
8. Full regression pass

This sequence keeps the highest-risk financial calculations centralized first, then moves one feature at a time with a build check after every step.
