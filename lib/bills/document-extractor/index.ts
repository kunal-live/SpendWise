import { DocumentExtractor, RawDocumentResult } from "./types";
import { extractTextFromPdfBuffer } from "./pdf-extractor";
import { extractTextFromImageBuffer } from "./image-extractor";

export class SpendWiseDocumentExtractor implements DocumentExtractor {
  async extractFromPdf(buffer: Buffer): Promise<RawDocumentResult> {
    return extractTextFromPdfBuffer(buffer);
  }

  async extractFromImage(buffer: Buffer, mimeType: string): Promise<RawDocumentResult> {
    return extractTextFromImageBuffer(buffer, mimeType);
  }

  async extract(buffer: Buffer, mimeType: string, filename: string): Promise<RawDocumentResult> {
    const isPdf = mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      return this.extractFromPdf(buffer);
    }
    return this.extractFromImage(buffer, mimeType);
  }
}

// Global default singleton instance
let defaultExtractor: DocumentExtractor = new SpendWiseDocumentExtractor();

export function getDocumentExtractor(): DocumentExtractor {
  return defaultExtractor;
}

export function setDocumentExtractor(customExtractor: DocumentExtractor) {
  defaultExtractor = customExtractor;
}

export * from "./types";
