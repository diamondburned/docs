export function assertSuccess(cmd: Deno.CommandStatus) {
  if (!cmd.success) {
    throw new Error(`Command failed with code ${cmd.code}`);
  }
}
