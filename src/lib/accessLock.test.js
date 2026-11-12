import { expect, test } from 'bun:test';
import { isAccessLocked } from '../../supabase/functions/manage-licenses/accessLock';

test('all suspended licenses deny access even without a stored key', () => {
  expect(isAccessLocked(Array(8).fill('suspended'))).toBe(true);
});
test('restoring a license releases the global lock', () => {
  expect(isAccessLocked(['suspended', 'active'])).toBe(false);
});
test('no license records does not imply an administrator lock', () => {
  expect(isAccessLocked([])).toBe(false);
});