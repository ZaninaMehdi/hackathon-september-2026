type AvatarProps = {
  initials: string;
  size?: number;
  dashed?: boolean;
};

export function Avatar({ initials, size = 26, dashed = false }: AvatarProps) {
  if (dashed) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-pending-border bg-transparent"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-avatar-bg font-sans font-semibold text-body"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials}
    </span>
  );
}
