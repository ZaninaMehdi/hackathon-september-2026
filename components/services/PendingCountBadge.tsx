export function PendingCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex min-w-[16px] items-center justify-center rounded-pill bg-accent px-[5px] py-px font-mono text-[9px] font-semibold leading-4 text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
