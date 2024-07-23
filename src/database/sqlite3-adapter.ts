import { Database } from 'bun:sqlite';

export type IPrimaryData = string | number | bigint | boolean | Uint8Array;

export class SqliteAdapter {
  private db: Database;

  constructor(path: string, options?: { readonly?: boolean }) {
    this.db = new Database(path, options);
  }

  exec(sql: string, ...params: any[]) {
    this.db.run(sql, params);
  }

  queryRow<T>(sql: string, ...params: any[]): T | undefined {
    return this.db.query<T, any[]>(sql).get(...params) || undefined;
  }

  queryRows<T>(sql: string, ...params: any[]): T[] {
    return this.db.query<T, any[]>(sql).all(...params);
  }

  queryValues(sql: string, ...params: any[]): IPrimaryData[][] {
    return this.db.query(sql).values(...params);
  }
}
