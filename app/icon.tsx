import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "linear-gradient(135deg, #E07A28 0%, #C25B15 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#121316",
          borderRadius: 8,
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif"
        }}
      >
        S
      </div>
    ),
    {
      ...size,
    }
  );
}
