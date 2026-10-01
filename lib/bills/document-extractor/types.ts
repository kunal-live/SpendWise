export interface DocumentLine {
  text: string;
  confidence?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface RawDocumentResult {
  raw_text: string;
  lines: DocumentLine[];
  provider: string;
  page_count: number;
  metadata?: Record<string, any>;
}

export interface DocumentExtractor {
  extractFromImage(buffer: Buffer, mimeType: string): Promise<RawDocumentResult>;
  extractFromPdf(buffer: Buffer): Promise<RawDocumentResult>;
  extract(buffer: Buffer, mimeType: string, filename: string): Promise<RawDocumentResult>;
}
