export async function readJson(request, limit) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let input = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return JSON.parse(input + decoder.decode());
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return null;
      }
      input += decoder.decode(value, { stream: true });
    }
  } catch {
    await reader.cancel().catch(() => {});
    return null;
  }
}

export function isJpeg(photo, limit) {
  return typeof photo === "string" && photo.length <= limit &&
    photo.length % 4 === 0 && /^\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(photo) &&
    atob(photo).endsWith("\xff\xd9");
}
