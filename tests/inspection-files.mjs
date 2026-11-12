// tests/inspection-files.mjs
// Unit tests for inspection-files.mjs

import { test, describe } from "node:test";
import assert from "node:assert";
import { deepEqual, equal } from "node:assert";
import { resolve } from "path";
import { defaultOutDir, screenshotPaths, reportPath } from "../lib/inspection-files.mjs";

describe("inspection-files", () => {
  test("defaultOutDir for local file (pages/about.html)", () => {
    const dir = defaultOutDir("pages/about.html");
    assert(dir.includes(".taste-skill/inspect-"));
    assert(dir.includes("-pages-about"));
  });

  test("defaultOutDir for local file (pages/about/index.html)", () => {
    const dir = defaultOutDir("pages/about/index.html");
    assert(dir.includes(".taste-skill/inspect-"));
    assert(dir.includes("-pages-about"));
  });

  test("defaultOutDir for URL", () => {
    const dir = defaultOutDir("https://example.com/blog/post");
    assert(dir.endsWith(".taste-skill/inspect-example-com-blog-post"));
  });

  test("defaultOutDir for URL with www", () => {
    const dir = defaultOutDir("https://www.example.com/path");
    assert(dir.endsWith(".taste-skill/inspect-example-com-path"));
  });
  test("defaultOutDir fallback for unknown", () => {
    const dir = defaultOutDir("just-a-name");
    assert(dir.includes(".taste-skill/inspect-"));
    assert(dir.includes("-just-a-name"));
  });

  test("screenshotPaths generates correct paths", () => {
    const dir = "/tmp/test";
    const paths = screenshotPaths(dir, [1440, 768]);
    deepEqual(paths, [
      resolve(dir, "1440px-fold.jpg"),
      resolve(dir, "768px-fold.jpg")
    ]);
  });

  test("reportPath generates correct path", () => {
    const dir = "/tmp/test";
    const path = reportPath(dir);
    equal(path, resolve(dir, "report.txt"));
  });
});
