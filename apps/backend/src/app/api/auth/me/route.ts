import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}
