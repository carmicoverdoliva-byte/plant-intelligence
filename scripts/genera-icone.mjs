// Genera le icone dell'app dall'icona master (docs/design/icona-mandragola-master.png).
// Uso: node scripts/genera-icone.mjs
// Usa "sharp", la libreria per immagini che arriva già insieme a Next.js (nessuna dipendenza nuova).
//
// 1. Versione quadrata piena: il master ha angoli arrotondati e un bordino chiaro; iOS e Android arrotondano da soli,
//    quindi nei 4 angoli mettiamo lo sfondo menta (preso dai colori vicini) e teniamo il disegno originale ovunque altro.
// 2. Formati per la PWA: 180 (iPhone), 192 e 512 (manifest), 512 "maskable" con margine, favicon.
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MASTER = path.join(root, "docs/design/icona-mandragola-master.png");
const S = 1254; // lato del master in pixel

async function quadrataPiena() {
  const rgb = await sharp(MASTER).removeAlpha().raw().toBuffer();
  // Colore medio di un quadratino 9x9 attorno a (x, y)
  const media = (x, y) => {
    const a = [0, 0, 0];
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const i = ((y + dy) * S + (x + dx)) * 3;
        a[0] += rgb[i]; a[1] += rgb[i + 1]; a[2] += rgb[i + 2];
      }
    return a.map((v) => Math.round(v / 81));
  };
  // Sfondo: griglia 3x3 di colori presi appena dentro la forma arrotondata, allargata con sfumatura lineare
  const d = 120, m = 627, e = 12, f = S - 1;
  const griglia = [media(d, d), media(m, e), media(f - d, d), media(e, m), media(m, e), media(f - e, m),
    media(d, f - d), media(m, f - e), media(f - d, f - d)];
  const sfondo = await sharp(Buffer.from(griglia.flat()), { raw: { width: 3, height: 3, channels: 3 } })
    .resize(S, S, { kernel: "linear", fit: "fill" }).png().toBuffer();

  // Maschera: bianco = tieni il master, nero = usa lo sfondo. Solo i 4 angoli diventano neri, con bordo sfumato.
  const r = 340, ins = 12;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <rect x="${ins}" y="${ins}" width="${S - 2 * ins}" height="${S - 2 * ins}" rx="${r}" fill="#fff"/>
    <rect x="${r}" y="-20" width="${S - 2 * r}" height="${S + 40}" fill="#fff"/>
    <rect x="-20" y="${r}" width="${S + 40}" height="${S - 2 * r}" fill="#fff"/></svg>`;
  const maschera = await sharp(Buffer.from(svg)).ensureAlpha().extractChannel(3).blur(10).raw().toBuffer();
  const rgba = Buffer.alloc(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    rgba[i * 4] = rgb[i * 3]; rgba[i * 4 + 1] = rgb[i * 3 + 1]; rgba[i * 4 + 2] = rgb[i * 3 + 2]; rgba[i * 4 + 3] = maschera[i];
  }
  const disegno = await sharp(rgba, { raw: { width: S, height: S, channels: 4 } }).png().toBuffer();
  return { quadrata: await sharp(sfondo).composite([{ input: disegno }]).png().toBuffer(), griglia };
}

(async () => {
  const { quadrata, griglia } = await quadrataPiena();
  // Copia di lavoro a 1024 px (abbastanza grande per ogni uso futuro, più leggera del master)
  await sharp(quadrata).resize(1024).png({ compressionLevel: 9 }).toFile(path.join(root, "docs/design/icona-mandragola-quadrata.png"));

  const salva = (lato, dove) => sharp(quadrata).resize(lato, lato, { kernel: "lanczos3" }).png({ compressionLevel: 9 }).toFile(path.join(root, dove));
  await salva(180, "src/app/apple-icon.png"); // iPhone (Next.js crea da solo il tag apple-touch-icon)
  await salva(192, "public/icons/icona-192.png");
  await salva(512, "public/icons/icona-512.png");
  await salva(48, "src/app/icon.png"); // favicon (Next.js crea da solo il tag icon)

  // Maskable: Android può ritagliare l'icona a cerchio o goccia. Il disegno deve stare nell'80% centrale:
  // lo rimpiccioliamo al 78%, sfumiamo i suoi bordi e lo posiamo sullo stesso sfondo menta allargato a 512 px.
  const interno = Math.round(512 * 0.78), pos = Math.round((512 - interno) / 2);
  const sfondo512 = await sharp(Buffer.from(griglia.flat()), { raw: { width: 3, height: 3, channels: 3 } })
    .resize(512, 512, { kernel: "linear", fit: "fill" }).png().toBuffer();
  const bordiSfumati = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${interno}" height="${interno}"><rect x="14" y="14" width="${interno - 28}" height="${interno - 28}" fill="#fff"/></svg>`))
    .ensureAlpha().extractChannel(3).blur(8).raw().toBuffer();
  const piccola = await sharp(quadrata).resize(interno, interno, { kernel: "lanczos3" }).removeAlpha().raw().toBuffer();
  const piccolaRgba = Buffer.alloc(interno * interno * 4);
  for (let i = 0; i < interno * interno; i++) {
    piccolaRgba[i * 4] = piccola[i * 3]; piccolaRgba[i * 4 + 1] = piccola[i * 3 + 1]; piccolaRgba[i * 4 + 2] = piccola[i * 3 + 2]; piccolaRgba[i * 4 + 3] = bordiSfumati[i];
  }
  await sharp(sfondo512)
    .composite([{ input: await sharp(piccolaRgba, { raw: { width: interno, height: interno, channels: 4 } }).png().toBuffer(), left: pos, top: pos }])
    .png({ compressionLevel: 9 }).toFile(path.join(root, "public/icons/icona-512-maskable.png"));

  console.log("Icone generate.");
})();
