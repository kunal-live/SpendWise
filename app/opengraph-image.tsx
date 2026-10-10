import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "SpendWise - Smart Personal Finance & Expense Tracker";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #FAF6EE 0%, #F4EFE6 50%, #EDE6D8 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          padding: 60,
          border: "8px solid #FF6B4A"
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 300,
            background: "radial-gradient(circle, rgba(255, 107, 74, 0.2) 0%, transparent 70%)",
            filter: "blur(60px)",
            top: 150,
            left: 300,
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 24px",
            background: "rgba(255, 107, 74, 0.12)",
            border: "1px solid rgba(255, 107, 74, 0.35)",
            borderRadius: 50,
            color: "#FF6B4A",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.05em",
            marginBottom: 28,
          }}
        >
          ✨ AI-POWERED FINANCIAL INTELLIGENCE
        </div>

        {/* Brand Name */}
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 900,
            color: "#14151A",
            letterSpacing: "-0.03em",
            marginBottom: 20,
          }}
        >
          SPEND<span style={{ color: "#FF6B4A" }}>WISE</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#45423E",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Take absolute control of your spending, track EMIs, enforce 50/30/20 budgets, and build lasting wealth.
        </div>

        {/* Footer features */}
        <div
          style={{
            display: "flex",
            gap: 36,
            marginTop: 48,
            fontSize: 18,
            color: "#7A756D",
            fontWeight: 600,
          }}
        >
          <span>🔒 100% Private &amp; Encrypted</span>
          <span>•</span>
          <span>⚡ Real-time Analytics</span>
          <span>•</span>
          <span>🏆 Milestone Achievements</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
