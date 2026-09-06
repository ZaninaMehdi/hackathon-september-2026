import { ImageResponse } from "next/og";
import { getPublicProjectSafe } from "@/lib/data/project";
import { formatUsd } from "@/lib/mock/project";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ orgSlug: string; projectSlug: string }>;
}) {
  const { orgSlug, projectSlug } = await params;
  const data = await getPublicProjectSafe(orgSlug, projectSlug);

  const title = data?.project.title ?? "Amanah";
  const orgName = data?.org.name ?? "Community fundraiser";
  const raised = data?.raised ?? 0;
  const goal = data?.goal ?? 0;
  const percent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "#fcfdfc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: "#2f5d3f" }}>
          {orgName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 700,
              color: "#16211a",
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
            <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color: "#2f5d3f" }}>
              {formatUsd(raised)}
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "#4d5651", paddingBottom: 8 }}>
              raised of {formatUsd(goal)} goal · {percent}%
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: "100%",
              height: 16,
              borderRadius: 999,
              background: "#e6efe9",
            }}
          >
            <div
              style={{
                display: "flex",
                width: `${percent}%`,
                height: "100%",
                borderRadius: 999,
                background: "#2f5d3f",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 20, color: "#4d5651" }}>
          Verified books · Every expense posted with a receipt
        </div>
      </div>
    ),
    { ...size }
  );
}
