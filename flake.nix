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
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          name = "diamondburned-docs";

          packages = with pkgs; [
            age
            sops
            just
            deno
            dart-sass
            esbuild
            mdbook
            mdbook-admonish
            lowdown

            nixfmt-rfc-style
            nodePackages.prettier
            languagetool
          ];

          ESBUILD_BINARY_PATH = lib.getExe pkgs.esbuild;
          DENO_NO_UPDATE_CHECK = "1";
        };
      }
    );
}
