import { Database } from 'bun:sqlite';

const initSql = `
CREATE TABLE IF NOT EXISTS kv (
  key VARCHAR UNIQUE,
  value VARCHAR
);
`;

export class KvDatabase {
  private db: Database;

  constructor(path = 'kv.db') {
    this.db = new Database(path);
    this.db.exec(initSql);
  }

  get(key: string) {
    const query = this.db.query<{ value: string }, [string]>(
      `SELECT value FROM kv WHERE key=?1`,
    );
    const row = query.get(key);
    return row?.value;
  }

  set(key: string, value: string) {
    this.db.exec(
      `INSERT INTO kv(key, value) VALUES(?1, ?2) ON CONFLICT(key) DO UPDATE SET value=?2`,
      [key, value],
    );
  }

  keys() {
    const rows = this.db.query<{ key: string }, []>(`SELECT key FROM kv`).all();
    return rows.map((row) => row.key);
  }

  del(key: string) {
    this.db.exec(`DELETE FROM kv WHERE key=?`, [key]);
  }

  rename(key: string, to: string) {
    this.db.exec(`UPDATE kv SET key=?1 WHERE key=?2`, [to, key]);
  }

  all() {
    const rows = this.db
      .query<{ key: string; value: string }, []>(`SELECT key, value FROM kv`)
      .all();
    return rows;
  }
}
