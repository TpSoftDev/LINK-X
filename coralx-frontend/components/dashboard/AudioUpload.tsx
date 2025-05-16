"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface UploadAudioProps {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  moduleId: string;
}

export default function UploadAudio({
  onUpload,
  uploading,
  moduleId,
}: UploadAudioProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [audioToUpload, setAudioToUpload] = useState<File | null>(null);

  useEffect(() => {
    if (!uploading) {
      setPreviewAudioUrl(null);
      setAudioToUpload(null);
    }
  }, [uploading]);
  

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioToUpload(file);
      setPreviewAudioUrl(URL.createObjectURL(file));
    }
  };

  const handleCancelPreview = () => {
    setPreviewAudioUrl(null);
    setAudioToUpload(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };
  

  const handleConfirmUpload = async () => {
    if (audioToUpload) {
      await onUpload(audioToUpload);
      setPreviewAudioUrl(null);
      setAudioToUpload(null);  
    }
  };
  

  return (
    <div className="border p-4 rounded shadow space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Upload Audio</h3>

      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!previewAudioUrl && (
        <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Uploading…
            </>
          ) : (
            "Choose Audio"
          )}
        </Button>
      )}

      {previewAudioUrl && (
        <div className="space-y-4">
          <audio
            controls
            src={previewAudioUrl}
            className="w-full rounded"
          >
            Your browser does not support the audio element.
          </audio>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancelPreview}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpload}
              disabled={uploading}
              className="bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-2"
            >
              {uploading && <Loader2 className="animate-spin h-4 w-4" />}
              {uploading ? "Uploading…" : "Confirm Upload"}
            </Button>
          </div>
        </div>
      )}

      {uploading && !previewAudioUrl && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="animate-spin h-4 w-4" />
          Uploading and processing…
        </div>
      )}
    </div>
  );
}