#!/usr/bin/env -S bun run

import { program } from 'commander';
import { mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { temporaryFileTask } from 'tempy';
import { runCommand } from '../cli';
import { ensureEnv } from '../env';
import { KvDatabase } from './kv';

interface GlobalOptions {
  path: string;
}

async function openKv(path: string) {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });
  const kv = new KvDatabase(path);
  return kv;
}

program.name('kv');
program.option('--path <path>', 'Set path of database', 'kv.db');

program
  .command('get <key>')
  .description('Show the value of a key')
  .action(async (key: string, options: GlobalOptions) => {
    const kv = await openKv(options.path);
    const value = kv.get(key) || '';
    console.log(value);
  });

program
  .command('set <key> [value]')
  .description('Set the value of a key')
  .action(
    async (key: string, value: string | undefined, options: GlobalOptions) => {
      const kv = await openKv(options.path);
      value ??= await Bun.stdin.text();
      if (value == null) throw new Error('value is required');
      kv.set(key, value);
    },
  );

program
  .command('del <key>')
  .description('Delete a key')
  .action(async (key: string, options: GlobalOptions) => {
    const kv = await openKv(options.path);
    kv.del(key);
  });

program
  .command('keys')
  .description('List all keys')
  .action(async (options: GlobalOptions) => {
    const kv = await openKv(options.path);
    console.log(kv.keys().join('\n'));
  });

program
  .command('edit <key>')
  .description('Edit the value of a key with $EDITOR')
  .action(async (key: string, options: GlobalOptions) => {
    const kv = await openKv(options.path);
    const value = kv.get(key) || '';
    await temporaryFileTask(
      async (temp: string) => {
        await Bun.write(temp, value);
        await runCommand([ensureEnv('EDITOR'), temp]).spawn();
        const newValue = await Bun.file(temp).text();
        kv.set(key, newValue);
      },
      {
        name: key,
      },
    );
  });

program
  .command('import <source>')
  .description('Import data from a directory')
  .action(async (source: string, options: GlobalOptions) => {
    const kv = await openKv(options.path);
    for (const entry of await readdir(source)) {
      const value = await Bun.file(join(source, entry)).text();
      kv.set(entry, value);
    }
  });

program
  .command('export')
  .description('Export all data to a directory')
  .option('-o, --outdir <outdir>', 'Output directory', 'kv-data')
  .action(async (options: GlobalOptions & { outdir: string }) => {
    await mkdir(options.outdir, { recursive: true });
    const kv = await openKv(options.path);
    for (const { key, value } of kv.all()) {
      await Bun.write(join(options.outdir, key), value);
    }
    console.log(`Data exported to ${options.outdir}`);
  });

program.parse();
