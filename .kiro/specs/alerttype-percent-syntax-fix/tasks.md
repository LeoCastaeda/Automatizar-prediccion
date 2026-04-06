# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Invalid TypeScript Identifier Compilation Error
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case - enum value containing `%` character in TypeScript context
  - Test that TypeScript compilation fails when referencing `AlertType.CHANGE_%` (from Fault Condition in design)
  - The test should verify: compilation error TS1109 occurs at priceChecker.ts line 29
  - Run test on UNFIXED code (with `CHANGE_%` in schema.prisma)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: specific error message, file location, and invalid identifier
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Alert Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for PRICE alert type (non-buggy case where enum value is valid)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - PRICE alert creation works correctly
    - PRICE alert retrieval returns expected results
    - PRICE alert triggering logic functions as expected
    - Database queries with AlertType.PRICE succeed
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Fix for invalid TypeScript identifier in AlertType enum

  - [x] 3.1 Rename enum value in schema.prisma
    - Open schema.prisma file
    - Locate AlertType enum (around line 42)
    - Change `CHANGE_%` to `CHANGE_PERCENT`
    - Maintain the comment explaining the purpose
    - _Bug_Condition: isBugCondition(input) where input.name CONTAINS '%' AND input.context == 'TypeScript'_
    - _Expected_Behavior: Enum value uses only valid TypeScript identifier characters (letters, digits, underscores, dollar signs)_
    - _Preservation: PRICE alert functionality must remain unchanged_
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

  - [x] 3.2 Update TypeScript references
    - Update priceChecker.ts line 29: change `AlertType.CHANGE_%` to `AlertType.CHANGE_PERCENT`
    - Search for any other files referencing `CHANGE_%` and update them
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Regenerate Prisma client
    - Run `npx prisma generate` to regenerate TypeScript client with valid identifier
    - Verify generated code no longer contains `%` character in enum
    - _Requirements: 2.1, 2.2_

  - [x] 3.4 Create database migration
    - Run `npx prisma migrate dev --name rename-change-percent-enum` to create migration
    - Review migration SQL to ensure it renames enum value correctly
    - Apply migration to update existing database records
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Valid TypeScript Identifier
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed - TypeScript compiles without TS1109 error)
    - _Requirements: 2.1, 2.2_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Alert Functionality
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in PRICE alert functionality)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full TypeScript compilation: `npx tsc --noEmit`
  - Verify no TS1109 errors remain
  - Verify IDE shows no syntax errors in priceChecker.ts
  - Ensure all preservation tests pass
  - Ensure bug condition test now passes
  - Ask the user if questions arise
