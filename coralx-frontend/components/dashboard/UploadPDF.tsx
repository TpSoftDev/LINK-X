"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface UploadPdfProps {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
}

export default function UploadPdf({ onUpload, uploading }: UploadPdfProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border p-4 rounded shadow space-y-2">
      <h3 className="text-lg font-semibold">Upload a PDF to index</h3>

      {/* hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
        className="hidden"
      />

      {/* trigger button */}
      <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? "Uploading…" : "Choose PDF"}
      </Button>

      {uploading && (
        <p className="text-sm text-blue-600">Uploading and processing…</p>
      )}
    </div>
  );
}