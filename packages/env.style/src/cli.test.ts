import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createDoctorReport, formatDoctorReport } from "./cli";

describe("env.style doctor", () => {
	it("reports the exact provider and variable used", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "envstyle-doctor-"));
		await mkdir(path.join(root, "public"));
		await writeFile(
			path.join(root, "package.json"),
			JSON.stringify({ dependencies: { vite: "^8" } }),
		);
		await writeFile(path.join(root, "public/favicon.svg"), "<svg/>");
		const report = createDoctorReport(root, { VERCEL_ENV: "preview" });
		expect(report).toMatchObject({
			environment: "preview",
			provider: "vercel",
			source: "VERCEL_ENV",
			active: true,
			project: "vite",
			icon: "public/favicon.svg",
		});
		expect(formatDoctorReport(report)).toContain("Environment: preview");
	});

	it("reports production as inactive", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "envstyle-doctor-"));
		await writeFile(
			path.join(root, "package.json"),
			JSON.stringify({ dependencies: { next: "^16" } }),
		);
		expect(createDoctorReport(root, { NODE_ENV: "production" })).toMatchObject({
			environment: "production",
			active: false,
			color: null,
			project: "next",
		});
	});
});
