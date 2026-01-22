#!/usr/bin/env node
/**
 * Build script for frontend-safe DTOs.
 * Pre-processes TypeScript source to remove decorators, then compiles.
 */

import * as esbuild from "esbuild";
import { copyFile, mkdir, rm, readFile, writeFile, cp } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";
import { glob } from "glob";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = join(__dirname, "..");
const SRC_DIR = join(ROOT, "src");
const TEMP_DIR = join(ROOT, ".frontend-temp");
const OUT_DIR = join(ROOT, "dist", "frontend");
const TYPES_DIR = join(ROOT, "dist", "esm");

// Decorator import packages to remove
const DECORATOR_PACKAGES = [
  "class-validator",
  "class-transformer",
  "@nestjs/swagger",
  "@nestjs/mapped-types",
];

/**
 * Find the matching closing parenthesis, handling nesting and strings.
 */
function findMatchingParen(content: string, startIndex: number): number {
  let depth = 0;
  let inString: string | null = null;
  let escaped = false;

  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (inString) {
      if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = char;
      continue;
    }

    if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * Strip all decorators and their imports from TypeScript source.
 */
function stripDecorators(content: string): string {
  // Remove decorator imports
  for (const pkg of DECORATOR_PACKAGES) {
    const escapedPkg = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const importPattern = new RegExp(
      `^import\\s*\\{[^}]*\\}\\s*from\\s*["']${escapedPkg}["'];?\\s*$`,
      "gm",
    );
    content = content.replace(importPattern, "");
  }

  // Remove decorators with proper parenthesis matching
  let result = "";
  let i = 0;

  while (i < content.length) {
    // Check for @ at line start or after whitespace/newline
    if (content[i] === "@" && (i === 0 || /[\s\n]/.test(content[i - 1]))) {
      // Check if followed by identifier
      const afterAt = content.slice(i + 1);
      const identifierMatch = afterAt.match(/^(\w+)/);

      if (identifierMatch) {
        const decoratorName = identifierMatch[1];
        let endIndex = i + 1 + decoratorName.length;

        // Skip whitespace
        while (endIndex < content.length && /\s/.test(content[endIndex])) {
          endIndex++;
        }

        // Check for opening parenthesis
        if (content[endIndex] === "(") {
          const closingParen = findMatchingParen(content, endIndex);
          if (closingParen !== -1) {
            // Skip the entire decorator including parentheses
            i = closingParen + 1;
            // Skip trailing whitespace/newline
            while (i < content.length && /[\s\n]/.test(content[i])) {
              i++;
            }
            continue;
          }
        } else {
          // Decorator without parentheses (e.g., @Injectable)
          i = endIndex;
          // Skip trailing whitespace/newline
          while (i < content.length && /[\s\n]/.test(content[i])) {
            i++;
          }
          continue;
        }
      }
    }

    result += content[i];
    i++;
  }

  // Clean up excessive blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result;
}

async function stripDecoratorsFromSource(filePath: string): Promise<void> {
  const content = await readFile(filePath, "utf-8");
  const stripped = stripDecorators(content);
  await writeFile(filePath, stripped, "utf-8");
}

async function main(): Promise<void> {
  console.log("Building frontend-safe DTOs...");

  // Clean directories
  if (existsSync(TEMP_DIR)) {
    await rm(TEMP_DIR, { recursive: true });
  }
  if (existsSync(OUT_DIR)) {
    await rm(OUT_DIR, { recursive: true });
  }
  await mkdir(TEMP_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  // Copy source to temp
  await cp(SRC_DIR, TEMP_DIR, { recursive: true });
  console.log("Copied source to temp directory");

  // Strip decorators from temp source files
  const tempFiles = await glob("**/*.ts", { cwd: TEMP_DIR, absolute: true });
  for (const file of tempFiles) {
    await stripDecoratorsFromSource(file);
  }
  console.log(`Stripped decorators from ${tempFiles.length} source files`);

  // Compile with esbuild
  await esbuild.build({
    entryPoints: tempFiles,
    outdir: OUT_DIR,
    format: "esm",
    target: "es2022",
    bundle: false,
    sourcemap: false,
  });
  console.log("Compiled stripped source");

  // Copy type declarations from ESM build
  const dtsFiles = await glob("**/*.d.ts", { cwd: TYPES_DIR, absolute: true });
  for (const file of dtsFiles) {
    const relativePath = file.replace(TYPES_DIR, "");
    const outPath = join(OUT_DIR, relativePath);
    await mkdir(dirname(outPath), { recursive: true });
    await copyFile(file, outPath);
  }

  // Clean up temp directory
  await rm(TEMP_DIR, { recursive: true });

  console.log(`Built ${tempFiles.length} files to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
