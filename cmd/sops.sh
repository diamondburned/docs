#!/usr/bin/env bash

main() {
	case "$1" in
	rotate)
		forEachFile sops rotate --in-place
		;;
	decrypt-all)
		forEachFile sops decrypt --in-place
		;;
	encrypt-all)
		forEachFile sops encrypt --in-place
		;;
	*)
		cat<<-EOF
		Usage:
		  $0 <command>

		Commands:
		  rotate        Rotate all keys in the encrypted files
		  decrypt-all   Decrypt all files in the encrypted directory
		  encrypt-all   Encrypt all files in the encrypted directory
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
