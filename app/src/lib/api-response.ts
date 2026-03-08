import { NextResponse } from "next/server";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function ok<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, data, meta }, { status });
}

export function fail(error: ApiError, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}
