// ============================================================
// Super Admin bootstrap configuration — enterprise-safe.
// All credentials come from environment variables (EasyPanel /
// docker-compose). NEVER hardcode passwords in source code.
// ============================================================

/** Email of the Super Admin account (env-driven, with the historical default). */
export const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'anchillo00@gmail.com')
  .toLowerCase()
  .trim()

/**
 * Password used ONLY to bootstrap/create the initial Super Admin
 * (seed-admin endpoint / first-login auto-seed). Leave empty to
 * disable auto-bootstrap — the account must then be created via
 * the seed endpoint with SUPER_ADMIN_PASSWORD set.
 */
export const SUPER_ADMIN_BOOTSTRAP_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || ''

/** True when the bootstrap password is configured in the environment. */
export const hasSuperAdminBootstrapPassword = SUPER_ADMIN_BOOTSTRAP_PASSWORD.length >= 8
