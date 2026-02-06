import { NextRequest, NextResponse } from 'next/server';
import { marketplaceSearchSchema } from 'shared';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/middleware';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = {
      city: url.searchParams.get('city') || undefined,
      category: url.searchParams.get('category') || undefined,
      q: url.searchParams.get('q') || undefined,
      page: url.searchParams.get('page') || undefined,
      limit: url.searchParams.get('limit') || undefined,
    };

    const data = marketplaceSearchSchema.parse(params);
    const skip = (data.page - 1) * data.limit;

    // Build where clause
    const where: Prisma.ProviderProfileWhereInput = {
      isPublished: true,
    };

    if (data.city) {
      where.city = { contains: data.city, mode: 'insensitive' };
    }

    if (data.q) {
      where.OR = [
        { displayName: { contains: data.q, mode: 'insensitive' } },
        { description: { contains: data.q, mode: 'insensitive' } },
      ];
    }

    if (data.category) {
      where.workspace = {
        categories: {
          some: {
            category: { slug: data.category },
          },
        },
      };
    }

    const [profiles, total] = await Promise.all([
      prisma.providerProfile.findMany({
        where,
        skip,
        take: data.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: {
            include: {
              categories: { include: { category: true } },
              _count: { select: { services: { where: { active: true } } } },
            },
          },
        },
      }),
      prisma.providerProfile.count({ where }),
    ]);

    const results = profiles.map((profile) => ({
      slug: profile.slug,
      displayName: profile.displayName,
      city: profile.city,
      description: profile.description,
      logoUrl: profile.logoUrl,
      categories: profile.workspace.categories.map((wc) => ({
        id: wc.category.id,
        name: wc.category.name,
        slug: wc.category.slug,
      })),
      serviceCount: profile.workspace._count.services,
    }));

    return NextResponse.json({
      results,
      pagination: {
        page: data.page,
        limit: data.limit,
        total,
        totalPages: Math.ceil(total / data.limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Parametros invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}
