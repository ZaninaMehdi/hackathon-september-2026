"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { updateOrgProfile } from "@/lib/actions/organization";
import type { OrgProfile } from "@/lib/data/organization";

type OrgProfileFormProps = {
  profile: OrgProfile;
};

export function OrgProfileForm({ profile }: OrgProfileFormProps) {
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      await updateOrgProfile({
        name: name.trim(),
        description: description.trim(),
        logoFile,
        removeLogo,
        coverFile,
        removeCover,
      });
      setSaved(true);
      setLogoFile(null);
      setCoverFile(null);
      setRemoveLogo(false);
      setRemoveCover(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface-raised p-4">
      <div>
        <label className="mb-1.5 block text-meta font-semibold text-ink">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-meta font-semibold text-ink">
          Description (shown on the public page)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-copy text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <ImageUploadField
        label="Logo"
        currentUrl={profile.logoUrl}
        onChange={setLogoFile}
        onRemove={() => setRemoveLogo(true)}
        aspectHint="Shown in the header of every public page."
      />

      <ImageUploadField
        label="Cover photo"
        currentUrl={profile.coverImageUrl}
        onChange={setCoverFile}
        onRemove={() => setRemoveCover(true)}
        aspectHint="Shown at the top of your organization's public page."
      />

      {error && <p className="text-meta text-danger">{error}</p>}
      {saved && <p className="text-meta text-accent">Saved.</p>}

      <Button
        variant="primary"
        disabled={submitting || name.trim().length === 0}
        onClick={handleSubmit}
        className="self-start"
      >
        {submitting ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
