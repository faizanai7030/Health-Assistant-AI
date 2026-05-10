import { chromium } from '/home/runner/.npm/_npx/0cf6ff1fad43f633/node_modules/playwright-core/index.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'output');
const NIX_CHROMIUM = '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium';

async function main() {
  const browser = await chromium.launch({
    executablePath: NIX_CHROMIUM,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--enable-unsafe-swiftshader',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
    ],
  });

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:80/patient-demo-video/?export=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/frame-03s.png` });

  await page.waitForTimeout(7000); // ~10s total
  await page.screenshot({ path: `${OUT}/frame-10s.png` });

  await page.waitForTimeout(20000); // ~30s total
  await page.screenshot({ path: `${OUT}/frame-30s.png` });

  await page.waitForTimeout(30000); // ~60s total
  await page.screenshot({ path: `${OUT}/frame-60s.png` });

  await browser.close();
  console.log('Done — check output/ for frames');
}

main().catch(e => { console.error(e); process.exit(1); });
