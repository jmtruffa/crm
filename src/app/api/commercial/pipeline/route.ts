import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pipelines = await prisma.pipeline.findMany({
    include: {
      stages: {
        orderBy: { position: "asc" },
        include: {
          memberships: {
            include: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  status: true,
                  aumCurrent: true,
                  commercialSubstate: true,
                  contactScores: {
                    orderBy: { calculatedAt: "desc" },
                    take: 1,
                    select: { score: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(pipelines);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const pipeline = await prisma.pipeline.create({
    data: {
      name: body.name,
      stages: {
        create: (body.stages ?? []).map((s: { name: string }, i: number) => ({
          name: s.name,
          position: i,
        })),
      },
    },
    include: { stages: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json(pipeline, { status: 201 });
}
