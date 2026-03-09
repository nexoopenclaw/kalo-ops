type LogLevel = "info" | "warn" | "error";

const SENSITIVE_KEYS = ["authorization", "token", "password", "secret", "apikey", "api_key", "cookie"];

export interface LogContext {
  requestId?: string;
  organizationId?: string;
  route?: string;
  [key: string]: unknown;
}

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id")?.trim() || `req_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function redactValue(value: unknown): unknown {
  if (typeof value === "string" && value.length > 8) {
    return `${value.slice(0, 3)}***${value.slice(-2)}`;
  }
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") return redactObject(value as Record<string, unknown>);
  return value;
}

function redactObject(obj: Record<string, unknown>) {
  const clone: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const normalized = key.toLowerCase();
    clone[key] = SENSITIVE_KEYS.some((needle) => normalized.includes(needle)) ? "[REDACTED]" : redactValue(value);
  }
  return clone;
}

function emit(level: LogLevel, message: string, context?: LogContext) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(context ? redactObject(context as Record<string, unknown>) : {}),
  };

  if (level === "error") console.error(JSON.stringify(payload));
  else if (level === "warn") console.warn(JSON.stringify(payload));
  else console.info(JSON.stringify(payload));
}

export const logger = {
  info(message: string, context?: LogContext) {
    emit("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    emit("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    emit("error", message, context);
  },
};
