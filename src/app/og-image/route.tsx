import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || process.env.NEXT_PUBLIC_SITE_NAME || "Sadat MLS Cloud";
  const description = searchParams.get("description") || process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Cloud real estate platform for Sadat City";
  const locale = searchParams.get("locale") || "ar";
  const isRTL = locale === "ar";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1B2D4F 0%, #233148 50%, #111c31 100%)",
          padding: "40px",
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        {/* Logo Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "30px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          }}
        >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C49A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "64px",
            fontWeight: "800",
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "20px",
            textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            fontFamily: isRTL ? "Cairo, sans-serif" : "Inter, sans-serif",
          }}
        >
          {title}
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: "32px",
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.4,
            fontFamily: isRTL ? "Cairo, sans-serif" : "Inter, sans-serif",
          }}
        >
          {description}
        </p>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          <span
            style={{
              fontSize: "24px",
              color: "rgba(255,255,255,0.8)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            sadatmls.com
          </span>
        </div>

        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
