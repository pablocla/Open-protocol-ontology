export interface MssqlConnectionFields {
  server: string;           // host or host\instance
  port?: number;            // default 1433
  database: string;
  user?: string;
  password?: string;
  encrypt?: boolean;        // default false for Protheus on-prem
  trustServerCertificate?: boolean; // default true
  windowsAuth?: boolean;    // Integrated Security
}

export function buildMssqlConnectionString(f: MssqlConnectionFields): string {
  const parts: string[] = [];
  
  if (f.port) {
    parts.push(`Server=${f.server},${f.port}`);
  } else {
    parts.push(`Server=${f.server}`);
  }
  
  parts.push(`Database=${f.database}`);
  
  if (f.windowsAuth) {
    parts.push(`Integrated Security=SSPI`);
  } else {
    if (f.user) parts.push(`User Id=${f.user}`);
    if (f.password) parts.push(`Password=${f.password}`);
  }
  
  const encrypt = f.encrypt !== undefined ? f.encrypt : false;
  parts.push(`Encrypt=${encrypt ? 'true' : 'false'}`);
  
  const trust = f.trustServerCertificate !== undefined ? f.trustServerCertificate : true;
  parts.push(`TrustServerCertificate=${trust ? 'true' : 'false'}`);
  
  return parts.join(';');
}

export function parseMssqlConnectionString(url: string): MssqlConnectionFields | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // Key-value format (Server=...;Database=...)
  if (cleanUrl.toLowerCase().includes('server=')) {
    const fields: Partial<MssqlConnectionFields> = {};
    const parts = cleanUrl.split(';');
    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      const key = part.slice(0, eqIdx).trim().toLowerCase();
      const val = part.slice(eqIdx + 1).trim();
      
      if (key === 'server') {
        if (val.includes(',')) {
          const [srv, portStr] = val.split(',');
          fields.server = srv.trim();
          fields.port = parseInt(portStr.trim(), 10);
        } else {
          fields.server = val;
        }
      } else if (key === 'database') {
        fields.database = val;
      } else if (key === 'user id' || key === 'uid' || key === 'user') {
        fields.user = val;
      } else if (key === 'password' || key === 'pwd') {
        fields.password = val;
      } else if (key === 'encrypt') {
        fields.encrypt = val.toLowerCase() === 'true';
      } else if (key === 'trustservercertificate') {
        fields.trustServerCertificate = val.toLowerCase() === 'true';
      } else if (key === 'integrated security') {
        fields.windowsAuth = val.toLowerCase() === 'sspi' || val.toLowerCase() === 'true';
      }
    }
    
    if (fields.server && fields.database) {
      return fields as MssqlConnectionFields;
    }
  }

  // URI format
  if (cleanUrl.startsWith('mssql://') || cleanUrl.startsWith('sqlserver://')) {
    try {
      const parsedUrl = new URL(cleanUrl.replace(/^(mssql|sqlserver):\/\//, 'http://'));
      
      const server = parsedUrl.hostname;
      const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : undefined;
      const database = parsedUrl.pathname.replace(/^\//, '');
      const user = parsedUrl.username ? decodeURIComponent(parsedUrl.username) : undefined;
      const password = parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined;
      
      const encrypt = parsedUrl.searchParams.get('encrypt') === 'true';
      const trustServerCertificate = parsedUrl.searchParams.get('trustServerCertificate') !== 'false';
      
      if (server && database) {
        return {
          server,
          port,
          database,
          user,
          password,
          encrypt,
          trustServerCertificate
        };
      }
    } catch (e) {
      return null;
    }
  }

  return null;
}

export function maskConnectionString(url: string): string {
  if (!url) return '';
  let masked = url.replace(/(password|pwd)\s*=\s*[^;]+/gi, '$1=******');
  masked = masked.replace(/(\/\/([^:]+):)([^@]+)(@)/g, '$1******$4');
  return masked;
}
