import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowedDepartments, resolveDepartment } from './access.mjs';
test('super admin can select every department and overview', () => {
  assert.deepEqual(allowedDepartments({role:'Super admin', departments:[]}, ['B2C','B2B']), ['All departments','B2C','B2B']);
});
test('department admin cannot select an unassigned department', () => {
  const user = {role:'Department admin', departments:['B2C']};
  assert.deepEqual(allowedDepartments(user, ['B2C','B2B']), ['B2C']);
  assert.equal(resolveDepartment(user, 'B2B', ['B2C','B2B']), 'B2C');
});
test('removed assignments and users without access never expose overview', () => {
  assert.equal(resolveDepartment({role:'Department admin',departments:[]}, 'All departments', ['B2C']), null);
  assert.deepEqual(allowedDepartments({role:'Department admin',departments:['Invalid']}, ['B2C']), []);
});
