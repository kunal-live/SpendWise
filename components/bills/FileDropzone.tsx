import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileText, Image as ImageIcon, X, AlertCircle } from "lucide-react";

export interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  isProcessing?: boolean;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

export default function FileDropzone({
  onFileSelect,
  selectedFile,
  onClear,
  isProcessing = false
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validateAndSelect(file: File) {
    setError(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const typeOk = ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);

    if (!typeOk) {
      setError("Unsupported file format. Please upload JPG, PNG, or PDF.");
      return;
    }

    onFileSelect(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!isProcessing) setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  }

  const isPdf = selectedFile?.name.toLowerCase().endsWith(".pdf") || selectedFile?.type === "application/pdf";

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-[#E07A28] bg-[#E07A28]/10 shadow-lg shadow-[#E07A28]/20"
              : "border-[#382D25] bg-[#1D1815] hover:border-[#E07A28]/50 hover:bg-[#28211B]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleInputChange}
            className="hidden"
            disabled={isProcessing}
          />

          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#E07A28]/10 text-[#E07A28] mb-4 transition-transform hover:scale-105">
            <UploadCloud size={30} />
          </div>

          <h3 className="text-base font-bold text-[#F6F2EB]">
            Upload your bill or invoice
          </h3>
          <p className="mt-1 text-xs text-[#8C8176] max-w-sm">
            Drag &amp; drop here or click to browse. We will automatically extract amounts, merchant, date, and line items.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#8C8176]">
            <span className="rounded-md bg-[#26201B] px-2 py-0.5 border border-[#382D25] text-[#C6BCB3]">JPG</span>
            <span className="rounded-md bg-[#26201B] px-2 py-0.5 border border-[#382D25] text-[#C6BCB3]">PNG</span>
            <span className="rounded-md bg-[#26201B] px-2 py-0.5 border border-[#382D25] text-[#C6BCB3]">PDF</span>
            <span>•</span>
            <span>Max 10 MB</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-2xl border border-[#382D25] bg-[#1D1815] p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${isPdf ? "bg-red-500/15 text-red-500" : "bg-[#E07A28]/10 text-[#E07A28]"}`}>
              {isPdf ? <FileText size={22} /> : <ImageIcon size={22} />}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[#F6F2EB]">
                {selectedFile.name}
              </div>
              <div className="mt-0.5 text-xs text-[#8C8176]">
                {(selectedFile.size / 1024).toFixed(0)} KB • {selectedFile.type || (isPdf ? "PDF Document" : "Image")}
              </div>
            </div>
          </div>

          {!isProcessing && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg p-1.5 text-[#8C8176] hover:bg-[#28211B] hover:text-[#F6F2EB] transition-colors"
              title="Remove file"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-700">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
