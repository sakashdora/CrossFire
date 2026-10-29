// Saves a rendered QR <svg> as a PNG. Rendering happens locally; nothing is uploaded.
export function downloadQrPng(svg: SVGSVGElement | null, filename: string, size = 768): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!svg) { reject(new Error('The QR code is not ready yet.')); return; }
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) { reject(new Error('Your browser cannot save images.')); return; }
      context.fillStyle = '#FFFFFF'; context.fillRect(0, 0, size, size);
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, size, size);
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('The QR image could not be created.')); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      }, 'image/png');
    };
    image.onerror = () => reject(new Error('The QR image could not be created.'));
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  });
}
