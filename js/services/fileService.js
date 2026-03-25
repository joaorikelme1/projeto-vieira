const FileService = (() => {
  function toBase64(file) {
    return new Promise((resolve) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve({
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        dataUrl: reader.result
      });
      reader.onerror = () => resolve({ nome: file.name, tipo: file.type, tamanho: file.size, dataUrl: null });
      reader.readAsDataURL(file);
    });
  }
  return { toBase64 };
})();
