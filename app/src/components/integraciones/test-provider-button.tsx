"use client";

import { useState } from "react";

interface TestResult {
  ok: boolean;
  data?: {
    provider: string;
    status: "ok" | "not_configured" | "error";
    message: string;
    missingKeys: string[];
    checkedAt: string;
  };
  error?: { message: string };
}

export function TestProviderButton({ providerId }: { providerId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const runTest = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/integrations/test/${providerId}`, { method: "POST" });
      const payload = (await response.json()) as TestResult;
      setResult(payload);
    } catch {
      setResult({ ok: false, error: { message: "No se pudo ejecutar la prueba. Intenta de nuevo." } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={runTest}
        disabled={loading}
        className="rounded-lg border border-[#d4e83a]/40 bg-[#d4e83a]/15 px-3 py-2 text-xs font-semibold text-[#d4e83a] transition hover:bg-[#d4e83a]/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Probando..." : "Probar integración"}
      </button>

      {result && (
        <p className={`text-xs ${result.ok ? "text-zinc-300" : "text-rose-300"}`}>
          {result.ok ? result.data?.message : result.error?.message}
        </p>
      )}
    </div>
  );
}
