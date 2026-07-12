// Builds each example under simulated provider env vars and asserts on the
// build output instead of a live deployment: styled envs must emit the tinted
// icon (and, for Next.js, the favicon rewrites in routes-manifest.json);
// production builds must leave zero footprint.
//
// The full provider matrix runs against vite-react (~2s per build). nextjs
// and tanstack-start get one styled + one production pair each, since provider
// detection is shared code; only the plugin wiring differs per framework.
// Builds inside one example dir share .next/dist, so each app runs its
// scenarios sequentially; the three app chains run in parallel.
import assert from "node:assert";
import { spawn } from "node:child_process";
import {
	existsSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
} from "node:fs";
import path from "node:path";
import {
	OUT_DIR,
	TINTED_ICON_URL,
} from "../packages/env.style/src/constants.ts";

// Every env var detectEnv reads, scrubbed so the host machine or CI can't
// leak an environment into a scenario.
const DETECTION_VARS = [
	"ENV_STYLES_ENV",
	"VERCEL_TARGET_ENV",
	"VERCEL_ENV",
	"CONTEXT",
	"CLOUDFLARE_ENV",
	"RAILWAY_ENVIRONMENT",
	"RENDER",
	"IS_PULL_REQUEST",
	"DENO_DEPLOY",
	"DENO_TIMELINE",
	"FLY_ENV",
	"DYNO",
	"HEROKU_PR_NUMBER",
	"ZEROPS_ENV",
	"SEVALLA_ENV",
	"DO_ENV",
	"NODE_ENV",
];

type Scenario = {
	provider: string;
	env: Record<string, string>;
	styled: boolean;
};

// Mirrors detectEnv: every provider's styled signal, plus a production case
// where the provider can signal one.
const PROVIDER_MATRIX: Scenario[] = [
	{
		provider: "explicit ENV_STYLES_ENV",
		env: { ENV_STYLES_ENV: "staging" },
		styled: true,
	},
	{ provider: "vercel preview", env: { VERCEL_ENV: "preview" }, styled: true },
	{
		provider: "vercel production",
		env: { VERCEL_ENV: "production" },
		styled: false,
	},
	{
		provider: "vercel target-env precedence",
		env: { VERCEL_TARGET_ENV: "production", VERCEL_ENV: "preview" },
		styled: false,
	},
	{
		provider: "netlify deploy-preview",
		env: { CONTEXT: "deploy-preview" },
		styled: true,
	},
	{
		provider: "netlify branch-deploy",
		env: { CONTEXT: "branch-deploy" },
		styled: true,
	},
	{
		provider: "netlify production",
		env: { CONTEXT: "production" },
		styled: false,
	},
	{
		provider: "cloudflare preview",
		env: { CLOUDFLARE_ENV: "preview" },
		styled: true,
	},
	{
		provider: "railway pr",
		env: { RAILWAY_ENVIRONMENT: "pr-42" },
		styled: true,
	},
	{
		provider: "railway production",
		env: { RAILWAY_ENVIRONMENT: "production" },
		styled: false,
	},
	{
		provider: "render pr",
		env: { RENDER: "true", IS_PULL_REQUEST: "true" },
		styled: true,
	},
	{
		provider: "render production",
		env: { RENDER: "true", IS_PULL_REQUEST: "false" },
		styled: false,
	},
	{
		provider: "deno deploy preview",
		env: { DENO_DEPLOY: "true", DENO_TIMELINE: "preview/abc" },
		styled: true,
	},
	{
		provider: "deno deploy production",
		env: { DENO_DEPLOY: "true", DENO_TIMELINE: "production" },
		styled: false,
	},
	{ provider: "fly staging", env: { FLY_ENV: "staging" }, styled: true },
	{ provider: "fly production", env: { FLY_ENV: "production" }, styled: false },
	{
		provider: "heroku pr",
		env: { DYNO: "web.1", HEROKU_PR_NUMBER: "42" },
		styled: true,
	},
	{ provider: "heroku production", env: { DYNO: "web.1" }, styled: false },
	{ provider: "zerops staging", env: { ZEROPS_ENV: "staging" }, styled: true },
	{
		provider: "sevalla staging",
		env: { SEVALLA_ENV: "staging" },
		styled: true,
	},
	{
		provider: "digitalocean staging",
		env: { DO_ENV: "staging" },
		styled: true,
	},
	{ provider: "no platform (default)", env: {}, styled: false },
];

const APPS: Record<
	string,
	{
		build: string[];
		scenarios: Scenario[];
		verify: (dir: string, s: Scenario, label: string) => void;
	}
> = {
	nextjs: {
		build: ["pnpm", "exec", "next", "build"],
		scenarios: [
			{
				provider: "vercel preview",
				env: { VERCEL_ENV: "preview" },
				styled: true,
			},
			{
				provider: "vercel production",
				env: { VERCEL_ENV: "production" },
				styled: false,
			},
		],
		verify(dir, s, label) {
			assertIcon(
				path.join(dir, "public", OUT_DIR, "icon.png"),
				s.styled,
				label,
			);
			const manifest = readFileSync(
				path.join(dir, ".next", "routes-manifest.json"),
				"utf8",
			);
			assert.equal(
				manifest.includes(TINTED_ICON_URL),
				s.styled,
				`${label}: routes-manifest rewrites ${s.styled ? "missing" : "present"}`,
			);
		},
	},
	"vite-react": {
		build: ["pnpm", "exec", "vite", "build"],
		scenarios: PROVIDER_MATRIX,
		verify(dir, s, label) {
			assertIcon(path.join(dir, "dist", OUT_DIR, "icon.png"), s.styled, label);
			const html = readFileSync(path.join(dir, "dist", "index.html"), "utf8");
			assert.equal(
				html.includes(TINTED_ICON_URL),
				s.styled,
				`${label}: index.html icon link ${s.styled ? "missing" : "present"}`,
			);
		},
	},
	"tanstack-start": {
		build: ["pnpm", "exec", "vite", "build"],
		scenarios: [
			{
				provider: "railway pr",
				env: { RAILWAY_ENVIRONMENT: "pr-42" },
				styled: true,
			},
			{ provider: "no platform (default)", env: {}, styled: false },
		],
		verify(dir, s, label) {
			assertIcon(
				path.join(dir, ".output", "public", OUT_DIR, "icon.png"),
				s.styled,
				label,
			);
		},
	},
};

function assertIcon(file: string, styled: boolean, label: string) {
	if (styled) {
		assert.ok(existsSync(file), `${label}: missing tinted icon ${file}`);
		assert.ok(statSync(file).size > 0, `${label}: tinted icon is empty`);
	} else {
		assert.ok(!existsSync(file), `${label}: unexpected tinted icon ${file}`);
	}
}

function run(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv) {
	return new Promise<{ status: number | null; output: string }>((resolve) => {
		const child = spawn(cmd, args, { cwd, env });
		let output = "";
		child.stdout.on("data", (d) => {
			output += d;
		});
		child.stderr.on("data", (d) => {
			output += d;
		});
		child.on("close", (status) => resolve({ status, output }));
	});
}

// Live status table on a TTY, plain per-scenario lines otherwise (CI logs
// would render the redraw escape codes as garbage). Redraws in place. When
// the table is taller than the viewport a full repaint would scroll forever,
// since cursor-up can't cross the screen top, so completed rows collapse into
// the header counter and only active rows render.
const TTY = process.stdout.isTTY === true;
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const REDRAW_INTERVAL_MS = 80;

type Row = {
	app: string;
	provider: string;
	status: "pending" | "running" | "ok" | "fail";
	ms?: number;
};

const rows: Row[] = Object.entries(APPS).flatMap(([app, { scenarios }]) =>
	scenarios.map((s): Row => ({ app, provider: s.provider, status: "pending" })),
);
const finished: Row[] = []; // in completion order, for the collapsed view
const failureOutputs: string[] = [];

const APP_COL_WIDTH = Math.max(...rows.map((r) => r.app.length));
const PROVIDER_COL_WIDTH = Math.max(...rows.map((r) => r.provider.length));

let spinnerFrame = 0;
function formatRow(row: Row): string {
	const icon = {
		pending: "\x1b[2m·\x1b[0m",
		running: `\x1b[36m${SPINNER_FRAMES[spinnerFrame % SPINNER_FRAMES.length]}\x1b[0m`,
		ok: "\x1b[32m✔\x1b[0m",
		fail: "\x1b[31m✘\x1b[0m",
	}[row.status];
	const time =
		row.ms === undefined ? "" : `\x1b[2m${(row.ms / 1000).toFixed(1)}s\x1b[0m`;
	return ` ${icon} ${row.app.padEnd(APP_COL_WIDTH)}  ${row.provider.padEnd(PROVIDER_COL_WIDTH)}  ${time}`;
}

let lastFrameLineCount = 0;
function redrawTable(): void {
	spinnerFrame++;
	const done = rows.filter((r) => r.status === "ok").length;
	const failed = rows.filter((r) => r.status === "fail").length;
	const runningRows = rows.filter((r) => r.status === "running");
	const queued = rows.filter((r) => r.status === "pending").length;
	let stats = `${done}/${rows.length} ok · ${runningRows.length} running · ${queued} queued`;
	if (failed > 0) stats += ` · \x1b[0m\x1b[31m${failed} failed\x1b[0m\x1b[2m`;
	const header = `\x1b[1mbuild scenarios\x1b[0m  \x1b[2m${stats}\x1b[0m`;

	// total frame lines must stay under the viewport height, or cursor-up
	// clamps at the screen top and every repaint appends instead of replacing
	const lineBudget = Math.max(4, (process.stdout.rows || 24) - 2);
	let body: string[];
	if (rows.length + 1 <= lineBudget) {
		body = rows.map(formatRow);
	} else {
		// log-style window: recent finishes scroll up checked-off, every
		// running spinner stays pinned at the bottom, queue lives in the header
		const finishedSlots = Math.max(0, lineBudget - 1 - runningRows.length);
		body = [...finished.slice(-finishedSlots), ...runningRows].map(formatRow);
	}

	const lines = [header, ...body];
	let frame = lastFrameLineCount > 0 ? `\x1b[${lastFrameLineCount}A` : "";
	frame += lines.map((line) => `\x1b[2K${line}\n`).join("");
	frame += "\x1b[0J"; // wipe leftovers when this frame is shorter than the last
	process.stdout.write(frame);
	lastFrameLineCount = lines.length;
}

async function runApp(app: string) {
	const { build, scenarios, verify } = APPS[app];
	const dir = path.resolve("examples", app);
	const appRows = rows.filter((r) => r.app === app);
	for (const [index, scenario] of scenarios.entries()) {
		const label = `${app} / ${scenario.provider}`;
		const row = appRows[index];
		row.status = "running";
		const started = Date.now();
		try {
			// stale artifacts from a previous scenario must not satisfy assertions
			for (const stale of [".next", "dist", ".output", `public/${OUT_DIR}`]) {
				rmSync(path.join(dir, stale), { recursive: true, force: true });
			}
			const env = { ...process.env };
			for (const key of DETECTION_VARS) delete env[key];
			Object.assign(env, scenario.env);

			const [cmd, ...args] = build;
			const result = await run(cmd, args, dir, env);
			if (result.status !== 0) {
				failureOutputs.push(result.output);
				throw new Error(`build failed: ${label}`);
			}
			verify(dir, scenario, label);
			row.status = "ok";
			row.ms = Date.now() - started;
			finished.push(row);
			if (!TTY) console.log(`ok  ${label} (${(row.ms / 1000).toFixed(1)}s)`);
		} catch (error) {
			row.status = "fail";
			row.ms = Date.now() - started;
			finished.push(row);
			throw error;
		}
	}
	return scenarios.length;
}

// Drift guards: a new example dir or a new provider var in env.ts must fail
// this script until it covers them.
const exampleDirs = readdirSync("examples", { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name)
	.sort();
assert.deepEqual(
	exampleDirs,
	Object.keys(APPS).sort(),
	"examples/ and the APPS table have drifted; every example needs an APPS entry",
);

const envSource = readFileSync("packages/env.style/src/env.ts", "utf8");
const exercised = new Set(
	Object.values(APPS).flatMap(({ scenarios }) =>
		scenarios.flatMap((s) => Object.keys(s.env)),
	),
);
for (const match of envSource.matchAll(/env\?\.([A-Z][A-Z0-9_]*)/g)) {
	const name = match[1];
	assert.ok(
		DETECTION_VARS.includes(name),
		`env.ts reads ${name} but DETECTION_VARS doesn't scrub it`,
	);
	assert.ok(
		exercised.has(name),
		`env.ts reads ${name} but no build scenario exercises it`,
	);
}

let redrawTimer: NodeJS.Timeout | undefined;
if (TTY) {
	process.stdout.write("\x1b[?25l"); // hide cursor during redraws
	process.on("SIGINT", () => {
		process.stdout.write("\x1b[?25h");
		process.exit(130);
	});
	redrawTable();
	redrawTimer = setInterval(redrawTable, REDRAW_INTERVAL_MS);
}
const results = await Promise.allSettled(Object.keys(APPS).map(runApp));
if (redrawTimer) {
	clearInterval(redrawTimer);
	redrawTable();
	process.stdout.write("\x1b[?25h");
}
for (const output of failureOutputs) console.error(output);
const failures = results.filter((r) => r.status === "rejected");
for (const f of failures) console.error(String(f.reason));
const passed = results
	.filter((r) => r.status === "fulfilled")
	.reduce((n, r) => n + r.value, 0);
console.log(
	`\n${passed} build scenarios passed${failures.length ? `, ${failures.length} app chain(s) FAILED` : ""}`,
);
if (failures.length) process.exit(1);
