// scripts/inspect.mjs
// CLI for design taste inspection

import { program } from "commander";
import { fileURLToPath } from "url";
import { dirname, resolve, sep } from "path";
import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { defaultOutDir, prepareOutDir, screenshotPaths, reportPath, PROJECT_ROOT } from "../lib/inspection-files.mjs";
import { findEyebrows } from "../lib/probe.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

program
  .name("inspect")
  .description("Inspect a page for design taste issues")
  .argument("<target>", "Local HTML file or URL to inspect")
  .option("-w, --widths <widths...>", "Viewport widths to test", [1440])
  .option("-o, --out <dir>", "Output directory (default: derived from target)")
  .option("-a, --allow <checks...>", "Checks to allow (suppress)", [])
  .option("--no-screenshots", "Skip screenshot capture")
  .parse(process.argv);

const target = program.args[0];
const widths = program.opts().widths.map(Number);
const outDir = program.opts().out || defaultOutDir(target);
const allow = new Set(program.opts().allow);
const screenshots = program.opts().screenshots;

async function main() {
  const isUrl = /^https?:\/\//.test(target);
  let filePath, serveRoot, pageUrl;

  if (isUrl) {
    pageUrl = target;
  } else {
    filePath = resolve(target);
    const st = await stat(filePath);
    if (!st.isFile()) {
      console.error("[inspect] Target is not a file:", filePath);
      process.exit(1);
    }
    // FIX for Issue #179: serve from the file's directory, not cwd
    serveRoot = dirname(filePath);
    pageUrl = `http://localhost:0/${filePath.slice(serveRoot.length + 1)}`;
  }

  // Prepare output directory
  await prepareOutDir(outDir);
  console.log(`[inspect] Output: ${outDir}`);

  // Start static file server if local file
  let server;
  if (!isUrl) {
    server = createServer(async (req, res) => {
      const urlPath = new URL(req.url, `http://localhost`).pathname;
      const requestedPath = resolve(serveRoot, "." + urlPath);
      
      // Security: prevent directory traversal
      if (!requestedPath.startsWith(serveRoot + sep) && requestedPath !== serveRoot) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      
      try {
        const content = await readFile(requestedPath);
        const ext = requestedPath.split(".").pop().toLowerCase();
        const types = {
          html: "text/html",
          css: "text/css",
          js: "application/javascript",
          mjs: "application/javascript",
          json: "application/json",
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          gif: "image/gif",
          svg: "image/svg+xml",
          ico: "image/x-icon",
          woff: "font/woff",
          woff2: "font/woff2",
          ttf: "font/ttf",
          eot: "application/vnd.ms-fontobject"
        };
        res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end("Not Found");
      }
    });
    
    await new Promise((resolve, reject) => {
      server.listen(0, "localhost", () => resolve());
      server.on("error", reject);
    });
    
    const port = server.address().port;
    pageUrl = `http://localhost:${port}/${filePath.slice(serveRoot.length + 1)}`;
    console.log(`[inspect] Serving from ${serveRoot} on port ${port}`);
  }

  // Launch browser and run checks
  let browser, page;
  try {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.default.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    page = await browser.newPage();
    
    const results = { eyebrow: [] };
    
    for (const width of widths) {
      await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
      await page.goto(pageUrl, { waitUntil: "networkidle0" });
      
      // Take screenshot
      if (screenshots) {
        const screenshotPath = screenshotPaths(outDir, [width])[0];
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`[inspect] Screenshot: ${screenshotPath}`);
      }
      
      // Run probes
      if (!allow.has("eyebrow")) {
        const eyebrows = await page.evaluate(() => {
          // Injected probe functions
          function isInFigcaption(element) {
            let el = element;
            while (el) {
              if (el.tagName === "FIGCAPTION") return true;
              el = el.parentElement;
            }
            return false;
          }
          
          function isInScrollingOrClippingContainer(element) {
            let el = element.parentElement;
            const rect = element.getBoundingClientRect();
            
            while (el) {
              const style = getComputedStyle(el);
              const overflow = style.overflow;
              const overflowX = style.overflowX;
              const overflowY = style.overflowY;
              
              const scrolls = 
                (overflow !== "visible" && overflow !== "clip") ||
                (overflowX !== "visible" && overflowX !== "clip") ||
                (overflowY !== "visible" && overflowY !== "clip");
              
              if (scrolls) {
                const elRect = el.getBoundingClientRect();
                const clipped = 
                  rect.top < elRect.top ||
                  rect.bottom > elRect.bottom ||
                  rect.left < elRect.left ||
                  rect.right > elRect.right;
                
                if (clipped || el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
                  return true;
                }
              }
              el = el.parentElement;
            }
            return false;
          }
          
          function looksLikeKicker(text, fontSize) {
            const trimmed = text.trim();
            if (!trimmed || trimmed.length > 60) return false;
            if (fontSize > 18) return false;
            
            const letters = trimmed.match(/[A-Za-z]/g);
            if (!letters || letters.length < 2) return false;
            const upperCount = letters.filter(c => c === c.toUpperCase()).length;
            return upperCount / letters.length > 0.7;
          }
          
          function getSelector(element) {
            const parts = [];
            let el = element;
            while (el && el !== document.body) {
              let selector = el.tagName.toLowerCase();
              if (el.id) selector += "#" + el.id;
              if (el.className) {
                const classes = el.className.split(/\s+/).filter(c => c);
                if (classes.length) selector += "." + classes.join(".");
              }
              parts.unshift(selector);
              el = el.parentElement;
            }
            return parts.join(" > ").slice(0, 120);
          }
          
          const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
          const results = [];
          
          for (const heading of headings) {
            const headingRect = heading.getBoundingClientRect();
            
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null
            );
            
            const candidates = [];
            let node;
            while ((node = walker.nextNode())) {
              const parent = node.parentElement;
              if (!parent) continue;
              
              const text = node.textContent.trim();
              if (!text) continue;
              
              const rect = parent.getBoundingClientRect();
              const style = getComputedStyle(parent);
              const fontSize = parseFloat(style.fontSize);
              
              if (rect.bottom >= headingRect.top) continue;
              
              const distance = headingRect.top - rect.bottom;
              if (distance < 72 || distance > 140) continue;
              
              if (fontSize > 18) continue;
              
              // FIX for Issue #175: skip figcaption content
              if (isInFigcaption(parent)) continue;
              
              // FIX for Issue #175: skip scrolling/clipping containers
              if (isInScrollingOrClippingContainer(parent)) continue;
              
              if (looksLikeKicker(text, fontSize)) {
                candidates.push({ text, distance, fontSize, element: parent });
              }
            }
            
            if (candidates.length > 0) {
              candidates.sort((a, b) => a.distance - b.distance);
              results.push({
                heading: heading.textContent.trim(),
                headingSelector: getSelector(heading),
                eyebrows: candidates.map(c => ({
                  text: c.text,
                  distance: Math.round(c.distance),
                  fontSize: Math.round(c.fontSize),
                  selector: getSelector(c.element)
                }))
              });
            }
          }
          
          return results;
        });
        
        results.eyebrow.push({ width, findings: eyebrows });
      }
    }
    
    // Write report
    const report = reportPath(outDir);
    let reportContent = `[inspect] ${target}\n`;
    
    for (const { width, findings } of results.eyebrow) {
      if (findings.length > 0) {
        for (const f of findings) {
          if (f.eyebrows.length > 0) {
            const texts = f.eyebrows.map(e => `"${e.text}" above "${f.heading}"`).join("; ");
            reportContent += `  [eyebrow] @${width}px  ${f.eyebrows.length} eyebrow/kicker label(s) above headings: ${texts}\n`;
          }
        }
      }
    }
    
    await import("fs/promises").then(fs => fs.writeFile(report, reportContent));
    console.log(`[inspect] Report: ${report}`);
    console.log(reportContent);
    
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
    if (server) server.close();
  }
}

main().catch(err => {
  console.error("[inspect] Error:", err);
  process.exit(1);
});
