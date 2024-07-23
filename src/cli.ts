import type { SpawnOptions } from 'bun';

export class CommandError extends Error {
  constructor(code: number) {
    super(`Command exit code: ${code}`);
  }
}

export function runCommand(
  args: string[],
  opts?: Partial<SpawnOptions.OptionsObject>,
) {
  const proc = Bun.spawn(args, {
    stdio: ['ignore', 'inherit', 'inherit'],
    ...opts,
  });
  const validateResult = () => {
    if (proc.exitCode) {
      throw new CommandError(proc.exitCode);
    }
  };
  return {
    async output(ensureSuccess = true) {
      const code = await proc.exited;
      if (ensureSuccess) validateResult();
      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      return {
        code,
        success: !code,
        stdout,
        stderr,
      };
    },
    async spawn(ensureSuccess = true) {
      const code = await proc.exited;
      if (ensureSuccess) validateResult();
      return code;
    },
  };
}
