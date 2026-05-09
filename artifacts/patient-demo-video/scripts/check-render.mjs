import { chromium } from '/home/runner/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NIX_CHROMIUM = '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium';

async function main() {
  const browser = await chromium.launch({
    executablePath: NIX_CHROMIUM,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
  });

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:80/patient-demo-video/?export=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // let scene render
  await page.screenshot({ path: path.join(__dirname, '..', 'output', 'check-3s.png'), fullPage: false });

  await page.waitForTimeout(7000);
  await page.screenshot({ path: path.join(__dirname, '..', 'output', 'check-10s.png'), fullPage: false });

  await browser.close();
  console.log('Screenshots saved to output/');
}

main().catch(e => { console.error(e); process.exit(1); });
