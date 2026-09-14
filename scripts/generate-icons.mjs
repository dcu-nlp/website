import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

// Use the header's exact image mask and colour palette, without redrawing the logo.
const source = 'public/images/branding/nlp-applications-group-logo-cropped.png';
const { width, height } = await sharp(source).metadata();
const colour = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="base"><stop stop-color="#013c42" stop-opacity=".98"/><stop offset=".56" stop-color="#0fa4af" stop-opacity=".92"/><stop offset="1" stop-color="#964734" stop-opacity=".96"/></linearGradient><radialGradient id="accent" cx="14%" cy="24%" r="28%"><stop stop-color="#d18a68" stop-opacity=".92"/><stop offset="1" stop-color="#d18a68" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#base)"/><rect width="100%" height="100%" fill="url(#accent)"/></svg>`,
);
const logo = await sharp(colour)
  .composite([{ input: await readFile(source), blend: 'dest-in' }])
  .trim()
  .png()
  .toBuffer();
for (const [name, size] of [
  ['nlp-favicon', 64],
  ['apple-touch-icon', 180],
  ['nlp-icon-192', 192],
  ['nlp-icon-512', 512],
]) {
  await sharp(logo)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(`public/${name}.png`);
}
// Keep the old icon URL consistent for clients that still request it.
const png = (await readFile('public/nlp-favicon.png')).toString('base64');
await writeFile(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>NLP Applications Group</title><image width="64" height="64" href="data:image/png;base64,${png}"/></svg>\n`,
);
