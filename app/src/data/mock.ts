export const dashboardStats = [
  { label: "Leads nuevos (24h)", value: "47", delta: "+12%" },
  { label: "Conversaciones activas", value: "29", delta: "+4" },
  { label: "Deals en pipeline", value: "18", delta: "$24.5k" },
  { label: "Tasa de respuesta", value: "82%", delta: "+3.2%" },
];

export const pipeline = [
  { stage: "Nuevo", count: 22, amount: 8600 },
  { stage: "Calificado", count: 14, amount: 12200 },
  { stage: "Oferta enviada", count: 7, amount: 18300 },
  { stage: "Cerrado", count: 4, amount: 9100 },
];

export const inboxThreads = [
  {
    id: "th_1",
    name: "Martina Varela",
    channel: "Instagram",
    preview: "Estoy interesada en mentoría 1:1. ¿Cuándo podemos hablar?",
    lastMessageAt: "hace 3 min",
    unread: 2,
  },
  {
    id: "th_2",
    name: "Diego Rojas",
    channel: "WhatsApp",
    preview: "Vi el caso de éxito, quiero propuesta para mi marca personal.",
    lastMessageAt: "hace 11 min",
    unread: 0,
  },
  {
    id: "th_3",
    name: "Sofía Team",
    channel: "Email",
    preview: "Confirmado, el pago sale hoy y arrancamos onboarding.",
    lastMessageAt: "hace 48 min",
    unread: 1,
  },
];

export const conversationMessages = [
  { from: "lead", text: "Hola Kalo, ¿tenéis hueco este mes?", at: "18:02" },
  { from: "agent", text: "Sí, tenemos dos slots. ¿Qué objetivo quieres priorizar?", at: "18:04" },
  { from: "lead", text: "Cerrar 5 clientes high-ticket en 90 días.", at: "18:05" },
];
