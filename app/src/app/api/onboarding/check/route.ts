import { fail, ok } from "@/lib/api-response";
import { onboardingService, type OnboardingTaskKey } from "@/lib/onboarding-service";

interface CheckBody {
  organizationId?: string;
  taskKey?: OnboardingTaskKey;
  checked?: boolean;
}

const ALLOWED_TASKS: OnboardingTaskKey[] = [
  "connect_channel",
  "create_pipeline",
  "import_leads",
  "activate_automation",
  "configure_alerts",
];

export async function POST(request: Request) {
  let body: CheckBody;

  try {
    body = (await request.json()) as CheckBody;
  } catch {
    return fail({ code: "BAD_JSON", message: "JSON inválido" }, 400);
  }

  const organizationId = (body.organizationId ?? "org_1").trim();

  if (!body.taskKey || !ALLOWED_TASKS.includes(body.taskKey)) {
    return fail({ code: "VALIDATION_ERROR", message: "taskKey inválido" }, 400);
  }

  if (typeof body.checked !== "boolean") {
    return fail({ code: "VALIDATION_ERROR", message: "checked debe ser boolean" }, 400);
  }

  const data = await onboardingService.checkTask({
    organizationId,
    taskKey: body.taskKey,
    checked: body.checked,
  });

  return ok(data, 200, { organizationId, taskKey: body.taskKey });
}
