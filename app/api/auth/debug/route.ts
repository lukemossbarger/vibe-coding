import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    env: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET",
      AUTH_SECRET: process.env.AUTH_SECRET ? "SET" : "NOT SET",
      AUTH_URL: process.env.AUTH_URL || "NOT SET",
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || "NOT SET",
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
      NODE_ENV: process.env.NODE_ENV,
    },
    message: "Auth configuration check",
  });
}
