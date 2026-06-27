build: clean
  mdbook build -d dist

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
