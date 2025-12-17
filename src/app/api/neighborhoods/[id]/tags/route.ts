import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const tagSchema = z.object({
  name: z.string().min(2).max(30),
});

const voteSchema = z.object({
  tagId: z.string(),
});

// Create or vote for a tag
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to add tags' },
        { status: 401 }
      );
    }

    const { id: neighborhoodId } = await params;
    const body = await request.json();

    // Check if this is a vote or new tag
    if ('tagId' in body) {
      // Vote for existing tag
      const { tagId } = voteSchema.parse(body);

      // Check if tag exists and belongs to this neighborhood
      const tag = await prisma.tag.findFirst({
        where: {
          id: tagId,
          neighborhoodId,
        },
      });

      if (!tag) {
        return NextResponse.json(
          { error: 'Tag not found' },
          { status: 404 }
        );
      }

      // Check if user has already voted
      const existingVote = await prisma.tagVote.findUnique({
        where: {
          userId_tagId: {
            userId: session.user.id,
            tagId,
          },
        },
      });

      if (existingVote) {
        // Remove vote (toggle off)
        await prisma.tagVote.delete({
          where: {
            userId_tagId: {
              userId: session.user.id,
              tagId,
            },
          },
        });

        await prisma.tag.update({
          where: { id: tagId },
          data: {
            upvoteCount: {
              decrement: 1,
            },
          },
        });

        return NextResponse.json({ message: 'Vote removed' });
      }

      // Add vote
      await prisma.tagVote.create({
        data: {
          userId: session.user.id,
          tagId,
        },
      });

      await prisma.tag.update({
        where: { id: tagId },
        data: {
          upvoteCount: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({ message: 'Vote recorded' }, { status: 201 });
    }

    // Create new tag
    const { name } = tagSchema.parse(body);

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

    // Check if tag already exists
    const existingTag = await prisma.tag.findUnique({
      where: {
        neighborhoodId_name: {
          neighborhoodId,
          name: name.toLowerCase(),
        },
      },
    });

    if (existingTag) {
      // Vote for existing tag instead
      const hasVoted = await prisma.tagVote.findUnique({
        where: {
          userId_tagId: {
            userId: session.user.id,
            tagId: existingTag.id,
          },
        },
      });

      if (!hasVoted) {
        await prisma.tagVote.create({
          data: {
            userId: session.user.id,
            tagId: existingTag.id,
          },
        });

        await prisma.tag.update({
          where: { id: existingTag.id },
          data: {
            upvoteCount: {
              increment: 1,
            },
          },
        });
      }

      return NextResponse.json(existingTag);
    }

    // Create new tag with initial vote
    const tag = await prisma.tag.create({
      data: {
        neighborhoodId,
        name: name.toLowerCase(),
        upvoteCount: 1,
      },
    });

    await prisma.tagVote.create({
      data: {
        userId: session.user.id,
        tagId: tag.id,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to create/vote tag:', error);
    return NextResponse.json(
      { error: 'Failed to create/vote tag' },
      { status: 500 }
    );
  }
}
