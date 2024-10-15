#!/usr/bin/env bash

main() {
	case "$1" in
	"rotate"|"encrypt"|"decrypt")
		forEachFile sops "$1" --in-place
		;;
	"updatekeys")
		forEachFile sops updatekeys -y
		;;
	*)
		cat<<-EOF
		Usage:
		  $0 <rotate|encrypt|decrypt|updatekeys>
		See also:
		  sops --help
		EOF
		;;
	esac
}

# forEachFile <command>
# forEachFile executes the given command on each file in the encrypted
# directory. The file is passed as the last argument to the command.
forEachFile() {
	find ./src/encrypted -type f -exec "$@" {} \;
}

main "$@"
