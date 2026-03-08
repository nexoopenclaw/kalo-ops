import { TestProviderButton } from "@/components/integraciones/test-provider-button";
import { getRuntimeConfig, providerIds } from "@/lib/config";

const goLiveChecklist = [
  "Cargar todas las keys en Vercel (Production + Preview) y en secretos de Supabase Edge Functions.",
  "Confirmar que /api/integrations/status devuelve isFullyConfigured=true.",
  "Ejecutar botón 'Probar integración' para cada proveedor y validar status OK.",
  "Verificar recepción de webhook de Stripe, Meta y Calendly en entorno staging.",
  "Enviar email real de prueba y alerta de Slack con datos de ejemplo.",
  "Probar flujo end-to-end: lead entra → mensaje sale → pago Stripe → notificación Slack.",
];

export default function IntegracionesPage() {
  const runtimeConfig = getRuntimeConfig();

  return (
    <main className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-semibold">Integraciones y keys</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Estado operativo para go-live. No se muestran secretos, solo presencia de variables requeridas.
        </p>
        <p className="mt-3 text-sm">
          Estado global: {" "}
          <span className={runtimeConfig.isFullyConfigured ? "text-[#d4e83a]" : "text-amber-300"}>
            {runtimeConfig.isFullyConfigured ? "LISTO PARA GO-LIVE" : "FALTAN CREDENCIALES"}
          </span>
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {providerIds.map((providerId) => {
          const provider = runtimeConfig.providers[providerId];

          return (
            <article key={provider.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{provider.label}</h2>
                  <p className={`mt-1 text-xs ${provider.isConfigured ? "text-[#d4e83a]" : "text-amber-300"}`}>
                    {provider.isConfigured ? "Configurado" : "Faltan variables"}
                  </p>
                </div>
                <TestProviderButton providerId={provider.id} />
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-zinc-300">
                <p className="font-semibold text-zinc-200">Variables requeridas</p>
                <ul className="mt-2 space-y-1">
                  {provider.requiredEnv.map((envKey) => (
                    <li key={envKey} className="flex items-center justify-between gap-2">
                      <code>{envKey}</code>
                      <span className={provider.missingEnv.includes(envKey) ? "text-amber-300" : "text-[#d4e83a]"}>
                        {provider.missingEnv.includes(envKey) ? "Missing" : "OK"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Checklist go-live (keys-ready)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
          {goLiveChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
