build: clean
  #!/usr/bin/env bash
  set -euxo pipefail

  tmpdir=$(mktemp -d)
  mdbook build -d "$tmpdir"

  cp -r "$tmpdir"/html dist

  mkdir dist/formats
  cp -r "$tmpdir"/markdown dist/formats/markdown
  cp -r "$tmpdir"/terminal dist/formats/terminal

  rm -rf "$tmpdir"

serve: clean
  mdbook serve

clean:
  rm -rf dist

[group("sops")]
sops-rotate:
  ./cmd/sops.sh rotate

[group("sops")]
sops-updatekeys:
  ./cmd/sops.sh updatekeys

[group("encryption")]
encryption-rotate:
  ./cmd/encryption.ts rotate

[group("encryption")]
encrypted-url NAME="":
  ./cmd/encryption.ts url "{{NAME}}"
