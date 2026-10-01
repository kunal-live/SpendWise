import zlib from "zlib";
import { DocumentLine, RawDocumentResult } from "./types";

/**
 * High-performance PDF Document Text Extractor
 * Parses text objects (BT ... ET), string operators (Tj, TJ, '),
 * handles FlateDecode streams via node zlib, and reconstructs clean text lines.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<RawDocumentResult> {
  const lines: DocumentLine[] = [];
  const rawChunks: string[] = [];

  try {
    // 1. Scan for page count
    const pdfStr = buffer.toString("binary");
    const pageMatches = pdfStr.match(/\/Type\s*\/Page\b/g);
    const pageCount = pageMatches ? pageMatches.length : 1;

    // 2. Extract streams
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(pdfStr)) !== null) {
      const streamContent = match[1];
      const streamStart = match.index + match[0].indexOf(streamContent);
      const streamEnd = streamStart + streamContent.length;
      const streamBuffer = buffer.subarray(streamStart, streamEnd);

      // Check if previous dictionary had /Filter /FlateDecode
      const precedingDict = pdfStr.substring(Math.max(0, match.index - 500), match.index);
      let decompressed: string | null = null;

      if (precedingDict.includes("/FlateDecode") || precedingDict.includes("/Fl")) {
        try {
          const inflated = zlib.inflateSync(streamBuffer);
          decompressed = inflated.toString("utf-8");
        } catch {
          try {
            const rawInflated = zlib.inflateRawSync(streamBuffer);
            decompressed = rawInflated.toString("utf-8");
          } catch {
            decompressed = streamBuffer.toString("utf-8");
          }
        }
      } else {
        decompressed = streamBuffer.toString("utf-8");
      }

      if (decompressed) {
        parsePdfContentStream(decompressed, rawChunks);
      }
    }

    // Fallback: If streams didn't yield text, extract readable ASCII strings from the PDF
    if (rawChunks.length === 0) {
      const asciiRegex = /[A-Za-z0-9₹$,.:/\\-]{3,}(?:[ \t]+[A-Za-z0-9₹$,.:/\\-]+)*/g;
      const directMatches = pdfStr.match(asciiRegex) || [];
      const cleanMatches = directMatches.filter(m => 
        !m.startsWith("/") && 
        !m.includes("Font") && 
        !m.includes("ObjStm") && 
        !m.includes("Linearized") &&
        m.length > 3
      );
      rawChunks.push(...cleanMatches);
    }

    // Build lines
    for (const chunk of rawChunks) {
      const clean = chunk.trim();
      if (clean && clean.length > 1) {
        lines.push({ text: clean, confidence: 0.95 });
      }
    }

    const fullRawText = lines.map(l => l.text).join("\n");

    return {
      raw_text: fullRawText,
      lines,
      provider: "spendwise-pdf-extractor",
      page_count: Math.max(1, pageCount),
      metadata: { total_lines: lines.length }
    };
  } catch (err: any) {
    return {
      raw_text: "",
      lines: [],
      provider: "spendwise-pdf-extractor",
      page_count: 1,
      metadata: { error: err?.message }
    };
  }
}

/**
 * Parse text operators inside a PDF content stream:
 * (Text) Tj
 * [(Part1) 120 (Part2)] TJ
 * (Text) '
 */
function parsePdfContentStream(streamText: string, collectedChunks: string[]) {
  // 1. Tj operator: (string) Tj
  const tjRegex = /\((.*?)\)\s*Tj/g;
  let tjMatch: RegExpExecArray | null;
  while ((tjMatch = tjRegex.exec(streamText)) !== null) {
    const txt = unescapePdfString(tjMatch[1]);
    if (txt.trim()) collectedChunks.push(txt.trim());
  }

  // 2. TJ operator: [(string) -10 (string)] TJ
  const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
  let arrMatch: RegExpExecArray | null;
  while ((arrMatch = tjArrayRegex.exec(streamText)) !== null) {
    const arrayContent = arrMatch[1];
    const subStrings: string[] = [];
    const itemRegex = /\((.*?)\)/g;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = itemRegex.exec(arrayContent)) !== null) {
      subStrings.push(unescapePdfString(itemMatch[1]));
    }
    const combined = subStrings.join("").trim();
    if (combined) collectedChunks.push(combined);
  }

  // 3. Simple text line operators: ' (move to next line and show text)
  const singleQuoteRegex = /\((.*?)\)\s*'/g;
  let sqMatch: RegExpExecArray | null;
  while ((sqMatch = singleQuoteRegex.exec(streamText)) !== null) {
    const txt = unescapePdfString(sqMatch[1]);
    if (txt.trim()) collectedChunks.push(txt.trim());
  }
}

function unescapePdfString(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}
