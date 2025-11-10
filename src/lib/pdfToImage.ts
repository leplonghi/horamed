import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFToImageOptions {
  maxPages?: number;
  scale?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
}

export interface PDFInfo {
  numPages: number;
  firstPageImage: string;
  isMultiPage: boolean;
}

/**
 * Convert first page of PDF to high-quality image
 * @param pdfDataUrl PDF data URL or base64 string
 * @param options Conversion options
 * @returns PDFInfo with image data and page count
 */
export async function convertPDFToImage(
  pdfDataUrl: string,
  options: PDFToImageOptions = {}
): Promise<PDFInfo> {
  const {
    maxPages = 1,
    scale = 2.0, // High DPI for better OCR
    format = 'jpeg',
    quality = 0.95
  } = options;

  try {
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument(pdfDataUrl);
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    console.log(`PDF has ${numPages} page(s)`);

    // Reject multi-page PDFs
    if (numPages > maxPages) {
      throw new Error(
        `Este PDF tem ${numPages} páginas. Por favor, envie apenas a primeira página da receita (máximo ${maxPages} página).`
      );
    }

    // Get first page
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Não foi possível criar contexto do canvas');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render PDF page to canvas
    const renderContext: any = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    console.log(`Rendered page 1 at ${viewport.width}x${viewport.height}px`);

    // Convert canvas to data URL
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const imageDataUrl = canvas.toDataURL(mimeType, quality);
    
    // Calculate file size
    const sizeKB = Math.round((imageDataUrl.length * 0.75) / 1024);
    console.log(`Generated ${format.toUpperCase()} image: ${sizeKB}KB`);

    return {
      numPages,
      firstPageImage: imageDataUrl,
      isMultiPage: numPages > 1
    };
  } catch (error: any) {
    console.error('PDF conversion error:', error);
    
    // User-friendly error messages
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('Arquivo PDF inválido ou corrompido. Tente escanear novamente.');
    }
    if (error.message?.includes('páginas')) {
      throw error; // Re-throw multi-page error as-is
    }
    if (error.message?.includes('password')) {
      throw new Error('PDF protegido por senha. Remova a proteção e tente novamente.');
    }
    
    throw new Error(`Erro ao processar PDF: ${error.message}`);
  }
}

/**
 * Validate PDF before processing
 * @param file File object to validate
 */
export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    return { 
      valid: false, 
      error: 'O arquivo deve ser um PDF válido' 
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 10MB`
    };
  }

  // Check minimum size (at least 1KB)
  if (file.size < 1024) {
    return {
      valid: false,
      error: 'Arquivo muito pequeno. Verifique se o PDF não está vazio.'
    };
  }

  return { valid: true };
}
