#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { detectEnvDiagnostics, resolveColor } from "./env";

interface PackageJson {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

export interface DoctorReport {
	environment: string;
	provider: string | null;
	source: string;
	active: boolean;
	color: string | null;
	project: "next" | "vite" | "unknown";
	root: string;
	icon: string | null;
}

const ICONS = [
	"app/favicon.ico",
	"src/app/favicon.ico",
	"app/icon.png",
	"app/icon.svg",
	"src/app/icon.png",
	"src/app/icon.svg",
	"public/favicon.ico",
	"public/favicon.png",
	"public/favicon.svg",
];

export function createDoctorReport(
	cwd = process.cwd(),
	env: Record<string, string | undefined> = process.env,
): DoctorReport {
	const pkg = readPackage(cwd);
	const dependencies = { ...pkg?.dependencies, ...pkg?.devDependencies };
	const project = dependencies.next
		? "next"
		: dependencies.vite
			? "vite"
			: "unknown";
	const fallback =
		project === "vite"
			? "development"
			: env.NODE_ENV === "development"
				? "development"
				: "production";
	const diagnostics = detectEnvDiagnostics(undefined, () => fallback, env);
	const icon =
		ICONS.find((candidate) => existsSync(path.join(cwd, candidate))) ?? null;
	const active = diagnostics.environment !== "production";
	return {
		...diagnostics,
		active,
		color: active ? resolveColor(diagnostics.environment, undefined) : null,
		project,
		root: cwd,
		icon,
	};
}

export function formatDoctorReport(report: DoctorReport): string {
	return [
		"env.style doctor",
		`Environment: ${report.environment}`,
		`Provider:    ${report.provider ?? "none"}`,
		`Source:      ${report.source}`,
		`Status:      ${report.active ? "active" : "inactive (production)"}`,
		`Color:       ${report.color ?? "none"}`,
		`Project:     ${report.project}`,
		`Root:        ${report.root}`,
		`Icon:        ${report.icon ?? "not found (generated fallback will be used)"}`,
	].join("\n");
}

export function runCli(args = process.argv.slice(2)): number {
	if (args[0] !== "doctor") {
		console.error("Usage: env.style doctor [--json]");
		return 1;
	}
	const report = createDoctorReport();
	console.log(
		args.includes("--json")
			? JSON.stringify(report, null, 2)
			: formatDoctorReport(report),
	);
	return 0;
}

function readPackage(cwd: string): PackageJson | null {
	try {
		return JSON.parse(readFileSync(path.join(cwd, "package.json"), "utf8"));
	} catch {
		return null;
	}
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	process.exitCode = runCli();
}
