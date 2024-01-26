#!/usr/bin/env -S bun run

import { cac } from 'cac';
import { mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { temporaryFileTask } from 'tempy';
import { ensureEnv } from '../env';
import { KvDatabase } from './kv';
import { runCommand } from '../cli';

interface GlobalOptions {
  path: string;
}

function showHelpAndThrow() {
  cli.outputHelp();
  process.exit(1);
}

async function openKv(path: string) {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });
  const kv = new KvDatabase(path);
  return kv;
}

const cli = cac('kv');
cli.option('--path <path>', 'Set path of database', {
  default: 'kv.db',
});
cli.help();
cli.command('').action(showHelpAndThrow);

// Unknown command
cli.on('command:*', showHelpAndThrow);

cli
  .command('get <key>', 'Show the value of a key')
  .action(async (key: string, options: GlobalOptions) => {
    const kv = await openKv(options.path);
    const value = kv.get(key) || '';
    console.log(value);
  });

cli
  .command('set <key> [value]', 'Set the value of a key')
  .action(
    async (key: string, value: string | undefined, options: GlobalOptions) => {
      const kv = await openKv(options.path);
      value ??= await Bun.stdin.text();
      if (value == null) throw new Error('value is required');
      kv.set(key, value);
    },
  );

cli
  .command('del <key>', 'Delete a key')
  .action(async (key: string, options: GlobalOptions) => {
    const kv = await openKv(options.path);
    kv.del(key);
  });

cli.command('keys', 'List all keys').action(async (options: GlobalOptions) => {
  const kv = await openKv(options.path);
  console.log(kv.keys().join('\n'));
});

cli
  .command('edit <key>', 'Edit the value of a key with $EDITOR')
  .action(async (key: string, options: GlobalOptions) => {
    const kv = await openKv(options.path);
    const value = kv.get(key) || '';
    await temporaryFileTask(
      async (temp: string) => {
        await Bun.write(temp, value);
        await runCommand([ensureEnv('EDITOR'), temp]);
        const newValue = await Bun.file(temp).text();
        kv.set(key, newValue);
      },
      {
        name: key,
      },
    );
  });

cli
  .command('import <source>', 'Import data from a directory')
  .action(async (source: string, options: GlobalOptions) => {
    const kv = await openKv(options.path);
    for (const entry of await readdir(source)) {
      const value = await Bun.file(join(source, entry)).text();
      kv.set(entry, value);
    }
  });

cli
  .command('export', 'Export all data to a directory')
  .option('-o, --outdir <outdir>', 'Output directory', {
    default: 'kv-data',
  })
  .action(async (options: GlobalOptions & { outdir: string }) => {
    await mkdir(options.outdir, { recursive: true });
    const kv = await openKv(options.path);
    for (const { key, value } of kv.all()) {
      await Bun.write(join(options.outdir, key), value);
    }
    console.log(`Data exported to ${options.outdir}`);
  });

cli.parse();
