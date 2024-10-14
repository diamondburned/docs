// sopsDecrypt decrypts a file encrypted with SOPS and returns the plaintext.
export async function sopsDecrypt(path: string): Promise<string> {
  const cmd = new Deno.Command("sops", {
    args: ["decrypt", path],
    stdin: "null",
    stdout: "piped",
    stderr: "inherit",
  });

  const out = await cmd.output();
  assertSuccess(out);

  const stdout = new TextDecoder().decode(out.stdout);
  return stdout;
}

// sopsEncryptTo encrypts the given content with SOPS and writes it to the given
// path.
export async function sopsEncryptTo(
  path: string,
  content: string | Uint8Array,
) {
  const cmd = new Deno.Command("sops", {
    args: ["encrypt", "--filename-override", path, "--output", path, "-"],
    stdin: "piped",
    stdout: "null",
    stderr: "inherit",
  });

  const child = cmd.spawn();

  const stdin = child.stdin.getWriter();
  await stdin.write(
    typeof content === "string" ? new TextEncoder().encode(content) : content,
  );
  await stdin.close();

  const status = await child.status;
  assertSuccess(status);
}

function assertSuccess(cmd: Deno.CommandStatus) {
  if (!cmd.success) {
    throw new Error(`Command failed with code ${cmd.code}`);
  }
}
