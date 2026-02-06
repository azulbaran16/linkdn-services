import { NextRequest, NextResponse } from 'next/server';
import { createServiceSchema } from 'shared';
import { prisma } from '@/lib/prisma';
import { withAuth, getWorkspace, handleError } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);
    const workspace = await getWorkspace(userId);

    const services = await prisma.service.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);
    const workspace = await getWorkspace(userId);
    const body = await req.json();
    const data = createServiceSchema.parse(body);

    const service = await prisma.service.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        description: data.description || '',
        durationMinutes: data.durationMinutes,
        bufferMinutesBefore: data.bufferMinutesBefore ?? 0,
        bufferMinutesAfter: data.bufferMinutesAfter ?? 0,
        priceFrom: data.priceFrom ?? null,
        active: true,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}
