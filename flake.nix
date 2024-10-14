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
    }@inputs:

    flake-utils.lib.eachDefaultSystem (
      system:
      let
        lib = pkgs.lib;
        pkgs = import nixpkgs { inherit system; };
        name = "diamond-user-guide";

        buildInputs = with pkgs; [
          bash
          deno
          dart-sass
          esbuild
          mdbook
          mdbook-admonish
        ];

        extraAttrs = {
          ESBUILD_BINARY_PATH = lib.getExe pkgs.esbuild;
          DENO_NO_UPDATE_CHECK = "1";
        };
      in
      {
        devShells.default = pkgs.mkShell (
          {
            inherit name buildInputs;
            packages = with pkgs; [
              self.formatter.${system}
              nodePackages.prettier
              languagetool
              age
              sops
            ];
          }
          // extraAttrs
        );

        packages = import ./nix/packages.nix {
          inherit
            self
            pkgs
            name
            inputs
            buildInputs
            extraAttrs
            ;
        };

        formatter = pkgs.nixfmt-rfc-style;
      }
    );
}
