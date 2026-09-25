import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';

/**
 * Preservation Property Tests
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3**
 * 
 * Property 2: Preservation - Existing Alert Functionality
 * 
 * These tests verify that PRICE alert functionality works correctly on UNFIXED code.
 * They establish a baseline behavior that MUST be preserved after the fix.
 * 
 * IMPORTANT: These tests run on UNFIXED code and should PASS, confirming that
 * PRICE alert functionality is working correctly before any changes are made.
 * 
 * After the fix is implemented, these same tests will be re-run to ensure
 * no regressions were introduced.
 */

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

// Test user ID for isolation
const TEST_USER_ID = 999999;

// AlertType constants (since SQLite uses strings, not enums)
const AlertType = {
  PRICE: 'PRICE',
  CHANGE_PERCENT: 'CHANGE_PERCENT'
} as const;

describe('Preservation Property: PRICE Alert Functionality', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.alert.deleteMany({ where: { userId: TEST_USER_ID } });
    
    // Ensure test user exists
    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: {
        id: TEST_USER_ID,
        email: `test-user-${TEST_USER_ID}@example.com`,
        name: 'Test User'
      }
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.alert.deleteMany({ where: { userId: TEST_USER_ID } });
  });

  it('Property 2.1: PRICE alert creation works correctly', async () => {
    /**
     * This property verifies that creating PRICE alerts with various
     * configurations works correctly on the unfixed code.
     * 
     * We test across many different alert configurations to ensure
     * the baseline behavior is well-established.
     */
    await fc.assert(
      fc.asyncProperty(
        // Generate random alert configurations
        fc.record({
          symbol: fc.constantFrom('bitcoin', 'ethereum', 'cardano', 'solana'),
          currency: fc.constantFrom('usd', 'eur', 'gbp'),
          targetValue: fc.double({ min: 0.01, max: 100000, noNaN: true })
        }),
        async (alertConfig) => {
          // Create a PRICE alert
          const alert = await prisma.alert.create({
            data: {
              userId: TEST_USER_ID,
              symbol: alertConfig.symbol,
              currency: alertConfig.currency,
              type: AlertType.PRICE,
              targetValue: alertConfig.targetValue,
              isActive: true
            }
          });

          // Verify the alert was created with correct properties
          expect(alert).toBeDefined();
          expect(alert.id).toBeGreaterThan(0);
          expect(alert.userId).toBe(TEST_USER_ID);
          expect(alert.symbol).toBe(alertConfig.symbol);
          expect(alert.currency).toBe(alertConfig.currency);
          expect(alert.type).toBe(AlertType.PRICE);
          expect(alert.targetValue).toBeCloseTo(alertConfig.targetValue, 10); // Use toBeCloseTo for float comparison
          expect(alert.isActive).toBe(true);

          // Clean up this specific alert
          await prisma.alert.delete({ where: { id: alert.id } });

          return true;
        }
      ),
      {
        numRuns: 20, // Test with 20 different configurations
        verbose: false
      }
    );
  });

  it('Property 2.2: PRICE alert retrieval returns expected results', async () => {
    /**
     * This property verifies that querying PRICE alerts returns
     * the correct results across different query scenarios.
     */
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple alerts to create
        fc.array(
          fc.record({
            symbol: fc.constantFrom('bitcoin', 'ethereum', 'cardano'),
            currency: fc.constantFrom('usd', 'eur'),
            targetValue: fc.double({ min: 1, max: 10000, noNaN: true })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (alertConfigs) => {
          // Create multiple PRICE alerts
          const createdAlerts = await Promise.all(
            alertConfigs.map(config =>
              prisma.alert.create({
                data: {
                  userId: TEST_USER_ID,
                  symbol: config.symbol,
                  currency: config.currency,
                  type: AlertType.PRICE,
                  targetValue: config.targetValue,
                  isActive: true
                }
              })
            )
          );

          // Query all active PRICE alerts for this user
          const retrievedAlerts = await prisma.alert.findMany({
            where: {
              userId: TEST_USER_ID,
              type: AlertType.PRICE,
              isActive: true
            }
          });

          // Verify we got all the alerts we created
          expect(retrievedAlerts.length).toBe(createdAlerts.length);

          // Verify each alert has correct type
          for (const alert of retrievedAlerts) {
            expect(alert.type).toBe(AlertType.PRICE);
            expect(alert.userId).toBe(TEST_USER_ID);
            expect(alert.isActive).toBe(true);
            expect(alert.targetValue).toBeDefined();
          }

          // Clean up
          await prisma.alert.deleteMany({
            where: { id: { in: createdAlerts.map(a => a.id) } }
          });

          return true;
        }
      ),
      {
        numRuns: 15,
        verbose: false
      }
    );
  });

  it('Property 2.3: Database queries with AlertType.PRICE succeed', async () => {
    /**
     * This property verifies that various database operations
     * using AlertType.PRICE work correctly.
     */
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          symbol: fc.constantFrom('bitcoin', 'ethereum'),
          currency: fc.constantFrom('usd', 'eur'),
          targetValue: fc.double({ min: 100, max: 50000, noNaN: true })
        }),
        async (config) => {
          // Create an alert
          const created = await prisma.alert.create({
            data: {
              userId: TEST_USER_ID,
              symbol: config.symbol,
              currency: config.currency,
              type: AlertType.PRICE,
              targetValue: config.targetValue,
              isActive: true
            }
          });

          // Test findUnique
          const foundById = await prisma.alert.findUnique({
            where: { id: created.id }
          });
          expect(foundById).toBeDefined();
          expect(foundById?.type).toBe(AlertType.PRICE);

          // Test findFirst
          const foundFirst = await prisma.alert.findFirst({
            where: {
              userId: TEST_USER_ID,
              type: AlertType.PRICE,
              symbol: config.symbol
            }
          });
          expect(foundFirst).toBeDefined();
          expect(foundFirst?.id).toBe(created.id);

          // Test count
          const count = await prisma.alert.count({
            where: {
              userId: TEST_USER_ID,
              type: AlertType.PRICE
            }
          });
          expect(count).toBeGreaterThanOrEqual(1);

          // Test update
          const updated = await prisma.alert.update({
            where: { id: created.id },
            data: { isActive: false }
          });
          expect(updated.isActive).toBe(false);
          expect(updated.type).toBe(AlertType.PRICE);

          // Test delete
          const deleted = await prisma.alert.delete({
            where: { id: created.id }
          });
          expect(deleted.id).toBe(created.id);

          return true;
        }
      ),
      {
        numRuns: 15,
        verbose: false
      }
    );
  });

  it('Property 2.4: PRICE alert filtering and indexing work correctly', async () => {
    /**
     * This property verifies that the database index on (symbol, currency, type)
     * works correctly for PRICE alerts.
     */
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          symbol: fc.constantFrom('bitcoin', 'ethereum', 'cardano'),
          currency: fc.constantFrom('usd', 'eur', 'gbp')
        }),
        async (config) => {
          // Create multiple alerts with the same symbol/currency but different types
          const priceAlert = await prisma.alert.create({
            data: {
              userId: TEST_USER_ID,
              symbol: config.symbol,
              currency: config.currency,
              type: AlertType.PRICE,
              targetValue: 1000,
              isActive: true
            }
          });

          // Query using the indexed fields
          const alerts = await prisma.alert.findMany({
            where: {
              symbol: config.symbol,
              currency: config.currency,
              type: AlertType.PRICE
            }
          });

          // Verify we found the PRICE alert
          expect(alerts.length).toBeGreaterThanOrEqual(1);
          const foundAlert = alerts.find(a => a.id === priceAlert.id);
          expect(foundAlert).toBeDefined();
          expect(foundAlert?.type).toBe(AlertType.PRICE);

          // Clean up
          await prisma.alert.delete({ where: { id: priceAlert.id } });

          return true;
        }
      ),
      {
        numRuns: 10,
        verbose: false
      }
    );
  });
});
