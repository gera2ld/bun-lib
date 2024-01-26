import type { SpawnOptions } from 'bun';

export function runCommand(
  args: string[],
  opts?: Partial<SpawnOptions.OptionsObject>,
) {
  return new Promise<void>((resolve, reject) => {
    Bun.spawn(args, {
      stdio: ['inherit', 'inherit', 'inherit'],
      ...opts,
      onExit(_child, exitCode) {
        (exitCode ? reject : resolve)();
      },
    });
  });
}
