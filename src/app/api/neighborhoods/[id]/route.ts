import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id },
      include: {
        comments: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        tags: {
          orderBy: {
            upvoteCount: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            ratings: true,
            comments: true,
            tags: true,
          },
        },
      },
    });

    if (!neighborhood) {
      return NextResponse.json(
        { error: 'Neighborhood not found' },
        { status: 404 }
      );
    }

    // Get user's rating if logged in
    let userRating = null;
    if (session?.user?.id) {
      userRating = await prisma.rating.findUnique({
        where: {
          userId_neighborhoodId: {
            userId: session.user.id,
            neighborhoodId: id,
          },
        },
      });
    }

    return NextResponse.json({
      ...neighborhood,
      userRating,
    });
  } catch (error) {
    console.error('Failed to fetch neighborhood:', error);
    return NextResponse.json(
      { error: 'Failed to fetch neighborhood' },
      { status: 500 }
    );
  }
}
