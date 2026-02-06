import { NextRequest, NextResponse } from 'next/server';
import { upsertAvailabilitySchema } from 'shared';
import { prisma } from '@/lib/prisma';
import { withAuth, getWorkspace, handleError } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);
    const workspace = await getWorkspace(userId);

    const rules = await prisma.availabilityRule.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);
    const workspace = await getWorkspace(userId);
    const body = await req.json();
    const data = upsertAvailabilitySchema.parse(body);

    // Replace all rules in a transaction
    const rules = await prisma.$transaction(async (tx) => {
      await tx.availabilityRule.deleteMany({
        where: { workspaceId: workspace.id },
      });

      if (data.rules.length === 0) {
        return [];
      }

      await tx.availabilityRule.createMany({
        data: data.rules.map((rule) => ({
          workspaceId: workspace.id,
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
        })),
      });

      return tx.availabilityRule.findMany({
        where: { workspaceId: workspace.id },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });

    return NextResponse.json({ rules });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}
