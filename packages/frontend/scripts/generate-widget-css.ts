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

function generateThemeBlock(
  themeName: string,
  tokens: any,
  rootSelector: string,
  isCompound: boolean,
): string {
  const vars = generateCssVariables(tokens, "widget");
  const isDefault = themeName === "light";

  let selector;
  if (rootSelector === ":host") {
    // Shadow DOM logic
    selector = isDefault ? ":host" : `:host .theme-${themeName}`;
  } else {
    // Preview logic (Compound class)
    // If isDefault, we want base variables on the root.
    // If named theme, we want override variables on the root WITH that class.
    selector = isDefault
      ? rootSelector
      : `${rootSelector}.theme-${themeName}`;
  }

  // Map semantic primary colors to the variables used in widget styles
  const primaryOverrides = `
  --widget-primary-color: ${tokens.primary};
  --widget-text-on-primary: ${tokens.primaryForeground};
  --widget-primary-gradient: linear-gradient(135deg, var(--widget-primary-color), var(--widget-primary-color)));`;

  return `${selector} {
${primaryOverrides}
${vars}
}`;
}

function generateCssContent(rootSelector: string, isCompound: boolean): string {
  const themeBlocks = Object.entries(themeTokens)
    .map(([name, tokens]) =>
      generateThemeBlock(name, tokens, rootSelector, isCompound),
    )
    .join("\n\n");

  // Generate shadow/common vars block
  // Need to gather all theme names for the specific overrides
  const themeNames = Object.keys(themeTokens).filter((t) => t !== "light");
  const darkThemeSelectors = themeNames
    .map((name) =>
      rootSelector === ":host"
        ? `:host .theme-${name}`
        : `${rootSelector}.theme-${name}`,
    )
    .join(", \n");

  return `/* AUTO-GENERATED from tokens.ts — DO NOT EDIT MANUALLY */
/* Run: npm run generate:widget-css */

${themeBlocks}

/* Global Shadows & Common Vars */
${rootSelector} {
  --widget-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --widget-shadow-glow: 0 0 15px rgba(139, 92, 246, 0.3);
}

${darkThemeSelectors} {
  --widget-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
  --widget-shadow-glow: 0 0 20px rgba(139, 92, 246, 0.2);
}
`;
}

// 1. Generate Production CSS (:host)
const prodCss = generateCssContent(":host", false);
const prodPath = path.resolve(
  __dirname,
  "../src/widget/styles/_generated-vars.css",
);
fs.writeFileSync(prodPath, prodCss, "utf-8");
console.log(`✅ Generated Production CSS: ${prodPath}`);

// 2. Generate Preview CSS (.widget-preview-root)
const previewCss = generateCssContent(".widget-preview-root", true);
const previewPath = path.resolve(
  __dirname,
  "../src/widget/styles/_generated-preview-vars.css",
);
fs.writeFileSync(previewPath, previewCss, "utf-8");
console.log(`✅ Generated Preview CSS: ${previewPath}`);
