#!/usr/bin/env node
/**
 * Generates widget CSS variables from tokens.ts
 * Run: npm run generate:widget-css
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { themeTokens } from "../src/theme/tokens.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toKebabCase = (str: string): string =>
  str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

function generateCssVariables(
  tokens: Record<string, string>,
  prefix: string,
): string {
  return Object.entries(tokens)
    .map(([key, value]) => `  --${prefix}-${toKebabCase(key)}: ${value};`)
    .join("\n");
}

const lightVars = generateCssVariables(themeTokens.light, "widget");
const darkVars = generateCssVariables(themeTokens.dark, "widget");

const cssContent = `/* AUTO-GENERATED from tokens.ts — DO NOT EDIT MANUALLY */
/* Run: npm run generate:widget-css */

:host {
  /* Primary accent (keep these as they are configurable) */
  --widget-primary-color: hsl(262 83% 58%);
  --widget-primary-gradient: linear-gradient(135deg, var(--widget-primary-color), hsl(280 80% 50%));
  --widget-text-on-primary: #ffffff;

  /* Generated from tokens.ts */
${lightVars}

  /* Shadows */
  --widget-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --widget-shadow-glow: 0 0 15px rgba(139, 92, 246, 0.3);
}

/* Dark Mode Overrides */
:host .theme-dark {
  /* Generated from tokens.ts */
${darkVars}

  /* Shadows for dark mode */
  --widget-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
  --widget-shadow-glow: 0 0 20px rgba(139, 92, 246, 0.2);
}
`;

const outputPath = path.resolve(
  __dirname,
  "../src/widget/styles/_generated-vars.css",
);
fs.writeFileSync(outputPath, cssContent, "utf-8");
console.log(`✅ Generated: ${outputPath}`);
