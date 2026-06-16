import { describe, it, expect } from 'vitest';
import {
  buildMssqlConnectionString,
  parseMssqlConnectionString,
  maskConnectionString,
} from './connectionBuilder';

describe('connectionBuilder', () => {
  it('should build a standard key-value connection string', () => {
    const fields = {
      server: '192.168.1.10',
      port: 1433,
      database: 'PROTHEUS',
      user: 'opo_read',
      password: 'mypassword',
      encrypt: false,
      trustServerCertificate: true,
    };
    const connStr = buildMssqlConnectionString(fields);
    expect(connStr).toContain('Server=192.168.1.10,1433');
    expect(connStr).toContain('Database=PROTHEUS');
    expect(connStr).toContain('User Id=opo_read');
    expect(connStr).toContain('Password=mypassword');
    expect(connStr).toContain('Encrypt=false');
    expect(connStr).toContain('TrustServerCertificate=true');
  });

  it('should parse built connection strings back to identical fields (round-trip)', () => {
    const fields = {
      server: '192.168.1.10',
      port: 1433,
      database: 'PROTHEUS',
      user: 'opo_read',
      password: 'mypassword',
      encrypt: false,
      trustServerCertificate: true,
    };
    const connStr = buildMssqlConnectionString(fields);
    const parsed = parseMssqlConnectionString(connStr);
    expect(parsed).toEqual(fields);
  });

  it('should support named instances (host\\SQLEXPRESS)', () => {
    const fields = {
      server: 'localhost\\SQLEXPRESS',
      database: 'PROTHEUS',
      user: 'sa',
      password: 'sa_password',
      encrypt: true,
      trustServerCertificate: true,
    };
    const connStr = buildMssqlConnectionString(fields);
    expect(connStr).toContain('Server=localhost\\SQLEXPRESS');
    const parsed = parseMssqlConnectionString(connStr);
    expect(parsed?.server).toBe('localhost\\SQLEXPRESS');
  });

  it('should parse standard URI format mssql://', () => {
    const uri = 'mssql://opo_read:mypassword@192.168.1.10:1433/PROTHEUS?encrypt=true';
    const parsed = parseMssqlConnectionString(uri);
    expect(parsed?.server).toBe('192.168.1.10');
    expect(parsed?.port).toBe(1433);
    expect(parsed?.database).toBe('PROTHEUS');
    expect(parsed?.user).toBe('opo_read');
    expect(parsed?.password).toBe('mypassword');
    expect(parsed?.encrypt).toBe(true);
  });

  it('should mask connection string password safely', () => {
    const kv = 'Server=localhost;Database=db;User Id=sa;Password=super_secret_123;Encrypt=false';
    const uri = 'mssql://sa:super_secret_123@localhost:1433/db';

    expect(maskConnectionString(kv)).toContain('Password=******');
    expect(maskConnectionString(kv)).not.toContain('super_secret_123');

    expect(maskConnectionString(uri)).toContain('sa:******@localhost');
    expect(maskConnectionString(uri)).not.toContain('super_secret_123');
  });
});
