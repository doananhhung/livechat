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
  tokens: Record<string, any>,
  prefix: string,
): string {
  return Object.entries(tokens)
    .map(([key, value]) => `  --${prefix}-${toKebabCase(key)}: ${value};`)
    .join("\n");
}

function generateThemeBlock(themeName: string, tokens: any): string {
  const vars = generateCssVariables(tokens, "widget");
  const isDefault = themeName === "light";
  const selector = isDefault ? ":host" : `:host .theme-${themeName}`;

  // Map semantic primary colors to the variables used in widget styles
  const primaryOverrides = `
  --widget-primary-color: ${tokens.primary};
  --widget-text-on-primary: ${tokens.primaryForeground};
  --widget-primary-gradient: linear-gradient(135deg, var(--widget-primary-color), var(--widget-primary-color));`;

  return `${selector} {
${primaryOverrides}
${vars}
}`;
}

const themeBlocks = Object.entries(themeTokens)
  .map(([name, tokens]) => generateThemeBlock(name, tokens))
  .join("\n\n");

const cssContent = `/* AUTO-GENERATED from tokens.ts — DO NOT EDIT MANUALLY */
/* Run: npm run generate:widget-css */

${themeBlocks}

/* Global Shadows & Common Vars */
:host {
  --widget-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --widget-shadow-glow: 0 0 15px rgba(139, 92, 246, 0.3);
}

:host .theme-dark, 
:host .theme-oled-void, 
:host .theme-dracula, 
:host .theme-nordic-frost, 
:host .theme-cyberpunk, 
:host .theme-terminal, 
:host .theme-solarized-dark {
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