import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(10).max(500),
  photoUrls: z.array(z.string().url()).max(3).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to comment' },
        { status: 401 }
      );
    }

    const { id: neighborhoodId } = await params;
    const body = await request.json();
    const { content, photoUrls } = commentSchema.parse(body);

    // Check if neighborhood exists (by slug or id)
    const neighborhood = await prisma.neighborhood.findFirst({
      where: {
        OR: [
          { slug: neighborhoodId },
          { id: neighborhoodId }
        ]
      },
    });

    if (!neighborhood) {
      return NextResponse.json(
        { error: 'Neighborhood not found' },
        { status: 404 }
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        neighborhoodId: neighborhood.id,
        content,
        photoUrls: photoUrls || [],
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to create comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
