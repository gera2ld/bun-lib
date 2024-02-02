import { Database } from 'bun:sqlite';
import { cac } from 'cac';

const cli = cac('sqlite3-server');
cli.help();
cli
  .command('<file>')
  .option('--port <port>', 'Port to listen', { default: 3601 })
  .option('--no-readonly', 'Allow changes to the database')
  .action((file: string, options: { port: number; readonly: boolean }) => {
    Bun.serve({
      port: options.port,
      async fetch(request) {
        if (request.method !== 'POST') {
          return new Response(null, { status: 404 });
        }
        const {
          sql,
          params,
          type = 'values',
        } = (await request.json()) as {
          sql: string;
          params: any[];
          type: 'values' | 'object';
        };
        try {
          const db = new Database(file, {
            readonly: options.readonly,
          });
          const query = db.query(sql);
          const result = query[type === 'values' ? 'values' : 'all'](...params);
          db.close();
          return new Response(JSON.stringify({ result }), {
            headers: { 'content-type': 'application/json' },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: `${err}` }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
          });
        }
      },
    });
  });
cli.parse();
