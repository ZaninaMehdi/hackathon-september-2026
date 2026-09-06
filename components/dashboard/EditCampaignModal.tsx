"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { Modal } from "@/components/dashboard/Modal";
import { updateProject } from "@/lib/actions/project";

type EditCampaignModalProps = {
  projectId: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  onClose: () => void;
};

export function EditCampaignModal({
  projectId,
  title: initialTitle,
  description: initialDescription,
  coverImageUrl,
  onClose,
}: EditCampaignModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await updateProject({
        projectId,
        title: title.trim(),
        description: description.trim(),
        coverImageFile,
        removeCoverImage,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Edit campaign" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-meta font-semibold text-ink">Campaign title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-3 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-meta font-semibold text-ink">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-3 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <ImageUploadField
          label="Cover photo"
          currentUrl={coverImageUrl}
          onChange={setCoverImageFile}
          onRemove={() => setRemoveCoverImage(true)}
          aspectHint="Shown at the top of the campaign's public page and on campaign cards."
        />

        {error && <p className="text-meta text-danger">{error}</p>}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting || title.trim().length === 0}
          onClick={handleSubmit}
        >
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </Modal>
  );
}
