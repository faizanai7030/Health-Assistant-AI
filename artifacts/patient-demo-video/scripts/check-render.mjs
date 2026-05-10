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

  // Pain scene starts at 6s, all 5 solutions appear at 6+10.5+8.5 = ~25s from load
  await page.waitForTimeout(22000); // 25s total — all 5 solution bullets visible
  await page.screenshot({ path: `${OUT}/solutions-all5.png` });

  // Phase 3 tagline (6+20.3 = ~26.3s from load)
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/solutions-tagline.png` });

  await browser.close();
  console.log('Done');
}

main().catch(e => { console.error(e); process.exit(1); });
