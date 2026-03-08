import { fail, ok } from "@/lib/api-response";
import { requeueDeadLetter } from "@/lib/webhook-engine";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_: Request, { params }: Params) {
  const { id } = await params;
  if (!id) {
    return fail({ code: "VALIDATION_ERROR", message: "id es obligatorio" }, 400);
  }

  const result = await requeueDeadLetter(id);
  if (!result) {
    return fail({ code: "NOT_FOUND", message: "Dead-letter event no encontrado" }, 404);
  }

  return ok(result);
}
