import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFPageData {
  pageNumber: number;
  imageData: string;
}

/**
 * Converte um PDF em array de imagens (uma por página)
 * @param file Arquivo PDF
 * @param maxPages Número máximo de páginas a processar (padrão: 10)
 * @returns Array com dados de cada página como base64
 */
export async function convertPDFToImages(
  file: File,
  maxPages: number = 10
): Promise<PDFPageData[]> {
  try {
    // Ler arquivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Carregar PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const numPages = Math.min(pdf.numPages, maxPages);
    const pages: PDFPageData[] = [];
    
    // Processar cada página
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Configurar escala para boa qualidade mas não muito grande
      const scale = 2.0;
      const viewport = page.getViewport({ scale });
      
      // Criar canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Não foi possível criar contexto do canvas');
      }
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Renderizar página no canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      } as any).promise;
      
      // Converter para base64
      const imageData = canvas.toDataURL('image/jpeg', 0.85);
      
      pages.push({
        pageNumber: pageNum,
        imageData,
      });
    }
    
    return pages;
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    throw new Error('Não foi possível processar o PDF. Verifique se o arquivo é válido.');
  }
}

/**
 * Verifica se um arquivo é PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
