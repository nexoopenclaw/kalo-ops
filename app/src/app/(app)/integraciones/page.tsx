import { TestProviderButton } from "@/components/integraciones/test-provider-button";
import { getRuntimeConfig, providerIds } from "@/lib/config";
import { listProviderAdapterStatus } from "@/lib/provider-runtime";

export default function IntegracionesPage() {
  const runtimeConfig = getRuntimeConfig();
  const adapters = listProviderAdapterStatus();

  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">Integraciones y runtime adapters</h1>
        <p className="mt-2 text-sm text-zinc-400">Estado operativo mock/live, salud, capacidades y errores recientes por proveedor.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {providerIds.map((providerId) => {
          const provider = runtimeConfig.providers[providerId];
          return (
            <article key={provider.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{provider.label}</h2>
                  <p className={`mt-1 text-xs ${provider.isConfigured ? "text-[#d4e83a]" : "text-amber-300"}`}>{provider.isConfigured ? "Configurado" : "Faltan variables"}</p>
                </div>
                <TestProviderButton providerId={provider.id} />
              </div>
            </article>
          );
        })}
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Matriz de capacidades de adapters</h2>
        <div className="mt-3 space-y-2 text-sm">
          {adapters.map((a) => (
            <article key={a.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{a.label} · <span className="text-[#d4e83a]">{a.mode.toUpperCase()}</span></p>
                <span className="text-xs text-zinc-400">health: {a.health}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">Último error: {a.lastError ?? "sin errores"}</p>
              <p className="mt-2 text-xs text-zinc-300">inboundWebhook: {String(a.capabilities.inboundWebhook)} · outboundMessage: {String(a.capabilities.outboundMessage)} · revenueEvent: {String(a.capabilities.revenueEvent)} · replay: {String(a.capabilities.replay)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
