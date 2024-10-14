{
  self,
  pkgs,
  name,
  inputs,
  buildInputs ? [ ],
  extraAttrs ? { },
}:

let
  lib = pkgs.lib;
  hashes = builtins.fromJSON (builtins.readFile ./hashes.json);

  markdownDir = self + "/src";

  packages = {
    html = copy "html" "${dist}/html";
    markdown = copy "markdown" "${dist}/markdown";
    terminal = terminal;
  };

  terminal =
    pkgs.runCommand "${name}-terminal"
      {
        inherit dist;
        nativeBuildInputs = with pkgs; [ lowdown ];
      }
      ''
        cd $dist/markdown

        find . -type f | while read -r path; do
          input="''${path#./}"
          output="$out/''${input%.md}.txt"
          printf "%q -> %q\n" "$input" "$output" >&2

          mkdir -p "$(dirname "$output")"
          lowdown -tterm "$input" > "$output"
        done
      '';

  dist =
    pkgs.runCommand name
      (
        {
          src = self;
          nativeBuildInputs = with pkgs; [ jq ] ++ buildInputs;
        }
        // extraAttrs
      )
      ''
        set -x
        mkdir -p $out
        cp -r --no-preserve=ownership $src/* .
        chmod -R +w .

        # Fix up shebangs.
        patchShebangs $(find preprocessors -type f -executable)

        # Fix DENO_DIR.
        cp -r ${denoDir} /tmp/deno
        export DENO_DIR=/tmp/deno

        (
          # Generate a fs.json for our documentation.
          # We'll only include Markdown files.
          cp -r --no-preserve=ownership src /tmp/docs
          cd /tmp/docs && bash ${inputs.libdb}/scripts/jsonfs . > /tmp/_docsfs.json
        )

        # Render Markdown to HTML
        mdbook build -d $out

        # Keep the original Markdown files
        cp -r --no-preserve=ownership src/* $out/
        mv /tmp/_docsfs.json $out/
      '';

  denoDir = pkgs.stdenv.mkDerivation {
    name = "${name}-deno";
    src = self;

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
    outputHash = hashes.denoDir;
  };

  copy =
    what: path:
    pkgs.runCommand "${name}-${what}" { } ''
      mkdir -p $out
      cp -r --no-preserve=ownership ${path}/. $out
    '';
in

packages
