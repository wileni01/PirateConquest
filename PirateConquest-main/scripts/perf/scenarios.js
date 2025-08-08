// Puppeteer runner to automate perf capture in headless Chrome
// Usage: node scripts/perf/scenarios.js http://localhost:5173
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const baseUrl = process.argv[2] || 'http://localhost:5173';

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const url = baseUrl.includes('?') ? baseUrl + '&perf=1' : baseUrl + '?perf=1';
  const outDir = path.resolve('perf');
  fs.mkdirSync(outDir, { recursive: true });
  const csvs = {};

  page.on('console', async (msg) => {
    try {
      const text = msg.text();
      if (text.startsWith('METRIC_CSV:')) {
        const [header, data] = text.split('|');
        const filename = header.substring('METRIC_CSV:'.length);
        csvs[filename] = data;
      }
    } catch {}
  });

  await page.goto(url, { waitUntil: 'networkidle2' });
  // Wait until harness completes
  await page.waitForFunction('window.performance && document.body');
  await page.waitForFunction(() => {
    const logs = performance.getEntriesByType('navigation');
    return !!logs; // just to ensure page settled
  });

  // Wait max 5 minutes or until PERF_DONE log appears
  let done = false;
  page.on('console', (msg) => {
    if (msg.text().includes('PERF_DONE')) done = true;
  });
  const start = Date.now();
  while (!done && Date.now() - start < 5 * 60 * 1000) {
    await new Promise((r) => setTimeout(r, 1000));
  }

  for (const [name, content] of Object.entries(csvs)) {
    fs.writeFileSync(path.join(outDir, name), content, 'utf8');
    console.log('wrote', name);
  }

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


