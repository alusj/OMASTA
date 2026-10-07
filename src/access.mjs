export function allowedDepartments(user, departments) {
  return user.role === 'Super admin' ? ['All departments', ...departments] : departments.filter(d => user.departments.includes(d));
}
export function resolveDepartment(user, requested, departments) {
  const allowed = allowedDepartments(user, departments);
  return allowed.includes(requested) ? requested : allowed[0] ?? null;
}
