// Playwright screen-recording export for the demo video
import { chromium } from '/home/runner/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Total video duration: hook(6)+pain(24)+whatsapp(26)+dashboard(9)+doctors(9)+portal(15)+reminders(9)+outro(8) = 106s
const TOTAL_MS   = 106_000;
const BUFFER_MS  = 5_000;
const RECORD_MS  = TOTAL_MS + BUFFER_MS;

const OUT_DIR    = path.join(__dirname, '..', 'output');
const FINAL_PATH = path.join(OUT_DIR, 'demo-video.webm');

// Use the direct Vite port so we bypass the mTLS proxy
// Read the port from .replit-artifact/artifact.toml or fall back to the proxy
const VIDEO_URL  = process.env.VIDEO_URL ?? 'http://localhost:80/patient-demo-video/?export=1';

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Recording ${RECORD_MS / 1000}s from: ${VIDEO_URL}`);

  // Use the NixOS-native Chromium (has correct RPATH for this system)
  const NIX_CHROMIUM = '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium';
  const browser = await chromium.launch({
    executablePath: NIX_CHROMIUM,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
  });

  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: OUT_DIR,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await ctx.newPage();

  await page.goto(VIDEO_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  console.log('Page loaded — recording...');

  // Tick progress every 10 seconds
  const interval = setInterval(() => {
    process.stdout.write('.');
  }, 10_000);

  await page.waitForTimeout(RECORD_MS);
  clearInterval(interval);
  console.log('\nDone recording — saving file...');

  const tmpPath = await page.video()?.path();
  await ctx.close();
  await browser.close();

  if (tmpPath && fs.existsSync(tmpPath)) {
    if (fs.existsSync(FINAL_PATH)) fs.unlinkSync(FINAL_PATH);
    fs.renameSync(tmpPath, FINAL_PATH);
    const size = (fs.statSync(FINAL_PATH).size / 1_048_576).toFixed(1);
    console.log(`✅ Saved: ${FINAL_PATH} (${size} MB)`);
  } else {
    console.error('❌ Could not locate recorded video file.');
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
