{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    libdb.url = "github:diamondburned/libdb.so";
    libdb.inputs.nixpkgs.follows = "nixpkgs";
    libdb.inputs.flake-utils.follows = "flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      libdb,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        lib = pkgs.lib;
        pkgs = import nixpkgs { inherit system; };
        name = "diamond-user-guide";

        runtimePkgs = with pkgs; [
          bash
          deno
          dart-sass
          esbuild
          mdbook
          mdbook-pagetoc
          mdbook-admonish
        ];
      in
      {
        devShells.default = pkgs.mkShell {
          inherit name;
          packages =
            with pkgs;
            [
              self.formatter.${system}
              nodePackages.prettier
              languagetool
            ]
            ++ runtimePkgs;

          ESBUILD_BINARY_PATH = lib.getExe pkgs.esbuild;
        };

        packages.default =
          let
            denoHash = "sha256-T0otgKVMeczCCyuAJcfJEsF9VMog4vpmkEydUF3MARw=";
            denoDir = pkgs.stdenv.mkDerivation {
              name = "${name}-deno";
              src = ./.;

              phases = [
                "unpackPhase"
                "buildPhase"
              ];

              nativeBuildInputs = with pkgs; [
                deno
                jq
              ];

              buildPhase = ''
                runHook preBuild

                set -x

                DENO_DIR=$out deno cache $(find . -name "*.ts" -o -name "*.js")

                for d in $out/*; do
                  case "$(basename "$d")" in
                  deps) continue ;;
                  *) rm -rf "$d" ;;
                  esac
                done

                # Deno is stupid lol.
                find $out/deps -name "*.metadata.json" | while read metadata; do
                  jq '{ url, headers: {} }' "$metadata" > "$metadata.tmp"
                  mv "$metadata.tmp" "$metadata"
                done

                runHook postBuild
              '';

              outputHashMode = "recursive";
              outputHashAlgo = "sha256";
              outputHash = denoHash;
            };
          in
          pkgs.runCommand name
            {
              src = ./.;
              nativeBuildInputs = with pkgs; [ jq ] ++ runtimePkgs;

              ESBUILD_BINARY_PATH = lib.getExe pkgs.esbuild;
            }
            ''
              set -x
              mkdir -p $out
              cp -r --no-preserve=ownership $src/* .
              chmod -R +w .

              # Fix up shebangs.
              patchShebangs $(find preprocessors -type f -executable)

              # Unfuck DENO_DIR.
              cp -r ${denoDir} /tmp/deno
              export DENO_DIR=/tmp/deno

              (
                # Generate a fs.json for our documentation.
                # We'll only include Markdown files.
                cp -r --no-preserve=ownership src /tmp/docs
                cd /tmp/docs && bash ${libdb}/scripts/jsonfs . > /tmp/_docsfs.json
              )

              # Render Markdown to HTML
              mdbook build -d $out

              # Keep the original Markdown files
              cp -r --no-preserve=ownership src/* $out/
              mv /tmp/_docsfs.json $out/
            '';

        formatter = pkgs.nixfmt-rfc-style;
      }
    );
}
