import { ImageResponse } from "next/og";

const VARIANTS: Record<string, { size: number; pad: number }> = {
  "192": { size: 192, pad: 0 },
  "512": { size: 512, pad: 0 },
  maskable: { size: 512, pad: 96 },
};

export async function GET(
  _req: Request,
  ctx: RouteContext<"/icons/[name]">
) {
  const { name } = await ctx.params;
  const variant = VARIANTS[name] ?? VARIANTS["512"];
  const { size, pad } = variant;
  const inner = size - pad * 2;
  const border = Math.max(2, Math.round(size * 0.025));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#030712",
          padding: pad,
        }}
      >
        <div
          style={{
            width: inner,
            height: inner,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: pad ? Math.round(inner * 0.22) : 0,
            background: "#030712",
            border: `${border}px solid #10b981`,
            color: "#34d399",
            fontSize: Math.round(inner * 0.44),
            letterSpacing: -2,
          }}
        >
          K
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
