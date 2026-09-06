import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Mark } from "@/components/brand/Mark";
import { GuestBackLink } from "@/components/public/GuestBackLink";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type PublicHeaderProps = {
  title?: string;
  titleHref?: string;
  logoUrl?: string | null;
  staffHref: string;
  staffLabel: string;
  showVerified?: boolean;
  backHref?: string;
  backLabel?: string;
};

export function PublicHeader({
  title,
  titleHref = "/",
  logoUrl,
  staffHref,
  staffLabel,
  showVerified = false,
  backHref,
  backLabel,
}: PublicHeaderProps) {
  return (
    <header className="flex flex-col gap-2 border-b border-hairline px-[18px] py-3.5 min-[900px]:px-8">
      {backHref && backLabel && <GuestBackLink href={backHref} label={backLabel} preferHistory />}
      <div className="flex items-center gap-2.5">
        <Link href={titleHref} className="flex min-w-0 items-center gap-2.5">
          {title ? (
            <>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-[26px] w-[26px] shrink-0 rounded-full object-cover" />
              ) : (
                <Mark size={26} />
              )}
              <span className="truncate font-sans text-copy font-semibold text-ink">{title}</span>
            </>
          ) : (
            <Logo size="md" />
          )}
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {showVerified && (
            <Link
              href="/verified"
              className="inline-flex items-center rounded-pill bg-accent-wash px-2 py-[5px] font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-accent"
            >
              Verified books
            </Link>
          )}
          <Link
            href={staffHref}
            className="font-sans text-[12.5px] font-semibold text-body transition-colors hover:text-ink"
          >
            {staffLabel}
          </Link>
          <ThemeToggle className="-mr-1" />
        </div>
      </div>
    </header>
  );
}
