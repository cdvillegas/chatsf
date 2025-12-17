import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  categories: z.object({
    safety: z.number().min(1).max(5),
    vibe: z.number().min(1).max(5),
    transit: z.number().min(1).max(5),
    food: z.number().min(1).max(5),
    nightlife: z.number().min(1).max(5),
    value: z.number().min(1).max(5),
  }),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to rate' },
        { status: 401 }
      );
    }

    const { id: neighborhoodId } = await params;
    const body = await request.json();
    const { rating, categories } = ratingSchema.parse(body);

    // Check if neighborhood exists
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: neighborhoodId },
    });

    if (!neighborhood) {
      return NextResponse.json(
        { error: 'Neighborhood not found' },
        { status: 404 }
      );
    }

    // Upsert rating (create or update)
    const ratingRecord = await prisma.rating.upsert({
      where: {
        userId_neighborhoodId: {
          userId: session.user.id,
          neighborhoodId,
        },
      },
      create: {
        userId: session.user.id,
        neighborhoodId,
        rating,
        categories,
      },
      update: {
        rating,
        categories,
      },
    });

    // Recalculate average rating
    const ratings = await prisma.rating.findMany({
      where: { neighborhoodId },
      select: { rating: true },
    });

    const avgRating =
      ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length;

    await prisma.neighborhood.update({
      where: { id: neighborhoodId },
      data: {
        avgRating,
        ratingCount: ratings.length,
      },
    });

    return NextResponse.json(ratingRecord, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to create rating:', error);
    return NextResponse.json(
      { error: 'Failed to create rating' },
      { status: 500 }
    );
  }
}
