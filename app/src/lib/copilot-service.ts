export type ObjectionType = "precio" | "timing" | "confianza" | "urgencia" | "competencia" | "otro";

export interface CopilotContext {
  organizationId: string;
  conversationId?: string;
  dealId?: string;
  leadName?: string;
  channel?: "instagram" | "whatsapp" | "email" | "webchat" | "other";
}

export interface ConversationTurn {
  role: "lead" | "agent" | "system";
  text: string;
  at?: string;
}

export interface SuggestRepliesInput {
  context: CopilotContext;
  conversation: ConversationTurn[];
  objective?: string;
  tone?: "consultivo" | "directo" | "premium";
}

export interface ReplySuggestion {
  id: string;
  text: string;
  intent: string;
  confidence: number;
}

export interface SuggestRepliesResult {
  context: CopilotContext;
  suggestions: ReplySuggestion[];
  rationale: string;
}

export interface ClassifyObjectionInput {
  context: CopilotContext;
  message: string;
}

export interface ClassifyObjectionResult {
  context: CopilotContext;
  category: ObjectionType;
  confidence: number;
  explanation: string;
}

export interface SummarizeConversationInput {
  context: CopilotContext;
  conversation: ConversationTurn[];
}

export interface SummarizeConversationResult {
  context: CopilotContext;
  summary: string;
  nextBestAction: string;
  risks: string[];
}

export interface ScoreConversationInput {
  context: CopilotContext;
  conversation: ConversationTurn[];
}

export interface ConversationScorecard {
  claridad: number;
  empatia: number;
  cta: number;
  manejoObjecion: number;
  overall: number;
  highlights: string[];
  improvements: string[];
}

export interface ScoreConversationResult {
  context: CopilotContext;
  scorecard: ConversationScorecard;
}

export interface CopilotRepository {
  suggestReplies(input: SuggestRepliesInput): Promise<SuggestRepliesResult>;
  classifyObjection(input: ClassifyObjectionInput): Promise<ClassifyObjectionResult>;
  summarizeConversation(input: SummarizeConversationInput): Promise<SummarizeConversationResult>;
  scoreConversation(input: ScoreConversationInput): Promise<ScoreConversationResult>;
}

class MockCopilotRepository implements CopilotRepository {
  async suggestReplies(input: SuggestRepliesInput): Promise<SuggestRepliesResult> {
    const leadName = input.context.leadName ?? "lead";
    const objective = input.objective ?? "agendar llamada";

    return {
      context: input.context,
      suggestions: [
        {
          id: `sg_${Date.now()}_1`,
          text: `${leadName}, total. Si te encaja, te paso 2 opciones hoy para avanzar con ${objective} sin fricción.`,
          intent: "bajar fricción y mover a acción",
          confidence: 0.89,
        },
        {
          id: `sg_${Date.now()}_2`,
          text: `Buena pregunta. Para que tengas claridad, te explico en 3 puntos cómo lo ejecutaríamos contigo esta semana.`,
          intent: "aumentar confianza",
          confidence: 0.84,
        },
        {
          id: `sg_${Date.now()}_3`,
          text: `Si prefieres, hacemos una mini llamada de 15 min y validamos si hay fit antes de propuesta.`,
          intent: "CTA suave",
          confidence: 0.81,
        },
      ],
      rationale: "Se priorizan respuestas cortas, consultivas y orientadas a próximo paso.",
    };
  }

  async classifyObjection(input: ClassifyObjectionInput): Promise<ClassifyObjectionResult> {
    const text = input.message.toLowerCase();

    const category: ObjectionType =
      /precio|caro|coste|presupuesto/.test(text)
        ? "precio"
        : /luego|más adelante|ahora no|timing|momento/.test(text)
          ? "timing"
          : /no confío|dudas|seguro|garantía|resultados/.test(text)
            ? "confianza"
            : /urgente|ya|rápido/.test(text)
              ? "urgencia"
              : /otra agencia|competencia|alternativa/.test(text)
                ? "competencia"
                : "otro";

    return {
      context: input.context,
      category,
      confidence: category === "otro" ? 0.6 : 0.86,
      explanation: "Clasificación mock por heurística de palabras clave. Ajustar con LLM + taxonomy tuning.",
    };
  }

  async summarizeConversation(input: SummarizeConversationInput): Promise<SummarizeConversationResult> {
    const lastLeadMessage = [...input.conversation].reverse().find((turn) => turn.role === "lead")?.text;

    return {
      context: input.context,
      summary:
        "Lead interesado en la oferta, con fricción principal en claridad de implementación y retorno esperado. Se mantuvo tono positivo durante el intercambio.",
      nextBestAction: "Enviar mini-plan en 3 pasos + CTA de llamada corta con dos horarios concretos.",
      risks: [
        "Si no se responde en <2h, puede enfriarse la intención.",
        lastLeadMessage ? `Última señal del lead: \"${lastLeadMessage.slice(0, 90)}\".` : "Falta confirmar ventana de decisión.",
      ],
    };
  }

  async scoreConversation(input: ScoreConversationInput): Promise<ScoreConversationResult> {
    const outboundCount = input.conversation.filter((turn) => turn.role === "agent").length;

    const scorecard: ConversationScorecard = {
      claridad: outboundCount >= 2 ? 82 : 74,
      empatia: 79,
      cta: outboundCount >= 2 ? 76 : 68,
      manejoObjecion: 73,
      overall: 78,
      highlights: ["Buen contexto de necesidad del lead.", "Tono consultivo consistente."],
      improvements: ["Incluir CTA con hora exacta.", "Responder objeción con evidencia/caso breve."],
    };

    return {
      context: input.context,
      scorecard,
    };
  }
}

const repository: CopilotRepository = new MockCopilotRepository();

export const copilotService = {
  async suggestReplies(input: SuggestRepliesInput) {
    // TODO(LLM Provider): replace with Gemini/OpenAI adapter and prompt templates per context.
    return repository.suggestReplies(input);
  },

  async classifyObjection(input: ClassifyObjectionInput) {
    // TODO(LLM Provider): classify with strict schema and confidence calibration.
    return repository.classifyObjection(input);
  },

  async summarizeConversation(input: SummarizeConversationInput) {
    // TODO(LLM Provider): generate concise summary + actionable next steps.
    return repository.summarizeConversation(input);
  },

  async scoreConversation(input: ScoreConversationInput) {
    // TODO(LLM Provider): evaluate with rubric prompts and deterministic post-processing.
    return repository.scoreConversation(input);
  },
};
