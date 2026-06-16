/** SSRF guard for database connection strings. Set OPO_ALLOWED_DB_HOSTS in production. */
export function isConnectionAllowed(target: string, driver: string): boolean {
  if (!target) return false;
  const allowedEnv = (process.env.OPO_ALLOWED_DB_HOSTS || 'localhost,127.0.0.1,::1,host.docker.internal').toLowerCase();
  const allowList = allowedEnv.split(',').map((s) => s.trim()).filter(Boolean);

  if (driver === 'sqlite' || target.includes('file:') || /^[a-zA-Z]:\\/.test(target) || target.startsWith('/')) {
    return true;
  }

  try {
    const hostMatch = target.match(/@([^:/,?]+)|\/\/([^:/,?]+)|Server=([^;]+)|Host=([^;]+)/i);
    const host = (hostMatch ? hostMatch[1] || hostMatch[2] || hostMatch[3] || hostMatch[4] || '' : target)
      .toLowerCase()
      .trim();
    if (!host) return true;
    if (allowList.includes(host) || allowList.includes('*') || host === 'localhost' || host.startsWith('127.')) {
      return true;
    }
    return allowList.some((a: string) => host.includes(a) || a.includes(host));
  } catch {
    return false;
  }
}