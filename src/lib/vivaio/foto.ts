// Foto del Vivaio: due copie piccole della foto già ridotta per il riconoscimento (architettura.md §3).
// Media (lato lungo 1280 px) per la scheda, miniatura (lato lungo 400 px) per la bacheca. L'originale non si tiene.

async function riduci(foto: Blob, latoLungo: number, qualita: number): Promise<Blob> {
  const immagine = await createImageBitmap(foto);
  const scala = Math.min(1, latoLungo / Math.max(immagine.width, immagine.height));
  const tela = document.createElement("canvas");
  tela.width = Math.round(immagine.width * scala);
  tela.height = Math.round(immagine.height * scala);
  const ctx = tela.getContext("2d");
  if (!ctx) throw new Error("tela non disponibile");
  ctx.drawImage(immagine, 0, 0, tela.width, tela.height);
  immagine.close();
  return new Promise((risolvi, rifiuta) =>
    tela.toBlob((b) => (b ? risolvi(b) : rifiuta(new Error("conversione non riuscita"))), "image/jpeg", qualita),
  );
}

export async function fotoPerVivaio(foto: Blob): Promise<{ foto: Blob; miniatura: Blob }> {
  const [media, miniatura] = await Promise.all([riduci(foto, 1280, 0.8), riduci(foto, 400, 0.75)]);
  return { foto: media, miniatura };
}
