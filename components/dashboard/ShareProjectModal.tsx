"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Modal } from "@/components/dashboard/Modal";

type ShareProjectModalProps = {
  publicUrl: string;
};

export function ShareProjectModal({ publicUrl }: ShareProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    QRCode.toDataURL(publicUrl, { width: 480, margin: 1, color: { dark: "#16211A" } }).then(
      (dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [open, publicUrl]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied or unavailable (older browser, insecure
      // context) — the input is still selectable for a manual copy.
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Share
      </Button>

      {open && (
        <Modal title="Share this campaign" onClose={() => setOpen(false)}>
          <div className="flex flex-col items-center gap-4">
            <p className="text-center text-meta text-body">
              Anyone with this link can follow the campaign&apos;s progress and donate — no
              account needed.
            </p>

            <div className="flex w-full flex-col gap-1.5">
              <div className="flex w-full items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  onFocus={(e) => e.target.select()}
                  className="w-full truncate rounded-lg border border-border bg-surface-raised px-3.5 py-3 font-mono text-meta text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <Button variant="primary" onClick={handleCopy} className="shrink-0">
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              {copyError && (
                <p className="text-meta text-danger">
                  Couldn&apos;t copy automatically — select the link above and copy it manually.
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 rounded-lg border border-hairline bg-surface-raised p-4">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code linking to the campaign page" className="h-40 w-40" />
              ) : (
                <div className="h-40 w-40 animate-pulse rounded-md bg-neutral-wash" />
              )}
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download="project-qr-code.png"
                  className={buttonClasses({ variant: "ghost", size: "sm" })}
                >
                  Download QR code
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
