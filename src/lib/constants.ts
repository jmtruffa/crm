export const CLIENT_STATUS = {
  PROSPECT: "Prospecto",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  SUSPENDED: "Suspendido",
} as const;

export const RISK_PROFILE = {
  CONSERVATIVE: "Conservador",
  MODERATE: "Moderado",
  AGGRESSIVE: "Agresivo",
} as const;

export const INTERACTION_TYPE = {
  CALL: "Llamada",
  MEETING: "Reunión",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  OTHER: "Otro",
} as const;

export const TASK_STATUS = {
  PENDING: "Pendiente",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
} as const;

export const COMMERCIAL_SUBSTATE = {
  NURTURING: "Nutriendo",
  FIRST_CONTACT: "Primer contacto",
  PROPOSAL_SENT: "Propuesta enviada",
  NEGOTIATION: "Negociación",
  CONVERTED: "Convertido",
  LOST: "Perdido",
} as const;

export const SOURCE_CHANNEL = {
  REFERRAL: "Referido",
  COLD_CALL: "Llamada en frío",
  SOCIAL: "Redes sociales",
  EVENT: "Evento",
  INBOUND: "Inbound",
  OTHER: "Otro",
} as const;

export const OBJECTION_CODE = {
  PRICE: "Precio",
  TRUST: "Confianza",
  TIMING: "Timing",
  COMPETITOR: "Competidor",
  OTHER: "Otro",
} as const;

export const INTERACTION_OUTCOME = {
  NO_RESPONSE: "Sin respuesta",
  REPLIED: "Respondió",
  MEETING_BOOKED: "Reunión agendada",
  NOT_INTERESTED: "No interesado",
  OTHER: "Otro",
} as const;

export const INTERACTION_DIRECTION = {
  OUTBOUND: "Saliente",
  INBOUND: "Entrante",
} as const;

export const TASK_TYPE = {
  FOLLOW_UP: "Seguimiento",
  CALL: "Llamada",
  MEETING: "Reunión",
  DOCUMENT: "Documento",
  ONBOARDING: "Onboarding",
  OTHER: "Otro",
} as const;

export type ClientStatus = keyof typeof CLIENT_STATUS;
export type RiskProfile = keyof typeof RISK_PROFILE;
export type InteractionType = keyof typeof INTERACTION_TYPE;
export type TaskStatus = keyof typeof TASK_STATUS;
export type CommercialSubstate = keyof typeof COMMERCIAL_SUBSTATE;
export type SourceChannel = keyof typeof SOURCE_CHANNEL;
export type ObjectionCode = keyof typeof OBJECTION_CODE;
export type InteractionOutcome = keyof typeof INTERACTION_OUTCOME;
export type TaskType = keyof typeof TASK_TYPE;
