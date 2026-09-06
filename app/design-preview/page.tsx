import type { ReactNode } from "react";
import { Instrument_Serif, Source_Serif_4 } from "next/font/google";

/* Alternative heading faces, loaded only on this preview route so the rest of
   the app is untouched while we compare pairings. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata = { title: "Design preview — Amanah" };

export default function DesignPreviewPage() {
  return (
    <div className={`${instrumentSerif.variable} ${sourceSerif.variable} min-h-screen bg-[#f4f6f5] pb-24`}>
      <style>{PROPOSED_TOKENS}</style>

      <header className="border-b border-hairline bg-surface px-6 py-7">
        <div className="mx-auto max-w-[1180px]">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink">Design preview</h1>
          <p className="mt-1.5 max-w-[620px] text-[14px] leading-[1.6] text-body">
            Left column is what the app renders today. Right column is the proposed system. Nothing
            here changes existing components — this route is throwaway.
          </p>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1180px] flex-col gap-14 px-6 pt-12">
        <Buttons />
        <Typography />
        <Fonts />
        <Palette />
        <Progress />
        <StatCards />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- sections */

function Buttons() {
  return (
    <Section
      title="Buttons"
      note="Today every button is a hand-written class string. Proposed: one component, three sizes, four variants, with real hover, active and focus-visible states."
    >
      <Compare>
        <Panel side="current">
          <Row label="Primary">
            <button className="rounded-lg bg-accent px-5 py-3 text-[15px] font-semibold text-white">
              Add expense
            </button>
            <button className="rounded-md bg-accent px-3.5 py-[9px] text-[13px] font-semibold text-white">
              New project
            </button>
            <button className="rounded-md bg-accent px-3 py-2 text-[12.5px] font-semibold text-white">
              Add task
            </button>
          </Row>
          <Row label="Secondary">
            <button className="rounded-md border border-border bg-white px-3.5 py-[9px] text-[13px] font-semibold text-ink">
              Invite
            </button>
            <button className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] font-semibold text-ink">
              Decline
            </button>
          </Row>
          <Row label="Disabled">
            <button disabled className="rounded-lg bg-accent px-5 py-3 text-[15px] font-semibold text-white opacity-50">
              Saving…
            </button>
            <button disabled className="rounded-lg bg-neutral-wash px-5 py-3 text-[15px] font-semibold text-muted">
              No active phase
            </button>
          </Row>
          <Caption>
            Three radii, six heights, three different disabled treatments. No focus ring anywhere in
            the app — tab through these and nothing happens.
          </Caption>
        </Panel>

        <Panel side="proposed">
          <Row label="Primary">
            <Btn size="lg">Add expense</Btn>
            <Btn size="md">New project</Btn>
            <Btn size="sm">Add task</Btn>
          </Row>
          <Row label="Secondary / ghost">
            <Btn variant="secondary" size="md">Invite</Btn>
            <Btn variant="ghost" size="md">Cancel</Btn>
            <Btn variant="danger" size="md">Decline</Btn>
          </Row>
          <Row label="Disabled">
            <Btn size="lg" disabled>Saving…</Btn>
            <Btn variant="secondary" size="lg" disabled>No active phase</Btn>
          </Row>
          <Caption>
            One radius, one height per size, one disabled rule. Hover lifts the shadow, active nudges
            down 1px. <strong className="font-semibold text-ink">Tab through these</strong> — every
            control has a visible focus ring.
          </Caption>
        </Panel>
      </Compare>
    </Section>
  );
}

function Typography() {
  const current = [
    ["Page title", "text-[19px] font-bold", "19px / 700"],
    ["Section heading", "text-sm font-bold", "14px / 700"],
    ["Card title", "text-[15px] font-semibold", "15px / 600"],
    ["Body", "text-[13.5px]", "13.5px / 400"],
    ["Secondary", "text-[12.5px]", "12.5px / 400"],
    ["Caption", "text-[11.5px]", "11.5px / 400"],
    ["Micro", "text-[10px] uppercase tracking-[0.04em] font-mono", "10px mono"],
  ] as const;

  return (
    <Section
      title="Type scale"
      note="Roughly twelve ad-hoc sizes today, including half-pixel values that don't round predictably. Proposed: a six-step scale with body bumped to 15px for desktop reading."
    >
      <Compare>
        <Panel side="current">
          {current.map(([label, cls, meta]) => (
            <div key={label} className="flex items-baseline gap-4 border-b border-hairline-soft py-2.5 last:border-0">
              <span className={`${cls} min-w-0 flex-1 truncate text-ink`}>{label}</span>
              <span className="shrink-0 font-mono text-[10px] text-muted">{meta}</span>
            </div>
          ))}
          <Caption>
            10, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 19, 21, 24px — and line-height is set per-use
            with <code className="font-mono text-[11px]">leading-[1.5]</code>,{" "}
            <code className="font-mono text-[11px]">leading-[1.6]</code> or nothing at all.
          </Caption>
        </Panel>

        <Panel side="proposed">
          {PROPOSED_TYPE.map((t) => (
            <div key={t.name} className="flex items-baseline gap-4 border-b border-[var(--p-line)] py-2.5 last:border-0">
              <span
                className="min-w-0 flex-1 truncate text-[var(--p-ink)]"
                style={{ fontSize: t.size, fontWeight: t.weight, lineHeight: t.leading, letterSpacing: t.tracking }}
              >
                {t.name}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-[var(--p-muted)]">{t.token}</span>
            </div>
          ))}
          <Caption>
            Six steps, whole pixels, line-height baked into each. Body moves 13.5px → 15px, which is
            the single change that most makes the app feel deliberate rather than cramped.
          </Caption>
        </Panel>
      </Compare>
    </Section>
  );
}

function Fonts() {
  const specimens = [
    { label: "Libre Franklin (current)", cls: "font-sans", note: "Neutral grotesque. Reads efficient, a little utilitarian." },
    { label: "Instrument Serif", cls: "font-[family-name:var(--font-instrument-serif)]", note: "High contrast display serif. Editorial, distinctive, free." },
    { label: "Source Serif 4", cls: "font-[family-name:var(--font-source-serif)]", note: "Warmer, sturdier. Reads institutional and trustworthy." },
  ];

  return (
    <Section
      title="Heading face"
      note="Keep Libre Franklin for UI and mono for money. The question is only whether headlines and the big money figure earn a serif — that alone reads as 'designed' without adding visual noise."
    >
      <div className="proposed grid grid-cols-1 gap-4 min-[900px]:grid-cols-3">
        {specimens.map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--p-line)] bg-white p-6 shadow-[var(--shadow-xs)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--p-muted)]">
              {s.label}
            </span>
            <p className={`${s.cls} mt-3 text-[30px] leading-[1.15] tracking-[-0.02em] text-[var(--p-ink)]`}>
              Fence Replacement
            </p>
            <p className={`${s.cls} mt-1 text-[20px] leading-[1.3] text-[var(--p-body)]`}>
              Every dollar, accounted for.
            </p>
            <p className="mt-4 border-t border-[var(--p-line)] pt-3 text-[13px] leading-[1.55] text-[var(--p-body)]">
              {s.note}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Palette() {
  return (
    <Section
      title="Colour"
      note="26 tokens today, ~18 of them greys. Four near-identical border greys get picked arbitrarily. Proposed: collapse to two lines, add a brighter green for large fills, and split success from brand."
    >
      <Compare>
        <Panel side="current">
          <SwatchGrid
            swatches={[
              ["accent", "#2f5d3f"],
              ["accent-hover", "#2a5439"],
              ["accent-wash", "#e6efe9"],
              ["accent-tint", "#f3f6f4"],
              ["hairline-soft", "#eef1ef"],
              ["hairline", "#e7eae8"],
              ["border", "#dfe4e0"],
              ["border-strong", "#b9c2bc"],
              ["pending", "#b08a2e"],
              ["danger", "#8c3226"],
            ]}
          />
          <Caption>
            The four border greys span #eef1ef → #dfe4e0 — visually indistinguishable in context. And
            the accent is the only saturated colour in the entire product.
          </Caption>
        </Panel>

        <Panel side="proposed">
          <SwatchGrid
            swatches={[
              ["accent", "#2f5d3f"],
              ["accent-hover", "#264d34"],
              ["accent-bright", "#3d8055"],
              ["accent-wash", "#e6efe9"],
              ["line", "#e4e8e6"],
              ["line-strong", "#cfd6d2"],
              ["success", "#2f7d55"],
              ["warning", "#b0812e"],
              ["danger", "#a3382a"],
              ["info", "#2c5f7a"],
            ]}
          />
          <Caption>
            Two border weights instead of four. <strong className="font-semibold text-ink">accent-bright</strong>{" "}
            gives progress fills some life — today a 100% bar reads as a black slab. Success is split
            from brand so a finished phase and a primary button stop looking identical.
          </Caption>
        </Panel>
      </Compare>
    </Section>
  );
}

function Progress() {
  return (
    <Section
      title="Progress + over-goal"
      note="Fence Replacement is genuinely at 193% — $1,450 raised against a $750 target — and today it renders exactly like a phase sitting at 100%."
    >
      <Compare>
        <Panel side="current">
          <PhaseRow name="Foundation" raised="$240" target="$800" percent={30}>
            <div className="h-2 w-full overflow-hidden rounded-pill bg-track">
              <div className="h-full rounded-pill bg-accent" style={{ width: "30%" }} />
            </div>
          </PhaseRow>
          <PhaseRow name="Phase 1" raised="$1,450" target="$750" percent={193}>
            <div className="h-2 w-full overflow-hidden rounded-pill bg-track">
              <div className="h-full rounded-pill bg-accent" style={{ width: "100%" }} />
            </div>
          </PhaseRow>
          <Caption>Over-funded and exactly-funded are pixel-identical. Good news rendered as a flat bar.</Caption>
        </Panel>

        <Panel side="proposed">
          <PhaseRow name="Foundation" raised="$240" target="$800" percent={30}>
            <ProposedBar percent={30} />
          </PhaseRow>
          <PhaseRow name="Phase 1" raised="$1,450" target="$750" percent={193} overGoal>
            <ProposedBar percent={193} />
          </PhaseRow>
          <Caption>
            Over-goal gets a distinct fill and a{" "}
            <span className="inline-flex items-center rounded-pill bg-[rgba(47,125,85,0.12)] px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--p-success)]">
              +93% over
            </span>{" "}
            badge, so the surplus is legible instead of hidden.
          </Caption>
        </Panel>
      </Compare>
    </Section>
  );
}

function StatCards() {
  return (
    <Section
      title="Cards in context"
      note="Same data, same restraint — the difference is elevation, type scale and a little breathing room."
    >
      <Compare>
        <Panel side="current">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-[5px] rounded-lg border border-hairline p-3.5">
              <span className="text-[11.5px] font-semibold uppercase text-muted">Raised</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[21px] font-medium text-ink">$1,800</span>
              </div>
              <span className="text-[11.5px] text-body">5 gifts</span>
            </div>
            <div className="flex flex-col gap-[5px] rounded-lg border border-hairline p-3.5">
              <span className="text-[11.5px] font-semibold uppercase text-muted">Spent</span>
              <span className="font-mono text-[21px] font-medium text-ink">$150</span>
              <span className="text-[11.5px] text-body">1 expense</span>
            </div>
            <div className="flex flex-col gap-[5px] rounded-lg border border-hairline p-3.5">
              <span className="text-[11.5px] font-semibold uppercase text-muted">On hand</span>
              <span className="font-mono text-[21px] font-medium text-ink">$1,650</span>
              <span className="text-[11.5px] text-body">across 3 projects</span>
            </div>
          </div>
        </Panel>

        <Panel side="proposed">
          <div className="grid grid-cols-3 gap-3">
            <ProposedStat eyebrow="Raised" figure="$1,800" caption="5 gifts" badge="72% of goal" />
            <ProposedStat eyebrow="Spent" figure="$150" caption="1 expense" />
            <ProposedStat eyebrow="On hand" figure="$1,650" caption="across 3 projects" accent />
          </div>
          <Caption>
            Figures step up to 26px, eyebrows drop to 11px mono, and cards get a hairline plus a
            whisper of shadow so they read as surfaces rather than outlines.
          </Caption>
        </Panel>
      </Compare>
    </Section>
  );
}

/* -------------------------------------------------------------- primitives */

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-[8px] font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-40";

const BTN_SIZES = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-[14px]",
  lg: "h-12 px-5 text-[15px]",
} as const;

const BTN_VARIANTS = {
  primary:
    "bg-[var(--p-accent)] text-white shadow-[var(--shadow-xs)] hover:bg-[var(--p-accent-hover)] hover:shadow-[var(--shadow-sm)] focus-visible:ring-[var(--p-accent)]",
  secondary:
    "border border-[var(--p-line-strong)] bg-white text-[var(--p-ink)] hover:border-[var(--p-muted)] hover:bg-[var(--p-sunken)] focus-visible:ring-[var(--p-accent)]",
  ghost:
    "text-[var(--p-body)] hover:bg-[var(--p-sunken)] hover:text-[var(--p-ink)] focus-visible:ring-[var(--p-accent)]",
  danger:
    "bg-[var(--p-danger)] text-white shadow-[var(--shadow-xs)] hover:brightness-[1.12] focus-visible:ring-[var(--p-danger)]",
} as const;

function Btn({
  children,
  variant = "primary",
  size = "md",
  disabled,
}: {
  children: ReactNode;
  variant?: keyof typeof BTN_VARIANTS;
  size?: keyof typeof BTN_SIZES;
  disabled?: boolean;
}) {
  return (
    <button type="button" disabled={disabled} className={`${BTN_BASE} ${BTN_SIZES[size]} ${BTN_VARIANTS[variant]}`}>
      {children}
    </button>
  );
}

function ProposedBar({ percent }: { percent: number }) {
  const over = percent > 100;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-pill bg-[#e9edea]">
      <div
        className="h-full rounded-pill transition-[width] duration-500 ease-out"
        style={{
          width: `${Math.min(100, percent)}%`,
          background: over
            ? "linear-gradient(90deg, var(--p-accent) 0%, var(--p-success) 100%)"
            : "linear-gradient(90deg, var(--p-accent) 0%, var(--p-accent-bright) 100%)",
        }}
      />
    </div>
  );
}

function ProposedStat({
  eyebrow,
  figure,
  caption,
  badge,
  accent,
}: {
  eyebrow: string;
  figure: string;
  caption: string;
  badge?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-xl border border-[var(--p-line)] p-4 shadow-[var(--shadow-xs)] ${
        accent ? "bg-[var(--p-accent-wash)]" : "bg-white"
      }`}
    >
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.07em] text-[var(--p-muted)]">
        {eyebrow}
      </span>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-[26px] font-medium tracking-[-0.01em] text-[var(--p-ink)]">
          {figure}
        </span>
        {badge && (
          <span className="rounded-pill bg-[rgba(47,93,63,0.10)] px-2 py-[3px] font-mono text-[10px] font-semibold text-[var(--p-accent)]">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[12px] text-[var(--p-body)]">{caption}</span>
    </div>
  );
}

function PhaseRow({
  name,
  raised,
  target,
  percent,
  overGoal,
  children,
}: {
  name: string;
  raised: string;
  target: string;
  percent: number;
  overGoal?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-semibold text-[var(--p-ink)]">{name}</span>
        {overGoal && (
          <span className="rounded-pill bg-[rgba(47,125,85,0.12)] px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--p-success)]">
            +{percent - 100}% over
          </span>
        )}
        <span className="ml-auto font-mono text-[12px] text-[var(--p-body)]">{percent}%</span>
      </div>
      {children}
      <span className="font-mono text-[11px] text-[var(--p-muted)]">
        {raised} of {target}
      </span>
    </div>
  );
}

function SwatchGrid({ swatches }: { swatches: readonly (readonly [string, string])[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {swatches.map(([name, hex]) => (
        <div key={name} className="flex items-center gap-2.5">
          <span
            className="h-9 w-9 shrink-0 rounded-md border border-black/10"
            style={{ background: hex }}
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[12px] font-semibold text-[var(--p-ink)]">{name}</span>
            <span className="font-mono text-[10.5px] uppercase text-[var(--p-muted)]">{hex}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ layout shell */

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[21px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
        <p className="max-w-[760px] text-[14px] leading-[1.6] text-body">{note}</p>
      </div>
      {children}
    </section>
  );
}

function Compare({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">{children}</div>;
}

function Panel({ side, children }: { side: "current" | "proposed"; children: ReactNode }) {
  const isProposed = side === "proposed";
  return (
    <div
      className={`proposed flex flex-col rounded-xl border bg-white p-5 ${
        isProposed ? "border-[rgba(47,93,63,0.25)] shadow-[var(--shadow-sm)]" : "border-hairline"
      }`}
    >
      <span
        className={`mb-4 inline-flex w-fit items-center rounded-pill px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${
          isProposed ? "bg-accent-wash text-accent" : "bg-neutral-wash text-muted"
        }`}
      >
        {isProposed ? "Proposed" : "Current"}
      </span>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.07em] text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-2.5">{children}</div>
    </div>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 border-t border-hairline pt-3 text-[12.5px] leading-[1.6] text-body">
      {children}
    </p>
  );
}

/* ----------------------------------------------------------------- tokens */

const PROPOSED_TYPE = [
  { name: "Display", token: "30 / 700", size: "30px", weight: 700, leading: 1.15, tracking: "-0.03em" },
  { name: "Page title", token: "22 / 700", size: "22px", weight: 700, leading: 1.25, tracking: "-0.02em" },
  { name: "Section heading", token: "17 / 600", size: "17px", weight: 600, leading: 1.35, tracking: "-0.01em" },
  { name: "Body", token: "15 / 400", size: "15px", weight: 400, leading: 1.6, tracking: "0" },
  { name: "Secondary", token: "13 / 400", size: "13px", weight: 400, leading: 1.55, tracking: "0" },
  { name: "Caption", token: "11 / 500", size: "11px", weight: 500, leading: 1.45, tracking: "0.01em" },
];

const PROPOSED_TOKENS = `
.proposed {
  --p-accent: #2f5d3f;
  --p-accent-hover: #264d34;
  --p-accent-bright: #3d8055;
  --p-accent-wash: #e6efe9;
  --p-success: #2f7d55;
  --p-danger: #a3382a;
  --p-ink: #14201a;
  --p-body: #48524d;
  --p-muted: #6b756f;
  --p-line: #e4e8e6;
  --p-line-strong: #cfd6d2;
  --p-sunken: #f6f8f7;
  --shadow-xs: 0 1px 2px rgba(20, 32, 26, 0.05);
  --shadow-sm: 0 1px 3px rgba(20, 32, 26, 0.07), 0 4px 12px -4px rgba(20, 32, 26, 0.06);
}
`;
