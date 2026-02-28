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

export type ClientStatus = keyof typeof CLIENT_STATUS;
export type RiskProfile = keyof typeof RISK_PROFILE;
export type InteractionType = keyof typeof INTERACTION_TYPE;
export type TaskStatus = keyof typeof TASK_STATUS;
