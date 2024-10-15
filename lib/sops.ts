import { assertSuccess } from "#/lib/cmd.ts";

// sopsDecrypt decrypts a file encrypted with SOPS and returns the plaintext.
// If the file is not encrypted, it is returned as is.
export async function sopsDecrypt(
  path: string,
  { requireEncrypted = false }: { requireEncrypted?: boolean } = {},
): Promise<string> {
  try {
    const encrypted = await sopsIsEncrypted(path);
    if (!encrypted) {
      if (requireEncrypted) {
        throw new Error(`File is not encrypted: ${path}`);
      } else {
        return await Deno.readTextFile(path);
      }
    }

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
  } catch (e) {
    throw new Error(`Failed to decrypt file`, { cause: e });
  }
}

// sopsEncryptTo encrypts the given content with SOPS and writes it to the given
// path.
export async function sopsEncryptTo(
  path: string,
  content: string | Uint8Array,
) {
  try {
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
  } catch (e) {
    throw new Error(`Failed to encrypt file`, { cause: e });
  }
}

// sopsIsEncrypted checks if the given file is encrypted with SOPS.
export async function sopsIsEncrypted(path: string): Promise<boolean> {
  try {
    const cmd = new Deno.Command("sops", {
      args: ["filestatus", path],
      stdin: "null",
      stdout: "piped",
      stderr: "null",
    });

    const out = await cmd.output();
    if (!out.success) {
      // sops will fail if the file isn't JSON or YAML, so we can assume it's
      // not encrypted in that case.
      return false;
    }

    const res = JSON.parse(new TextDecoder().decode(out.stdout)) as {
      encrypted: boolean;
    };
    return res.encrypted;
  } catch (e) {
    throw new Error(`Failed to check if file is encrypted`, { cause: e });
  }
}
