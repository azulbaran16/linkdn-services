import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError, ApiError } from '@/lib/middleware';

// Public provider profile endpoint
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { slug: params.slug },
      include: {
        workspace: {
          include: {
            categories: { include: { category: true } },
            services: {
              where: { active: true },
              orderBy: { createdAt: 'asc' },
            },
            rules: {
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
          },
        },
      },
    });

    if (!profile || !profile.isPublished) {
      throw new ApiError(404, 'Proveedor no encontrado');
    }

    return NextResponse.json({
      profile: {
        slug: profile.slug,
        displayName: profile.displayName,
        city: profile.city,
        description: profile.description,
        contactEmail: profile.contactEmail,
        contactPhone: profile.contactPhone,
        portfolioLinks: profile.portfolioLinks,
        logoUrl: profile.logoUrl,
        categories: profile.workspace.categories.map((wc) => ({
          id: wc.category.id,
          name: wc.category.name,
          slug: wc.category.slug,
        })),
        services: profile.workspace.services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          durationMinutes: s.durationMinutes,
          priceFrom: s.priceFrom ? Number(s.priceFrom) : null,
        })),
        availability: profile.workspace.rules.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
        })),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
