// Riduzione delle foto SUL TELEFONO prima dell'invio (passo 2.2, specifiche F03):
// - lato corto 1280 pixel, JPEG al 90% (consigli di Pl@ntNet): invio più veloce;
// - ridisegnare la foto toglie le informazioni nascoste, come il luogo dello scatto (nessuna posizione inviata).

const LATO_CORTO = 1280;
const QUALITA = 0.9;

export async function riduciFoto(file: File): Promise<Blob> {
  // "from-image": rispetta la rotazione salvata dalla fotocamera dell'iPhone
  const immagine = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scala = Math.min(1, LATO_CORTO / Math.min(immagine.width, immagine.height));
  const larghezza = Math.round(immagine.width * scala);
  const altezza = Math.round(immagine.height * scala);
  const tela = document.createElement("canvas");
  tela.width = larghezza;
  tela.height = altezza;
  const ctx = tela.getContext("2d");
  if (!ctx) throw new Error("tela non disponibile");
  ctx.drawImage(immagine, 0, 0, larghezza, altezza);
  immagine.close();
  return new Promise((risolvi, rifiuta) =>
    tela.toBlob((b) => (b ? risolvi(b) : rifiuta(new Error("conversione non riuscita"))), "image/jpeg", QUALITA),
  );
}
