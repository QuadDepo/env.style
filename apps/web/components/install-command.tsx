// install block via jalco-ui CodeBlockCommand: https://ui.justinlevine.me/r/code-block-command.json
import { CodeBlockCommand } from "./code-block-command";

export function InstallCommand() {
	return (
		<CodeBlockCommand
			className="w-full max-w-md font-mono"
			pnpm="pnpm add env.style"
			npm="npm install env.style"
			yarn="yarn add env.style"
			bun="bun add env.style"
		/>
	);
}
