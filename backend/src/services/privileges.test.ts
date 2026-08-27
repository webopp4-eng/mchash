import { isTargetProtectedFrom, isProtectedRole, privilegeOf } from '../lib/privileges';

let pass = 0;
let fail = 0;
function check(name: string, actual: boolean | number, expected: boolean | number) {
  const ok = actual === expected;
  if (ok) pass++; else { fail++; console.log(`FAIL: ${name} => got ${actual}, expected ${expected}`); }
}

// Privilege ordering
check('user tier', privilegeOf('user'), 0);
check('employee tier', privilegeOf('EMPLOYEE'), 1);
check('super admin tier', privilegeOf('SUPER_ADMIN'), 2);
check('unknown -> user tier', privilegeOf('bogus'), 0);

// Protected roles
check('super admin is protected', isProtectedRole('SUPER_ADMIN'), true);
check('admin is protected', isProtectedRole('ADMIN'), true);
check('legacy admin protected', isProtectedRole('admin'), true);
check('employee not protected', isProtectedRole('EMPLOYEE'), false);
check('user not protected', isProtectedRole('user'), false);

// Employees can NEVER act on admins (higher/equal privilege)
check('employee blocked from super admin', isTargetProtectedFrom('EMPLOYEE', 'SUPER_ADMIN'), true);
check('employee blocked from admin', isTargetProtectedFrom('EMPLOYEE', 'ADMIN'), true);
check('employee blocked from employee', isTargetProtectedFrom('EMPLOYEE', 'EMPLOYEE'), true);

// Employees CAN act on normal users
check('employee can act on user', isTargetProtectedFrom('EMPLOYEE', 'user'), false);

// Super admin can act on users and employees
check('super admin can act on user', isTargetProtectedFrom('SUPER_ADMIN', 'user'), false);
check('super admin can act on employee', isTargetProtectedFrom('SUPER_ADMIN', 'EMPLOYEE'), false);

// Super admin is blocked from other super admins (protected)
check('super admin blocked from super admin', isTargetProtectedFrom('SUPER_ADMIN', 'SUPER_ADMIN'), true);

console.log(`\nPrivilege tests: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
