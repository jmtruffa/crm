import "dotenv/config";
import path from "path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

// Also seed a default pipeline with stages
const PIPELINE_STAGES = [
  "Prospecto",
  "Primer contacto",
  "Propuesta enviada",
  "Negociación",
  "Convertido",
];

const TRIGGERS = [
  {
    code: "NO_OP_30D",
    name: "Sin operación 30 días",
    description: "El cliente no ha registrado ninguna operación en los últimos 30 días",
    conditionType: "NO_OP_DAYS",
    conditionDays: 30,
  },
  {
    code: "NO_FUND_60D",
    name: "Sin acreditación 60 días",
    description: "El cliente no ha acreditado fondos en los últimos 60 días",
    conditionType: "NO_FUND_DAYS",
    conditionDays: 60,
  },
  {
    code: "NO_CONTACT_90D",
    name: "Sin contacto 90 días",
    description: "No se ha registrado ninguna interacción con el cliente en los últimos 90 días",
    conditionType: "NO_CONTACT_DAYS",
    conditionDays: 90,
  },
  {
    code: "ANNIVERSARY_6M",
    name: "Aniversario 6 meses",
    description: "El cliente cumple 6 meses desde su registro. Momento ideal para revisar la relación",
    conditionType: "ANNIVERSARY_MONTHS",
    conditionDays: 6,
  },
  {
    code: "CONTENT_ENGAGED",
    name: "Interacción con contenido",
    description: "El cliente interactuó con contenido enviado. Trigger manual para capitalizar el interés",
    conditionType: "CONTENT_ENGAGED",
    conditionDays: null,
  },
];

async function main() {
  console.log("Seeding triggers...");

  for (const trigger of TRIGGERS) {
    const existing = await prisma.trigger.findUnique({ where: { code: trigger.code } });
    if (existing) {
      console.log(`  Trigger ${trigger.code} already exists, skipping`);
      continue;
    }
    await prisma.trigger.create({ data: trigger });
    console.log(`  Created trigger: ${trigger.code}`);
  }

  // Create default pipeline if none exists
  const existingPipeline = await prisma.pipeline.findFirst();
  if (!existingPipeline) {
    console.log("\nCreating default pipeline...");
    await prisma.pipeline.create({
      data: {
        name: "Pipeline Comercial",
        stages: {
          create: PIPELINE_STAGES.map((name, i) => ({ name, position: i })),
        },
      },
    });
    console.log("  Pipeline created with stages:", PIPELINE_STAGES.join(", "));
  } else {
    console.log("\nPipeline already exists, skipping");
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
