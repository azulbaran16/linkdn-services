import { NextRequest, NextResponse } from 'next/server';
import { updateProfileSchema } from 'shared';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/middleware';

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  city: true,
  authProvider: true,
  workspace: {
    select: {
      id: true,
      type: true,
      name: true,
      profile: {
        select: {
          slug: true,
          displayName: true,
          city: true,
          isPublished: true,
        },
      },
    },
  },
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);

    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    // Filter out undefined values
    const updateData: Record<string, string> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.city !== undefined) updateData.city = data.city;

    const user = await prisma.user.update({
      where: { id: userId },
      select: userSelect,
      data: updateData,
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Formato de solicitud invalido' }, { status: 400 });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}
