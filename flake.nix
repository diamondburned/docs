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
        pkgs = import nixpkgs { inherit system; };
        name = "diamond-user-guide";

        mdbookPkgs = with pkgs; [
          mdbook
          mdbook-pagetoc
          mdbook-admonish
        ];
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
              esbuild

              mdbookPkgs
            ]
          );
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
                  mdbookPkgs
                ]
              );
            }
            ''
              set -x
              mkdir -p $out
              cd $src

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
