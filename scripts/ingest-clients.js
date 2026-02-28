#!/usr/bin/env node
/**
 * Ingestador bulk de clientes desde clientes.csv → dev.db
 * Uso: node scripts/ingest-clients.js [--dry-run] [--reset]
 *
 * --reset: borra Task, Interaction y Client antes de insertar (en orden para respetar FK)
 *
 * Asunciones del CSV:
 *  - Delimitador: ;
 *  - Encoding: UTF-8 (con BOM)
 *  - Fechas dob: d/m/yy  (convención argentina, ej: 10/2/72 = 10 feb 1972)
 *  - Teléfonos en notación científica (artefacto de Excel): se normalizan a entero
 *  - status: Activo→ACTIVE, Inactivo→INACTIVE, Prospecto→PROSPECT, Suspendido→SUSPENDED
 *  - riskProfile: Conservador→CONSERVATIVE, Moderado→MODERATE, Agresivo→AGGRESSIVE, Sin definir→null
 */

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DRY_RUN = process.argv.includes("--dry-run");
const RESET = process.argv.includes("--reset");
const CSV_PATH = path.join(__dirname, "..", "clientes.csv");
const DB_PATH = path.join(__dirname, "..", "dev.db");

// ── Mapeos ────────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  activo: "ACTIVE",
  inactivo: "INACTIVE",
  prospecto: "PROSPECT",
  suspendido: "SUSPENDED",
};

const RISK_MAP = {
  conservador: "CONSERVATIVE",
  moderado: "MODERATE",
  agresivo: "AGGRESSIVE",
  "sin definir": null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function str(val) {
  const v = (val ?? "").toString().trim();
  return v === "" ? null : v;
}

/** Normaliza teléfonos en notación científica de Excel */
function parsePhone(val) {
  const v = (val ?? "").toString().trim();
  if (v === "") return null;
  if (/\d+[Ee]\+\d+/.test(v)) {
    // Convierte a entero (ej: 5.49116E+12 → "5491160000000")
    // Nota: Excel trunca dígitos; se guarda lo que haya
    return Math.round(parseFloat(v)).toString();
  }
  return v;
}

/**
 * Parsea dob en formato d/m/yy (convención argentina).
 * Años < 30 → 2000s; >= 30 → 1900s
 */
function parseDob(val) {
  const v = (val ?? "").toString().trim();
  if (v === "") return null;
  const parts = v.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  const year = y < 30 ? 2000 + y : 1900 + y;
  // ISO 8601 para SQLite
  const iso = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00.000Z`;
  return iso;
}

function mapStatus(val) {
  const v = (val ?? "").toString().trim().toLowerCase();
  return STATUS_MAP[v] ?? "PROSPECT";
}

function mapRisk(val) {
  const v = (val ?? "").toString().trim().toLowerCase();
  return v === "" ? null : (RISK_MAP[v] ?? null);
}

// ── Parse CSV ─────────────────────────────────────────────────────────────────

const raw = fs.readFileSync(CSV_PATH, "utf-8").replace(/^\uFEFF/, ""); // strip BOM
const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");

const headers = lines[0].split(";").map((h) => h.trim());
console.log("Columnas detectadas:", headers.join(", "));

const rows = lines.slice(1).map((line) => {
  const vals = line.split(";");
  const obj = {};
  headers.forEach((h, i) => (obj[h] = vals[i] ?? ""));
  return obj;
});

console.log(`Filas a procesar: ${rows.length}\n`);

// ── Insertar ──────────────────────────────────────────────────────────────────

const db = new Database(DB_PATH);

if (RESET && !DRY_RUN) {
  db.exec("DELETE FROM Task; DELETE FROM Interaction; DELETE FROM Client;");
  console.log("Base limpiada (Task, Interaction, Client).\n");
}

const insert = db.prepare(`
  INSERT INTO Client (
    firstName, lastName, email, phone, company, dob,
    street, streetNumber, apt, city, postalCode, country,
    document, cuit, status, riskProfile, origin, notes,
    createdAt, updatedAt
  ) VALUES (
    @firstName, @lastName, @email, @phone, @company, @dob,
    @street, @streetNumber, @apt, @city, @postalCode, @country,
    @document, @cuit, @status, @riskProfile, @origin, @notes,
    @createdAt, @updatedAt
  )
`);

const now = new Date().toISOString();
let ok = 0;
let errors = 0;

const run = db.transaction(() => {
  for (const row of rows) {
    const record = {
      firstName: str(row.firstName) ?? "(sin nombre)",
      lastName: str(row.lastName) ?? "(sin apellido)",
      email: str(row.email),
      phone: parsePhone(row.phone),
      company: str(row.company),
      dob: parseDob(row.dob),
      street: str(row.street),
      streetNumber: str(row.streetNumber),
      apt: str(row.apt),
      city: str(row.city),
      postalCode: str(row.postalCode),
      country: str(row.country) ?? "Argentina",
      document: str(row.document),
      cuit: str(row.cuit),
      status: mapStatus(row.status),
      riskProfile: mapRisk(row.riskProfile),
      origin: str(row.origin),
      notes: str(row.notes),
      createdAt: now,
      updatedAt: now,
    };

    try {
      if (!DRY_RUN) {
        insert.run(record);
      }
      console.log(
        `  ✓ ${record.lastName}, ${record.firstName} — ${record.status}${record.riskProfile ? " / " + record.riskProfile : ""}${record.dob ? " — dob: " + record.dob.slice(0, 10) : ""}`
      );
      ok++;
    } catch (err) {
      console.error(`  ✗ ${record.lastName}, ${record.firstName}: ${err.message}`);
      errors++;
    }
  }
});

run();

console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}Resultado: ${ok} insertados, ${errors} errores.`);
if (DRY_RUN) console.log("Corré sin --dry-run para insertar en la DB.");
