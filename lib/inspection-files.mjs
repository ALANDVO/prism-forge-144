
// lib/inspection-files.mjs
// File handling utilities for inspection runs

import { URL } from "url";
import { resolve, dirname, basename, extname, sep } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const TASTE_DIR = resolve(PROJECT_ROOT, ".taste-skill");

/**
 * Slugify a string for use as a directory name
 */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/**
 * Derive a default output directory from the target (file path or URL)
 * - Local file: pages/about.html → .taste-skill/inspect-pages-about
 * - Local file: pages/about/index.html → .taste-skill/inspect-pages-about
 * - URL: https://example.com/path → .taste-skill/inspect-example-com-path
 * - Fallback: .taste-skill/inspect-page
 */
export function defaultOutDir(target) {
  try {
    const url = new URL(target);
    // It's a valid URL
    const host = url.hostname.replace(/^www\./, "");
    const path = url.pathname.replace(/^\/|\/$/g, "").replace(/\/index\.html?$/, "");
    const slug = slugify(`${host}-${path || "root"}`);
    return resolve(TASTE_DIR, `inspect-${slug}`);
  } catch {
    // Not a URL, treat as local file path
    const resolved = resolve(target);
    const relative = resolved.startsWith(PROJECT_ROOT + sep)
      ? resolved.slice(PROJECT_ROOT.length + 1)
      : basename(resolved);
    
    // Remove extension and index.html
    let slug = relative
      .replace(/\.(html?|htm)$/i, "")
      .replace(/\/index$/i, "")
      .replace(/[\\/]+/g, "-");
    
    if (!slug) slug = "page";
    slug = slugify(slug);
    return resolve(TASTE_DIR, `inspect-${slug}`);
  }
}

/**
 * Ensure the output directory exists and is empty
 */
export async function prepareOutDir(outDir) {
  const { mkdir, rm, stat } = await import("fs/promises");
  try {
    await stat(outDir);
    await rm(outDir, { recursive: true, force: true });
  } catch {
    // Directory doesn't exist, that's fine
  }
  await mkdir(outDir, { recursive: true });
  return outDir;
}

/**
 * Get screenshot paths for a given output directory and viewport widths
 */
export function screenshotPaths(outDir, widths) {
  return widths.map((w) => resolve(outDir, `${w}px-fold.jpg`));
}

/**
 * Get the report path for a given output directory
 */
export function reportPath(outDir) {
  return resolve(outDir, "report.txt");
}

export { TASTE_DIR, PROJECT_ROOT };
