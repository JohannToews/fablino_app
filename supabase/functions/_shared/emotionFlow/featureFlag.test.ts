/**
 * Unit tests for isEmotionFlowEnabled()
 *
 * Run with: npx tsx supabase/functions/_shared/emotionFlow/featureFlag.test.ts
 */

import { isEmotionFlowEnabled, resetFeatureFlagCache } from './featureFlag.ts';

let testCount = 0;
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`  ✅ ${message}`);
  } else {
    failCount++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

function mockSupabase(value: string | null, error: any = null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: value !== null ? { value } : null,
            error,
          }),
        }),
      }),
    }),
  };
}

// ── Tests ──

async function runTests() {
  console.log('\n🧪 featureFlag.ts — isEmotionFlowEnabled()\n');

  // 1. Empty array → nobody enabled
  console.log('── Empty array ──');
  resetFeatureFlagCache();
  const r1 = await isEmotionFlowEnabled('user-abc', mockSupabase('[]'));
  assert(r1 === false, 'Empty array → false');

  // 2. Specific user in array → enabled
  console.log('── Specific user ──');
  resetFeatureFlagCache();
  const r2 = await isEmotionFlowEnabled(
    'user-abc',
    mockSupabase('["user-abc", "user-def"]')
  );
  assert(r2 === true, 'User in array → true');

  // 3. Different user → not enabled
  resetFeatureFlagCache();
  const r3 = await isEmotionFlowEnabled(
    'user-xyz',
    mockSupabase('["user-abc", "user-def"]')
  );
  assert(r3 === false, 'User NOT in array → false');

  // 4. Wildcard ["*"] → everyone enabled
  console.log('── Wildcard ──');
  resetFeatureFlagCache();
  const r4 = await isEmotionFlowEnabled('any-user', mockSupabase('["*"]'));
  assert(r4 === true, 'Wildcard ["*"] → true for any user');

  // 5. DB error → fail-safe false
  console.log('── Error handling ──');
  resetFeatureFlagCache();
  const r5 = await isEmotionFlowEnabled(
    'user-abc',
    mockSupabase(null, { message: 'connection refused' })
  );
  assert(r5 === false, 'DB error → false (fail-safe)');

  // 6. Invalid JSON → fail-safe false
  resetFeatureFlagCache();
  const r6 = await isEmotionFlowEnabled(
    'user-abc',
    mockSupabase('not-valid-json')
  );
  assert(r6 === false, 'Invalid JSON → false (fail-safe)');

  // 7. Non-array value → fail-safe false
  resetFeatureFlagCache();
  const r7 = await isEmotionFlowEnabled(
    'user-abc',
    mockSupabase('"just-a-string"')
  );
  assert(r7 === false, 'Non-array JSON → false (fail-safe)');

  // 8. Null data → fail-safe false
  resetFeatureFlagCache();
  const r8 = await isEmotionFlowEnabled('user-abc', mockSupabase(null));
  assert(r8 === false, 'Null data → false (fail-safe)');

  // 9. Caching: second call same user does NOT hit DB again
  console.log('── Caching ──');
  resetFeatureFlagCache();
  let dbCallCount = 0;
  const countingMock = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            dbCallCount++;
            return { data: { value: '["user-abc"]' }, error: null };
          },
        }),
      }),
    }),
  };
  await isEmotionFlowEnabled('user-abc', countingMock);
  await isEmotionFlowEnabled('user-abc', countingMock);
  assert(dbCallCount === 1, 'Second call uses cache (1 DB call, not 2)');

  // 10. Cache reset allows fresh DB call
  resetFeatureFlagCache();
  await isEmotionFlowEnabled('user-abc', countingMock);
  assert(dbCallCount === 2, 'After cache reset, fresh DB call happens');

  // 11. Different userId bypasses cache
  resetFeatureFlagCache();
  let callCount2 = 0;
  const countingMock2 = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            callCount2++;
            return { data: { value: '["user-abc"]' }, error: null };
          },
        }),
      }),
    }),
  };
  await isEmotionFlowEnabled('user-abc', countingMock2);
  await isEmotionFlowEnabled('user-different', countingMock2);
  assert(callCount2 === 2, 'Different userId triggers new DB call');

  // 12. Exception in supabase client → fail-safe false
  console.log('── Exception handling ──');
  resetFeatureFlagCache();
  const throwingMock = {
    from: () => {
      throw new Error('Supabase client exploded');
    },
  };
  const r12 = await isEmotionFlowEnabled('user-abc', throwingMock);
  assert(r12 === false, 'Exception in client → false (fail-safe)');

  // ── Summary ──
  console.log(`\n────────────────────────`);
  console.log(`Results: ${passCount}/${testCount} passed, ${failCount} failed`);
  if (failCount > 0) {
    console.error('⚠️  Some tests failed!');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
  }
}

runTests();
