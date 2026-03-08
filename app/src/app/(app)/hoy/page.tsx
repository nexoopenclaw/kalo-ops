import { HoyWorkspace } from "@/components/hoy/hoy-workspace";
import { hoyService } from "@/lib/hoy-service";

export default async function HoyPage() {
  const data = await hoyService.getSummary("org_1");
  return <HoyWorkspace initialData={data} />;
}
