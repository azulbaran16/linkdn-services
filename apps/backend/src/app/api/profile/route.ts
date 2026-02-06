import { NextRequest, NextResponse } from 'next/server';
import { upsertProfileSchema } from 'shared';
import { prisma } from '@/lib/prisma';
import { withAuth, getWorkspace, handleError, ApiError } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);
    const workspace = await getWorkspace(userId);

    const profile = await prisma.providerProfile.findUnique({
      where: { workspaceId: workspace.id },
    });

    const categories = await prisma.workspaceCategory.findMany({
      where: { workspaceId: workspace.id },
      include: { category: true },
    });

    return NextResponse.json({
      profile,
      categories: categories.map((wc) => wc.category),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);
    const workspace = await getWorkspace(userId);
    const body = await req.json();
    const data = upsertProfileSchema.parse(body);

    // Check slug uniqueness (excluding current workspace)
    const slugExists = await prisma.providerProfile.findFirst({
      where: {
        slug: data.slug,
        workspaceId: { not: workspace.id },
      },
    });
    if (slugExists) {
      throw new ApiError(409, 'Este slug ya esta en uso. Elige otro.');
    }

    // Validate all category IDs exist
    const validCategories = await prisma.category.findMany({
      where: { id: { in: data.categoryIds } },
    });
    if (validCategories.length !== data.categoryIds.length) {
      throw new ApiError(400, 'Una o mas categorias no son validas');
    }

    // Upsert profile and categories in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.providerProfile.upsert({
        where: { workspaceId: workspace.id },
        update: {
          slug: data.slug,
          displayName: data.displayName,
          city: data.city,
          description: data.description || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          portfolioLinks: data.portfolioLinks || [],
          logoUrl: data.logoUrl || '',
          isPublished: true,
        },
        create: {
          workspaceId: workspace.id,
          slug: data.slug,
          displayName: data.displayName,
          city: data.city,
          description: data.description || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          portfolioLinks: data.portfolioLinks || [],
          logoUrl: data.logoUrl || '',
          isPublished: true,
        },
      });

      // Replace workspace categories
      await tx.workspaceCategory.deleteMany({
        where: { workspaceId: workspace.id },
      });
      await tx.workspaceCategory.createMany({
        data: data.categoryIds.map((categoryId) => ({
          workspaceId: workspace.id,
          categoryId,
        })),
      });

      return profile;
    });

    return NextResponse.json({ profile: result });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}
