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

        mdbookPkgs = with pkgs; [
          mdbook
          mdbook-pagetoc
          mdbook-admonish
        ];

        unpackPhase = ''
          mkdir -p $out
          cp -r --no-preserve=ownership $src/* .
          chmod -R +w .
        '';

        denoHash = "sha256-bbcOGN9LIUCc7LCEBOT+niuoA4eZkmTGZo68vrWJ23M=";
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

            DENO_DIR=$out deno cache $(find . -name "*.ts" -o -name "*.js")

            # Deno is stupid lol.
            for metadata in $(find $out/deps -name "*.metadata.json"); do
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
      {
        devShells.default = pkgs.mkShell {
          inherit name;
          packages = pkgs.lib.flatten (
            with pkgs;
            [
              self.formatter.${system}
              nodePackages.prettier
              languagetool
              deno
              mdbookPkgs
            ]
          );
          ESBUILD_BINARY_PATH = lib.getExe pkgs.esbuild;
        };

        packages.default =
          pkgs.runCommand name
            {
              src = ./.;
              nativeBuildInputs = pkgs.lib.flatten (
                with pkgs;
                [
                  bash
                  jq
                  deno
                  esbuild
                  mdbookPkgs
                ]
              );

              DENO_DIR = denoDir;
              ESBUILD_BINARY_PATH = lib.getExe pkgs.esbuild;
            }
            ''
              set -x
              mkdir -p $out
              cp -r --no-preserve=ownership $src/* .
              chmod -R +w .

              # Fix up shebangs.
              patchShebangs $(find preprocessors -type f -executable)

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
