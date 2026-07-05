"use client";

import { useEffect, useRef, useState } from "react";
import { FrameworkSelect } from "./playground/framework-select";
import { CONFIG_FILES, usePlayground } from "./playground/provider";

type OptionId = "favicon" | "environment" | "color" | "icon" | "excludeColors";

const OPTIONS: {
  id: OptionId;
  prefix: string;
  value: string;
  type: string;
  description: string;
}[] = [
  {
    id: "favicon",
    prefix: "favicon: ",
    value: "true",
    type: "boolean — default true",
    description:
      "The kill switch. Set false and env.style does nothing at all — handy for switching it off in a specific environment or CI job.",
  },
  {
    id: "environment",
    prefix: "environment: ",
    value: "'staging'",
    type: "string",
    description:
      "Force the environment instead of detecting it. Without it, detection is ENV_STYLES_ENV, then Vercel's environment, then the framework default.",
  },
  {
    id: "color",
    prefix: "color: { staging: ",
    value: "'#ff00ff'",
    type: "Partial<Record<string, string>>",
    description:
      "Tint color per environment. Anything you don't set keeps the defaults — blue for development, amber for preview, gray for everything else.",
  },
  {
    id: "icon",
    prefix: "icon: { staging: ",
    value: "'./flask.svg'",
    type: "string | Partial<Record<string, string>>",
    description:
      "A ready-made icon — one for all styled environments, or one per environment. Served as-is, never tinted. Environments missing from the map fall back to tinting.",
  },
  {
    id: "excludeColors",
    prefix: "excludeColors: [",
    value: "'#e94435'",
    type: "string[]",
    description:
      "Pixels close to these colors keep their original color when tinting — protects a brand mark inside your favicon.",
  },
];

// suffix closes whatever the prefix opened, so it stays dimmed with the prefix
const SUFFIXES: Record<OptionId, string> = {
  favicon: ",",
  environment: ",",
  color: " },",
  icon: " },",
  excludeColors: "],",
};

// wrapper lines around the option rows, dimmer than the interactive lines
const SCAFFOLD = {
  next: {
    open: "export default withEnvStyles(nextConfig, {",
    close: "});",
    indent: "  ",
  },
  vite: {
    open: "export default defineConfig({\n  plugins: [\n    react(),\n    envStyle({",
    close: "    }),\n  ],\n});",
    indent: "      ",
  },
} as const;

// interval for the passive tour that cycles the selection until the user interacts
const TOUR_INTERVAL_MS = 2600;

export function OptionsGuide() {
  const { state } = usePlayground();
  const [selected, setSelected] = useState<OptionId>("color");
  const touringRef = useRef(true);
  const active = OPTIONS.find((option) => option.id === selected)!;
  const scaffold = SCAFFOLD[state.file];

  // auto-cycles the selection as a passive tour; stops for good on first click
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = setInterval(() => {
      if (!touringRef.current) return;
      setSelected((current) => {
        const index = OPTIONS.findIndex((option) => option.id === current);
        return OPTIONS[(index + 1) % OPTIONS.length].id;
      });
    }, TOUR_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  function handleSelect(id: OptionId) {
    touringRef.current = false;
    setSelected(id);
  }

  // pulled up into the sticky run-out; the curtain's solid zone hides the preview behind it.
  // -mt-56 pairs with the left column's pb-110 — retune together
  return (
    <section className="relative z-20 mt-24 flex flex-col gap-8 lg:-mt-56">
      <h2 className="text-2xl font-semibold tracking-tight">
        Everything you can tune
      </h2>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="font-mono text-xs text-muted-foreground">
            {CONFIG_FILES[state.file]}
          </span>
          <FrameworkSelect />
        </div>
        <div className="grid lg:grid-cols-2">
          <div className="border-b border-border p-16 font-mono text-[13px] leading-loose whitespace-pre lg:border-b-0 lg:border-r lg:border-border">
            <p className="text-muted-foreground/60">{scaffold.open}</p>
            {OPTIONS.map((option) => {
              const isSelected = selected === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelect(option.id)}
                  className={`block w-full cursor-pointer border-l-2 pl-2 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-muted"
                      : "border-transparent hover:bg-muted/50"
                  }`}
                >
                  <span className="text-muted-foreground">
                    {scaffold.indent}
                    {option.prefix}
                  </span>
                  <span className="text-foreground">{option.value}</span>
                  <span className="text-muted-foreground">{SUFFIXES[option.id]}</span>
                </button>
              );
            })}
            <p className="text-muted-foreground/60">{scaffold.close}</p>
          </div>
          <div className="flex flex-col gap-2 p-16 lg:min-h-44">
            <span className="font-mono text-sm font-medium">{active.id}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {active.type}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {active.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
