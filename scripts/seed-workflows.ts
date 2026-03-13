import "dotenv/config";
import path from "path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const WORKFLOWS = [
  {
    name: "PROSPECT_21D",
    description: "Secuencia de activación para prospectos nuevos en 21 días",
    steps: [
      { position: 0, title: "Llamada inicial", description: "Primera llamada de presentación y detección de necesidades", taskType: "CALL", delayDays: 0 },
      { position: 1, title: "Envío de propuesta", description: "Enviar propuesta personalizada por email", taskType: "DOCUMENT", delayDays: 3 },
      { position: 2, title: "Seguimiento propuesta", description: "Llamar para confirmar recepción y resolver dudas", taskType: "FOLLOW_UP", delayDays: 7 },
      { position: 3, title: "Reunión de cierre", description: "Reunión presencial o virtual para cierre", taskType: "MEETING", delayDays: 14 },
      { position: 4, title: "Onboarding", description: "Inicio del proceso de onboarding del cliente", taskType: "ONBOARDING", delayDays: 21 },
    ],
  },
  {
    name: "INACTIVE_REACTIVATION",
    description: "Secuencia de reactivación para clientes inactivos",
    steps: [
      { position: 0, title: "Email de reactivación", description: "Enviar email personalizado con novedades del mercado", taskType: "FOLLOW_UP", delayDays: 0 },
      { position: 1, title: "Llamada de seguimiento", description: "Llamar para retomar la relación comercial", taskType: "CALL", delayDays: 3 },
      { position: 2, title: "Envío de contenido relevante", description: "Compartir análisis o informe de interés para el cliente", taskType: "DOCUMENT", delayDays: 7 },
      { position: 3, title: "Propuesta personalizada", description: "Presentar propuesta adaptada al perfil actual del cliente", taskType: "MEETING", delayDays: 14 },
      { position: 4, title: "Cierre o descarte", description: "Decisión final: convertir o marcar como inactivo", taskType: "FOLLOW_UP", delayDays: 21 },
    ],
  },
];

async function main() {
  console.log("Seeding workflows...");

  for (const wf of WORKFLOWS) {
    const existing = await prisma.workflow.findFirst({ where: { name: wf.name } });
    if (existing) {
      console.log(`  Workflow "${wf.name}" already exists, skipping`);
      continue;
    }
    await prisma.workflow.create({
      data: {
        name: wf.name,
        description: wf.description,
        steps: { create: wf.steps },
      },
    });
    console.log(`  Created workflow: ${wf.name} (${wf.steps.length} steps)`);
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
