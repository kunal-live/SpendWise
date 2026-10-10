import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 108,
          background: "linear-gradient(135deg, #FAF6EE 0%, #F4EFE6 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FF6B4A",
          borderRadius: 40,
          border: "4px solid #FF6B4A",
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif"
        }}
      >
        SW
      </div>
    ),
    {
      ...size,
    }
  );
}
