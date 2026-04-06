# AlertType Percent Syntax Fix - Bugfix Design

## Overview

The AlertType enum in schema.prisma contains an invalid TypeScript identifier `CHANGE_%` which causes a TypeScript compilation error (TS1109: Expression expected). The `%` character is not a valid character in TypeScript identifiers. This fix will rename the enum value to `CHANGE_PERCENT`, which is a valid identifier that maintains semantic clarity. The fix requires updating both the Prisma schema and the TypeScript code that references this enum value, followed by a database migration to update existing records.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when TypeScript code references the `AlertType.CHANGE_%` enum value
- **Property (P)**: The desired behavior - TypeScript compilation succeeds and the enum value can be referenced using a valid identifier
- **Preservation**: Existing PRICE alert functionality and database records that must remain unchanged by the fix
- **AlertType**: The enum in `schema.prisma` that defines alert types (PRICE and CHANGE_%)
- **priceChecker.ts**: The file at line 29 where the invalid enum reference causes TS1109 error
- **Prisma Client**: The auto-generated TypeScript client that exposes the AlertType enum from the schema

## Bug Details

### Fault Condition

The bug manifests when TypeScript code attempts to reference the `AlertType.CHANGE_%` enum value. The Prisma client generator creates TypeScript code with this invalid identifier, causing compilation to fail with TS1109 error.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type EnumValueIdentifier
  OUTPUT: boolean
  
  RETURN input.name CONTAINS '%'
         AND input.context == 'TypeScript'
         AND NOT isValidTypeScriptIdentifier(input.name)
END FUNCTION
```

### Examples

- **Example 1**: Referencing `AlertType.CHANGE_%` in priceChecker.ts line 29 causes TS1109 error "Expression expected"
- **Example 2**: Any TypeScript file importing `AlertType` from `@prisma/client` and using `CHANGE_%` will fail to compile
- **Example 3**: IDE type checking shows syntax error when hovering over `AlertType.CHANGE_%`
- **Edge case**: The enum value `PRICE` works correctly because it contains only valid identifier characters

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- PRICE alert type functionality must continue to work exactly as before
- Existing database records with alert type values must continue to be recognized after migration
- Alert checking logic for PRICE alerts in priceChecker.ts must remain unchanged

**Scope:**
All code and data that does NOT involve the `CHANGE_%` enum value should be completely unaffected by this fix. This includes:
- PRICE alert creation, retrieval, and triggering logic
- Database queries filtering by AlertType.PRICE
- API routes that handle PRICE alerts
- Any other TypeScript files that only reference AlertType.PRICE

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is clear:

1. **Invalid Character in Identifier**: The `%` character is not allowed in TypeScript identifiers according to the ECMAScript specification
   - Valid identifiers can only contain letters, digits, underscores, and dollar signs
   - The `%` character is a special operator character in JavaScript/TypeScript

2. **Prisma Schema Validation Gap**: Prisma's schema parser allows enum values that are not valid TypeScript identifiers
   - The schema.prisma file accepts `CHANGE_%` without validation
   - The generated Prisma client then contains invalid TypeScript code

3. **Compilation Failure**: When TypeScript attempts to parse the generated Prisma client code, it encounters the invalid identifier and fails with TS1109

## Correctness Properties

Property 1: Fault Condition - Valid TypeScript Identifier

_For any_ enum value in the AlertType enum, the fixed schema SHALL use only valid TypeScript identifier characters (letters, digits, underscores, dollar signs), ensuring that the generated Prisma client compiles without syntax errors.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Existing Alert Functionality

_For any_ code or database operation that references the PRICE alert type, the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing PRICE alert functionality including creation, retrieval, and triggering logic.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

The root cause is definitively the invalid `%` character in the enum identifier.

**File**: `schema.prisma`

**Enum**: `AlertType`

**Specific Changes**:
1. **Rename Enum Value**: Change `CHANGE_%` to `CHANGE_PERCENT`
   - Update line 42 in schema.prisma
   - Maintain the comment explaining the purpose

2. **Update TypeScript References**: Change all references to `AlertType.CHANGE_%` to `AlertType.CHANGE_PERCENT`
   - Update priceChecker.ts line 29 where the enum is referenced
   - Search for any other files that may reference this enum value

3. **Generate Prisma Client**: Run `npx prisma generate` to regenerate the TypeScript client
   - This will create the new valid identifier in the generated code
   - Verify that no TS1109 errors remain

4. **Create Database Migration**: Run `npx prisma migrate dev` to create a migration
   - The migration will rename the enum value in the database
   - Existing records with `CHANGE_%` will be updated to `CHANGE_PERCENT`

5. **Verify Compilation**: Run TypeScript compilation to confirm no syntax errors
   - Check that priceChecker.ts compiles successfully
   - Verify IDE no longer shows syntax errors

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, confirm the bug exists by attempting to compile the unfixed code, then verify the fix resolves the compilation error and preserves existing functionality.

### Exploratory Fault Condition Checking

**Goal**: Confirm the TypeScript compilation error BEFORE implementing the fix. Verify that the `%` character is indeed the root cause.

**Test Plan**: Attempt to compile the TypeScript code with the unfixed schema. Run `npx tsc --noEmit` or check IDE diagnostics to observe the TS1109 error at line 29 of priceChecker.ts.

**Test Cases**:
1. **Compilation Error Test**: Run TypeScript compiler on unfixed code (will fail with TS1109)
2. **IDE Diagnostics Test**: Open priceChecker.ts in IDE and observe syntax error highlighting (will show error)
3. **Prisma Generate Test**: Run `npx prisma generate` and inspect generated client code (will contain invalid identifier)
4. **Alternative Valid Name Test**: Temporarily change to `CHANGE_PERCENT` in schema only to confirm it resolves the error (will succeed)

**Expected Counterexamples**:
- TypeScript compilation fails with "TS1109: Expression expected" at line 29, column 52
- Possible causes: invalid `%` character in identifier, Prisma schema validation gap

### Fix Checking

**Goal**: Verify that after renaming the enum value to a valid identifier, TypeScript compilation succeeds without syntax errors.

**Pseudocode:**
```
FOR ALL references to AlertType enum WHERE enumValue == 'CHANGE_PERCENT' DO
  result := compileTypeScript(file)
  ASSERT result.success == true
  ASSERT result.errors.length == 0
END FOR
```

### Preservation Checking

**Goal**: Verify that all code and functionality related to PRICE alerts continues to work exactly as before the fix.

**Pseudocode:**
```
FOR ALL code WHERE references AlertType.PRICE DO
  ASSERT behavior_after_fix(code) == behavior_before_fix(code)
END FOR

FOR ALL database_records WHERE type == 'PRICE' DO
  ASSERT can_query_and_update(record) == true
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across different alert configurations
- It catches edge cases in alert creation, retrieval, and triggering logic
- It provides strong guarantees that PRICE alert behavior is unchanged

**Test Plan**: Observe PRICE alert behavior on UNFIXED code first (creation, retrieval, triggering), then write property-based tests capturing that exact behavior to run after the fix.

**Test Cases**:
1. **PRICE Alert Creation Preservation**: Verify creating PRICE alerts works identically before and after fix
2. **PRICE Alert Retrieval Preservation**: Verify querying PRICE alerts returns same results before and after fix
3. **PRICE Alert Triggering Preservation**: Verify price checking logic triggers PRICE alerts identically before and after fix
4. **Database Migration Preservation**: Verify existing PRICE alert records remain accessible after migration

### Unit Tests

- Test that TypeScript compilation succeeds after renaming enum value
- Test that priceChecker.ts can reference AlertType.CHANGE_PERCENT without errors
- Test that PRICE alert logic continues to work correctly
- Test that database queries with AlertType.PRICE still function

### Property-Based Tests

- Generate random alert configurations with type PRICE and verify creation/retrieval works identically
- Generate random price scenarios and verify PRICE alert triggering logic is preserved
- Test that all database operations on PRICE alerts produce same results across many scenarios

### Integration Tests

- Test full alert creation flow with both PRICE and CHANGE_PERCENT types
- Test priceChecker.ts execution with mixed alert types in database
- Test that Prisma client generation and TypeScript compilation succeed in CI/CD pipeline
