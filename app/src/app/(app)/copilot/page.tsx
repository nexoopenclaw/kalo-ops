import { CopilotWorkspace } from "@/components/copilot/copilot-workspace";
import type { ConversationTurn } from "@/lib/copilot-service";

const sharedTranscript: ConversationTurn[] = [
  { role: "lead", text: "Me interesa pero no sé si ahora es buen momento para invertir.", at: "2026-03-07T18:03Z" },
  { role: "agent", text: "Totalmente válido. ¿Qué tendría que pasar para que sí sea prioridad este mes?", at: "2026-03-07T18:04Z" },
  { role: "lead", text: "También estoy comparando con otra agencia y el precio me preocupa.", at: "2026-03-07T18:05Z" },
  { role: "agent", text: "Te preparo comparativa y plan de 30 días. ¿Te va bien revisar mañana?", at: "2026-03-07T18:06Z" },
];

const contextOptions = [
  {
    id: "ctx_1",
    label: "Martina Varela",
    conversationId: "conv_1",
    dealId: "deal_1",
    channel: "instagram" as const,
    stage: "qualified",
    forecastValue: "€4.8k",
    lastInteraction: "hace 40 min",
    objective: "Cerrar diagnóstico",
    transcript: sharedTranscript,
  },
  {
    id: "ctx_2",
    label: "Diego Rojas",
    conversationId: "conv_2",
    dealId: "deal_2",
    channel: "whatsapp" as const,
    stage: "new",
    forecastValue: "€3.2k",
    lastInteraction: "ayer",
    objective: "Validar autoridad",
    transcript: sharedTranscript,
  },
  {
    id: "ctx_3",
    label: "Sofía Team",
    conversationId: "conv_3",
    dealId: "deal_3",
    channel: "email" as const,
    stage: "booked",
    forecastValue: "€9.1k",
    lastInteraction: "hace 2h",
    objective: "Confirmar agenda",
    transcript: sharedTranscript,
  },
];

export default function CopilotPage() {
  return <CopilotWorkspace contextOptions={contextOptions} />;
}
