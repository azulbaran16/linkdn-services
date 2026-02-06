import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint - no auth required
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ categories });
}
