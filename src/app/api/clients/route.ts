import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DateTime fields that come from the form as "YYYY-MM-DD" strings
const DATE_FIELDS = ["dob", "lastOperationAt", "lastFundingAt", "lastInteractionAt"] as const;

function parseDateFields(body: Record<string, unknown>) {
  const out = { ...body };
  for (const field of DATE_FIELDS) {
    const val = out[field];
    if (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Use noon UTC to avoid timezone off-by-one issues
      out[field] = new Date(`${val}T12:00:00.000Z`);
    } else if (val === "" || val === null) {
      out[field] = undefined;
    }
  }
  return out;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const clients = await prisma.client.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
                { document: { contains: search } },
                { cuit: { contains: search } },
              ],
            }
          : {},
        status ? { status } : {},
      ],
    },
    include: {
      brokerAccounts: { include: { broker: true } },
      _count: { select: { interactions: true, tasks: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return NextResponse.json(clients);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const client = await prisma.client.create({ data: parseDateFields(body) as Parameters<typeof prisma.client.create>[0]["data"] });
  return NextResponse.json(client, { status: 201 });
}
