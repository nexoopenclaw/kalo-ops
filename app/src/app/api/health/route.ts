import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "kalo-ops-app",
      status: "healthy",
      timestamp: new Date().toISOString(),
      runtime: {
        nodeEnv: process.env.NODE_ENV ?? "unknown",
        vercelEnv: process.env.VERCEL_ENV,
        gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
      },
    },
    {
      status: 200,
      headers: {
        // Health endpoints should be non-cacheable in production.
        "cache-control": "no-store",
      },
    },
  );
}
