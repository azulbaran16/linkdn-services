import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAvailableSlots } from '@/lib/slots';
import { handleError, ApiError } from '@/lib/middleware';

const slotsQuerySchema = z.object({
  slug: z.string().min(1),
  serviceId: z.string().uuid(),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = {
      slug: url.searchParams.get('slug') || '',
      serviceId: url.searchParams.get('serviceId') || '',
      from: url.searchParams.get('from') || '',
      to: url.searchParams.get('to') || '',
    };

    const data = slotsQuerySchema.parse(params);

    // Find workspace by slug
    const profile = await prisma.providerProfile.findUnique({
      where: { slug: data.slug },
      select: { workspaceId: true, isPublished: true },
    });

    if (!profile || !profile.isPublished) {
      throw new ApiError(404, 'Proveedor no encontrado');
    }

    const slots = await getAvailableSlots(
      profile.workspaceId,
      data.serviceId,
      new Date(data.from),
      new Date(data.to)
    );

    return NextResponse.json({ slots });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Parametros invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}
