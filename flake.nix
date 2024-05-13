{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
        name = "diamond-user-guide";

        mdbookPkgs = with pkgs; [
          mdbook
          mdbook-pagetoc
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
            ++ mdbookPkgs;
        };

        packages.default =
          pkgs.runCommand name
            {
              src = ./.;
              nativeBuildInputs = mdbookPkgs;
            }
            ''
              mkdir -p $out
              cd $src
              mdbook build -d $out
            '';

        formatter = pkgs.nixfmt-rfc-style;
      }
    );
}
