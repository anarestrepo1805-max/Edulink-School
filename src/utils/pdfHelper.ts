/**
 * Utility for PDF file validation and Base64 encoding.
 */

export interface ValidatedPdfFile {
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  dataUrl: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Validates file type and size (max 5MB) and converts to Base64 data URL.
 */
export function validateAndReadPdf(file: File, maxSizeBytes = 5 * 1024 * 1024): Promise<ValidatedPdfFile> {
  return new Promise((resolve, reject) => {
    // 1. Validate extension / mime
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return reject(new Error('El archivo seleccionado no tiene formato PDF. Solo se admiten documentos .pdf.'));
    }

    // 2. Validate max size
    if (file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      return reject(new Error(`El archivo supera el tamaño máximo permitido de ${maxMb}MB. Por favor sube un PDF más liviano.`));
    }

    // 3. Read as data URL
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        sizeBytes: file.size,
        sizeFormatted: formatFileSize(file.size),
        dataUrl: reader.result as string
      });
    };
    reader.onerror = () => {
      reject(new Error('Error al procesar el archivo PDF. Intenta de nuevo.'));
    };
    reader.readAsDataURL(file);
  });
}
