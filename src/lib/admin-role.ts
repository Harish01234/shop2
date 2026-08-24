export function isAdminRole(role?: string | null) {
  return role === 'admin'
}

export function getUserRole(user: { role?: string | null } | null | undefined) {
  return user?.role ?? null
}
