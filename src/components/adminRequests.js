export async function requestJson(path, options) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) {
    throw new Error(data?.error ?? "Não foi possível carregar. Confira sua conexão ou entre novamente.", {
      cause: response.status,
    });
  }
  return data;
}

export async function preparePhoto(file, limit = 700_000) {
  if (file.size > 20_000_000) throw new Error("Escolha uma foto de até 20 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL("image/jpeg", 0.78).split(",")[1];
    if (!photo || photo.length > limit) throw new Error("A foto é grande demais. Escolha outra.");
    return photo;
  } finally {
    bitmap.close();
  }
}
