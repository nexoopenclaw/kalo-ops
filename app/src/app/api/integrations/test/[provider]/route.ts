import { fail, ok } from "@/lib/api-response";
import { getProviderAdapter } from "@/lib/providers";

const validProviders = ["supabase", "meta", "stripe", "calendly", "email", "slack", "ai", "voice"] as const;
type ValidProvider = (typeof validProviders)[number];

function isValidProvider(value: string): value is ValidProvider {
  return validProviders.includes(value as ValidProvider);
}

export async function POST(_: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;

  if (!isValidProvider(provider)) {
    return fail(
      {
        code: "PROVIDER_NOT_SUPPORTED",
        message: `Proveedor no soportado: ${provider}`,
      },
      404,
    );
  }

  const adapter = getProviderAdapter(provider);
  const result = await adapter.testConnection();

  if (result.status === "error") {
    return fail(
      {
        code: "PROVIDER_TEST_FAILED",
        message: result.message,
        details: {
          provider: result.provider,
        },
      },
      500,
    );
  }

  return ok(result);
}
