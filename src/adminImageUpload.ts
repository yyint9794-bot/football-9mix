const MAX_BYTES = 380_000;

export async function readImageFileAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('ပုံဖိုင် သာရွေးပါ');
  }

  const bitmap = await createImageBitmap(file);
  const maxEdge = 1200;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('ပုံ မပြင်ဆင်နိုင်ပါ');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  let quality = 0.88;
  let dataUrl = canvas.toDataURL(mime, quality);

  while (dataUrl.length > MAX_BYTES * 1.37 && quality > 0.45) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (dataUrl.length > MAX_BYTES * 1.37) {
    throw new Error('ပုံအရမ်းကြီးပါတယ် — ပိုသေးသော ပုံ ရွေးပါ');
  }

  return dataUrl;
}
