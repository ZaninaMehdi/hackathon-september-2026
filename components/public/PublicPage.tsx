import type { ReactNode } from "react";

type PublicPageProps = {
  children: ReactNode;
  className?: string;
};

export function PublicPage({ children, className = "" }: PublicPageProps) {
  return (
    <div
      className={`mx-auto flex min-h-screen w-full max-w-[1080px] flex-col bg-surface ${className}`.trim()}
    >
      {children}
    </div>
  );
}
