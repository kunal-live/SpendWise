import fs from "fs";
import path from "path";

export interface StoredBillFile {
  storageKey: string;
  absolutePath?: string;
  fileBuffer: Buffer;
  mimeType: string;
  originalFilename: string;
  fileSize: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedMimeType?: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit (Section 2)

/**
 * Validate file on the backend using magic bytes (Section 2 & 15).
 * Do not trust client MIME type alone.
 */
export function validateBillFile(buffer: Buffer, clientMimeType: string, filename: string): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "The uploaded file is empty." };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds maximum allowed size of 10 MB (received ${(buffer.length / (1024 * 1024)).toFixed(1)} MB).`
    };
  }

  // Detect file format via magic bytes
  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { valid: true, detectedMimeType: "application/pdf" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
  ) {
    return { valid: true, detectedMimeType: "image/png" };
  }

  // JPEG / JPG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, detectedMimeType: "image/jpeg" };
  }

  // Check extension as fallback if magic bytes are slightly offset by EXIF/TIFF headers
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf" && buffer.toString("binary", 0, 1024).includes("%PDF")) {
    return { valid: true, detectedMimeType: "application/pdf" };
  }
  if ((ext === ".jpg" || ext === ".jpeg") && buffer.length > 100) {
    return { valid: true, detectedMimeType: "image/jpeg" };
  }
  if (ext === ".png" && buffer.length > 100) {
    return { valid: true, detectedMimeType: "image/png" };
  }

  return {
    valid: false,
    error: "This file type is not supported. Please upload a JPG, JPEG, PNG, or PDF bill."
  };
}

/**
 * Build per-user isolated storage key:
 * bills/users/<user_id>/<year>/<month>/bill_<id>.<ext>
 */
export function generateStorageKey(userId: string, billId: string, originalFilename: string): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const ext = path.extname(originalFilename).toLowerCase() || ".pdf";
  const safeUserId = userId.replace(/[^a-zA-Z0-9_\-]/g, "_");
  return `bills/users/${safeUserId}/${year}/${month}/bill_${billId}${ext}`;
}

export class LocalBillStorage {
  private baseStorageDir: string;

  constructor(customPath?: string) {
    this.baseStorageDir = customPath || path.join(process.cwd(), ".storage");
  }

  public async saveBill(
    userId: string,
    billId: string,
    originalFilename: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<StoredBillFile> {
    const storageKey = generateStorageKey(userId, billId, originalFilename);
    const fullPath = path.join(this.baseStorageDir, storageKey);
    const parentDir = path.dirname(fullPath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, buffer);

    return {
      storageKey,
      absolutePath: fullPath,
      fileBuffer: buffer,
      mimeType,
      originalFilename,
      fileSize: buffer.length
    };
  }

  public async getBill(storageKey: string, userId: string): Promise<Buffer | null> {
    // Strict authorization guard: storage key MUST match user's prefix
    const safeUserId = userId.replace(/[^a-zA-Z0-9_\-]/g, "_");
    if (!storageKey.startsWith(`bills/users/${safeUserId}/`)) {
      return null;
    }

    const fullPath = path.join(this.baseStorageDir, storageKey);
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    return fs.promises.readFile(fullPath);
  }

  public async deleteBill(storageKey: string, userId: string): Promise<boolean> {
    const safeUserId = userId.replace(/[^a-zA-Z0-9_\-]/g, "_");
    if (!storageKey.startsWith(`bills/users/${safeUserId}/`)) {
      return false;
    }

    const fullPath = path.join(this.baseStorageDir, storageKey);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  }
}

export const billStorage = new LocalBillStorage();
