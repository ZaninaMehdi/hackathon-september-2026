"use client";

import { useRef, useState } from "react";

type ImageUploadFieldProps = {
  label: string;
  currentUrl?: string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  aspectHint?: string;
};

export function ImageUploadField({
  label,
  currentUrl,
  onChange,
  onRemove,
  aspectHint,
}: ImageUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
    setRemoved(false);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function handleRemove() {
    setPreviewUrl(null);
    setRemoved(true);
    onChange(null);
    onRemove?.();
  }

  const displayUrl = previewUrl ?? (removed ? null : (currentUrl ?? null));

  return (
    <div>
      <label className="mb-1.5 block text-meta font-semibold text-ink">{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {displayUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-raised p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
          <div className="flex flex-col items-start gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-meta font-semibold text-accent"
            >
              Replace photo
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-meta font-semibold text-danger"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-lg border border-dashed border-border-strong bg-surface-raised py-6 text-sm font-semibold text-accent"
        >
          + Add photo
        </button>
      )}
      {aspectHint && <p className="mt-1 text-micro text-muted">{aspectHint}</p>}
    </div>
  );
}
