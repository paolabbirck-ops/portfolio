// Gera os PDFs do currículo a partir dos HTMLs desta pasta.
// Uso: NODE_PATH=$(npm root -g) node curriculo/src/build.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '..');

const jobs = [
  ['cv_pt.html', 'Paola_Bertoni_Product_Designer_UX_UI.pdf'],
  ['cv_en.html', 'Paola_Bertoni_Product_Designer_UX_UI_EN.pdf'],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [src, pdf] of jobs) {
  if (!fs.existsSync(path.join(here, src))) continue;
  await page.goto('file://' + path.join(here, src));
  await page.evaluate(() => document.fonts.ready);
  // Página com largura fixa (595pt) e altura ajustada ao conteúdo, como no layout original.
  const heightPx = await page.evaluate(() => document.querySelector('.page').getBoundingClientRect().height);
  const heightPt = Math.max(1011, Math.ceil(heightPx * 0.75));
  await page.pdf({
    path: path.join(out, pdf),
    width: (595 / 72).toFixed(4) + 'in',
    height: (heightPt / 72).toFixed(4) + 'in',
    printBackground: true,
    tagged: true,
    outline: false,
  });
  console.log(pdf, heightPt + 'pt');
}
await browser.close();
