import type { SpawnOptions } from 'bun';

export async function runCommand(
  args: string[],
  opts?: Partial<SpawnOptions.OptionsObject>,
) {
  const proc = Bun.spawn(args, {
    stdio: ['ignore', 'inherit', 'inherit'],
    ...opts,
  });
  await proc.exited;
  if (proc.exitCode) {
    throw new Error(`Exit code: ${proc.exitCode}`);
  }
  return proc;
}
