# Implementation Plan: Teacher & Institute Dashboards

Based strictly on the `App Flow Document` and your request, here is the plan to build the 9 new screens.

## Proposed Changes

### 1. Shared Layouts & Navigation
- **[NEW] `src/components/navigation/LeftSidebar.tsx`**: A responsive sidebar for Desktop (`>=1024px`). For mobile, we will use the existing `BottomTabBar` or a hamburger menu.
- **[NEW] `src/app/teacher/layout.tsx`**: Wrapper for all `/teacher/*` routes injecting the `LeftSidebar`.
- **[NEW] `src/app/institute/layout.tsx`**: Wrapper for all `/institute/*` routes injecting the `LeftSidebar`.

### 2. Teacher Screens (T-Series)
- **[NEW] `src/app/teacher/dashboard/page.tsx` (T-10)**: 
  - Stats row: Tests Published, Total Earnings, Total Buyers, Avg Rating.
  - Recent tests list with "View Analytics" and "Create New Test" CTA.
- **[NEW] `src/app/teacher/tests/page.tsx`**: 
  - Dedicated list of all tests authored by the teacher.
- **[NEW] `src/app/teacher/create-test/page.tsx` (T-11 to T-14B)**: 
  - A tabbed or multi-step wizard to capture: Details (T-11) → Questions (T-12) → Pricing (T-13) → Publish (T-14B).
- **[NEW] `src/app/teacher/earnings/page.tsx` (T-15)**: 
  - Balance cards, Payout Schedule, Payout history table, and Earnings breakdown showing the 60% teacher / 40% platform split.

### 3. Institute Screens (I-Series)
- **[NEW] `src/app/institute/dashboard/page.tsx` (I-10)**: 
  - Summary stats: Total Students, Active Batches, Dropout Risk, Tests Assigned.
  - Prominent Dropout Risk Alert banner.
  - List of Batch cards (Name, Exam, Student count, Top weak topic).
- **[NEW] `src/app/institute/batches/page.tsx` (I-20 context)**: 
  - Directory of all batches with a "Create Batch" modal/form.
- **[NEW] `src/app/institute/batch-detail/page.tsx` (I-21)**: 
  - Tabs: [Students] [Tests] [Heatmap] [Lesson Plan].
  - Students list with streak/last active data.
- **[NEW] `src/app/institute/heatmap/page.tsx` (I-22)**: 
  - Topic-level grid coloured by weakness (Red <40%, Yellow 40-70%, Green >70%).
- **[NEW] `src/app/institute/dropout-alerts/page.tsx` (I-40)**: 
  - List of students inactive for 5+ days with "Send SMS" and "View Profile" action buttons.

## Verification
- All UI text will be in English.
- Mock data will be generated to match the real schema structure (e.g., `mistakes`, `batches`, `earnings`).
- The UI will adhere to the desktop sidebar + mobile responsive layout defined in the UI/UX Brief.

## User Review Required
- I will combine the 4-step "Create Test" flow (T-11 to T-14B) into a single page using a state-driven step wizard for seamless UX. Is this acceptable, or do you prefer strict separate URLs (`/create/details`, `/create/questions`, etc.)?
