export async function fileToDataURL(file: File): Promise<string> {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem (PNG, JPG, WEBP).");
  }
  
  const maxBytes = 6 * 1024 * 1024; // 6MB
  if (file.size > maxBytes) {
    throw new Error("Imagem muito grande. Máximo de 6MB.");
  }
  
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file); // garante prefixo data:image/...;base64,
  });
}
