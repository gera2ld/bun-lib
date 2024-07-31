import { Database, Statement } from 'bun:sqlite';

export type IPrimaryData = string | number | bigint | boolean | Uint8Array;

class SqliteStatement<T> {
  constructor(private statement: Statement<T>) {}

  get(...params: any[]) {
    return this.statement.get(...params) || undefined;
  }

  all(...params: any[]) {
    return this.statement.all(...params);
  }

  values(...params: any[]) {
    return this.statement.values(...params);
  }
}

export class SqliteAdapter {
  private db: Database;

  constructor(path: string, options?: { readonly?: boolean }) {
    this.db = new Database(path, options);
  }

  exec(sql: string, ...params: any[]) {
    this.db.run(sql, params);
  }

  transaction(cb: () => void) {
    this.db.transaction(cb)();
  }

  prepare<T>(sql: string) {
    return new SqliteStatement(this.db.query<T, any[]>(sql));
  }

  queryRow<T>(sql: string, ...params: any[]) {
    return this.prepare<T>(sql).get(...params);
  }

  queryRows<T>(sql: string, ...params: any[]) {
    return this.prepare<T>(sql).all(...params);
  }

  queryValues(sql: string, ...params: any[]): IPrimaryData[][] {
    return this.prepare(sql).values(...params);
  }
}
