import { useState } from "react";
import { ExternalLink, ZoomIn, ZoomOut, FileText, Image as ImageIcon } from "lucide-react";

export interface BillPreviewProps {
  billId?: string;
  file?: File | null;
  mimeType?: string;
  filename?: string;
}

export default function BillPreview({
  billId,
  file,
  mimeType,
  filename
}: BillPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [imgError, setImgError] = useState(false);

  const fileUrl = file
    ? URL.createObjectURL(file)
    : billId
    ? `/api/bills/${billId}/file`
    : "";

  const isPdf =
    (mimeType && mimeType.includes("pdf")) ||
    (filename && filename.toLowerCase().endsWith(".pdf")) ||
    (file && file.name.toLowerCase().endsWith(".pdf"));

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-zinc-900/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          {isPdf ? <FileText size={15} className="text-red-400" /> : <ImageIcon size={15} className="text-violet-400" />}
          <span className="truncate max-w-[180px]">{filename || file?.name || "Uploaded Document"}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {!isPdf && (
            <>
              <button
                type="button"
                onClick={() => setZoom(Math.max(0.7, zoom - 0.2))}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(Math.min(2.0, zoom + 0.2))}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </>
          )}

          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Open full document in new tab"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-black/40 p-4 grid place-items-center min-h-[300px]">
        {isPdf ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 text-red-400 mb-3">
              <FileText size={32} />
            </div>
            <div className="text-sm font-bold text-zinc-200">PDF Document</div>
            <div className="mt-1 text-xs text-zinc-500">
              {filename || file?.name || "Invoice.pdf"}
            </div>
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-850 hover:text-white transition-colors"
              >
                <ExternalLink size={13} /> View Full PDF
              </a>
            )}
          </div>
        ) : !imgError && fileUrl ? (
          <div
            className="transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center top" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt="Uploaded receipt preview"
              className="max-h-[500px] w-auto max-w-full rounded-xl object-contain shadow-2xl"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500">
            <ImageIcon size={36} className="opacity-40 mb-2" />
            <span className="text-xs">Document preview not available</span>
          </div>
        )}
      </div>
    </div>
  );
}
