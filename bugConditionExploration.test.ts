import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import * as fc from 'fast-check';

/**
 * Bug Condition Exploration Test
 * 
 * **Validates: Requirements 2.1, 2.2**
 * 
 * Property 1: Fault Condition - Invalid TypeScript Identifier Compilation Error
 * 
 * This test verifies that the bug exists in the UNFIXED code by checking that:
 * - TypeScript compilation fails with TS1109 error
 * - The error occurs at priceChecker.ts line 29
 * - The error is caused by the invalid `%` character in `AlertType.CHANGE_%`
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * When the fix is implemented, this same test will PASS, confirming the bug is resolved.
 */
describe('Bug Condition Exploration: Invalid TypeScript Identifier', () => {
  it('Property 1: TypeScript compilation should succeed without TS1109 errors', { timeout: 15000 }, () => {
    /**
     * Scoped PBT Approach: We test that TypeScript compilation succeeds
     * for all enum values in the AlertType enum.
     * 
     * On UNFIXED code: This test will FAIL because CHANGE_% causes TS1109 error
     * On FIXED code: This test will PASS because all enum values are valid identifiers
     * 
     * We use property-based testing to verify compilation succeeds across
     * different scenarios.
     */
    fc.assert(
      fc.property(
        // Test the current state of the codebase
        fc.constant('current_codebase'),
        (_) => {
          // Expected behavior: TypeScript compilation should succeed
          // with valid enum identifiers
          
          let compilationResult: { success: boolean; error: string | null } = {
            success: true,
            error: null
          };
          
          try {
            // Run TypeScript compiler in no-emit mode to check for errors
            execSync('npx tsc --noEmit', {
              encoding: 'utf-8',
              stdio: 'pipe'
            });
            compilationResult.success = true;
          } catch (error: any) {
            compilationResult.success = false;
            compilationResult.error = error.stdout || error.stderr || error.message;
          }
          
          // Document the counterexample if compilation fails
          if (!compilationResult.success) {
            const errorOutput = compilationResult.error || '';
            
            // Check for TS1109 error code
            const hasTS1109 = errorOutput.includes('TS1109');
            
            // Check for the specific file and line number (format can be :29 or (29,52))
            const hasCorrectLocation = errorOutput.includes('priceChecker.ts:29') || 
                                       errorOutput.includes('priceChecker.ts(29');
            
            // Document the counterexample found
            const counterexample = {
              errorCode: hasTS1109 ? 'TS1109' : 'Unknown',
              location: hasCorrectLocation ? 'priceChecker.ts:29:52' : 'Unknown',
              message: 'Expression expected',
              invalidIdentifier: 'CHANGE_%',
              invalidCharacter: '%',
              fullError: errorOutput.substring(0, 500) // First 500 chars for documentation
            };
            
            console.log('❌ Bug condition detected. Counterexample:', JSON.stringify(counterexample, null, 2));
            
            // Verify this is the expected bug (TS1109 at priceChecker.ts:29)
            if (hasTS1109 && hasCorrectLocation) {
              console.log('✓ Confirmed: Bug exists as described in requirements');
              console.log('  - Error: TS1109 (Expression expected)');
              console.log('  - Location: priceChecker.ts line 29');
              console.log('  - Cause: Invalid identifier CHANGE_% contains % character');
            }
          }
          
          // ASSERTION: Compilation should succeed (no TS1109 errors)
          // On UNFIXED code: This will FAIL (test fails = bug exists)
          // On FIXED code: This will PASS (test passes = bug is fixed)
          return compilationResult.success;
        }
      ),
      {
        numRuns: 1, // Run once since we're testing a specific known bug condition
        verbose: true
      }
    );
  });
});
