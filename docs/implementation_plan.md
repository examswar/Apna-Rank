# Implementation Plan: Diagnosis Screens & Mistake Notebook

This plan outlines the implementation for the Diagnosis and Mistake Notebook screens based strictly on the provided `App Flow Document`, `UI/UX Design Brief`, and `PRD`.

## Confirmations

### Screens Found in App Flow Document
I have located and reviewed the exact specs for the following screens in the App Flow Document:
1. **S-16: TEST IN PROGRESS** (`src/app/student/test/page.tsx` equivalent to test attempt)
2. **S-19: TEST RESULT OVERVIEW** (`src/app/student/result/page.tsx`)
3. **S-20: MISTAKE DNA DETAIL** (`src/app/student/diagnosis/page.tsx`)
4. **S-21: STRATEGY SCORE DETAIL** (`src/app/student/strategy/page.tsx`)
5. **S-22: CONFIDENCE CALIBRATION DETAIL** (Though you didn't explicitly ask for its page, I read it for context).
6. **S-23: QUESTION REVIEW**
7. **S-35: GALTI NOTEBOOK** (`src/app/student/notebook/page.tsx`)

### Mistake DNA Categories and Colors
Based on the `UI/UX Design Brief` and `PRD`, the 5 Mistake DNA categories and their exact UI colors are:
1. **Concept (`CONCEPT`)**: Background `#FEE2E2`, Text `#B91C1C`
2. **Calc Slip (`CALC_SLIP`)**: Background `#FFEDD5`, Text `#C2410C`
3. **Misread (`MISREAD`)**: Background `#FEF9C3`, Text `#92400E`
4. **Time (`TIME`)**: Background `#EDE9FE`, Text `#6D28D9`
5. **Guess (`GUESS`)**: Background `#F1F5F9`, Text `#475569`

## Proposed Changes

### 1. Test Attempt Screen
#### [NEW] `src/app/student/test/page.tsx`
- **Goal**: Implement **S-16: TEST IN PROGRESS**.
- **UI Elements**:
  - Sticky top bar with Grid Icon (left), Timer (center), and Submit Button (right).
  - Question Card (Question number, Text).
  - 4 Option buttons stacked (A, B, C, D).
  - Confidence tag row: `[Sure]` `[Unsure]` `[Guess]`.
  - Action row sticky bottom: `[Prev]` `[Flag]` `[Next]`.

### 2. Result Overview Screen
#### [NEW] `src/app/student/result/page.tsx`
- **Goal**: Implement **S-19: TEST RESULT OVERVIEW**.
- **UI Elements**:
  - Hero Score Card (Big score, percentage, time taken).
  - Mistake DNA Summary Card (Pie chart/bar breakdown of Concept, Calc Slip, Misread, Time, Guess).
  - Strategy Score Card (Knowledge Rank vs Strategy Rank).
  - Confidence Calibration Card.
  - "Aaj ka ek kaam" Card.
  - Action buttons to review questions, go to notebook, or return home.

### 3. Mistake DNA Detail Screen (The Differentiator)
#### [NEW] `src/app/student/diagnosis/page.tsx`
- **Goal**: Implement **S-20: MISTAKE DNA DETAIL**.
- **UI Elements**:
  - Header: "Mistake DNA Detail"
  - Filter tabs for the 5 categories.
  - List of wrong answers showing the question snippet, the user's wrong answer (Red X), the correct answer (Green Check), and the colored Mistake DNA badge.
  - Links to "See Explanation" and "Add to Notebook".

### 4. Strategy Score Screen
#### [NEW] `src/app/student/strategy/page.tsx`
- **Goal**: Implement **S-21: STRATEGY SCORE DETAIL**.
- **UI Elements**:
  - Two large side-by-side cards: Knowledge Rank ("Top X%") vs Strategy Rank ("Top Y%").
  - Warning alert if the gap is large (e.g., "Your knowledge is good, but your strategy is weak...").
  - Specific actionable issues (e.g., "You spend too much time on hard questions").

### 5. Mistake Notebook Screen
#### [NEW] `src/app/student/notebook/page.tsx`
- **Goal**: Implement **S-35: GALTI NOTEBOOK**.
- **UI Elements**:
  - Stats bar ("Total Mistakes", "To Review").
  - Filter chips for the Mistake DNA categories.
  - List of entry cards containing question snippet, Mistake DNA badge, date.
  - Buttons to "Review" or "Resolve".

## Open Questions
- Do you want me to proceed with building all 5 of these screens exactly as outlined above using English UI text (as requested)?
