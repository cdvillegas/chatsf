import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const voteSchema = z.object({
  isHelpful: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to vote' },
        { status: 401 }
      );
    }

    const { id: commentId } = await params;
    const body = await request.json();
    const { isHelpful } = voteSchema.parse(body);

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user has already voted
    const existingVote = await prisma.helpfulVote.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId,
        },
      },
    });

    if (existingVote) {
      // Update vote if changed
      if (existingVote.isHelpful !== isHelpful) {
        await prisma.helpfulVote.update({
          where: {
            userId_commentId: {
              userId: session.user.id,
              commentId,
            },
          },
          data: { isHelpful },
        });

        // Recalculate votes
        const votes = await prisma.helpfulVote.groupBy({
          by: ['isHelpful'],
          where: { commentId },
          _count: true,
        });

        const helpfulCount = votes.find((v) => v.isHelpful)?._count || 0;
        const notHelpfulCount = votes.find((v) => !v.isHelpful)?._count || 0;

        await prisma.comment.update({
          where: { id: commentId },
          data: {
            helpfulVotes: helpfulCount,
            notHelpfulVotes: notHelpfulCount,
          },
        });

        return NextResponse.json({ message: 'Vote updated' });
      }

      return NextResponse.json({ message: 'Already voted' });
    }

    // Create new vote
    await prisma.helpfulVote.create({
      data: {
        userId: session.user.id,
        commentId,
        isHelpful,
      },
    });

    // Recalculate votes
    const votes = await prisma.helpfulVote.groupBy({
      by: ['isHelpful'],
      where: { commentId },
      _count: true,
    });

    const helpfulCount = votes.find((v) => v.isHelpful)?._count || 0;
    const notHelpfulCount = votes.find((v) => !v.isHelpful)?._count || 0;

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        helpfulVotes: helpfulCount,
        notHelpfulVotes: notHelpfulCount,
      },
    });

    return NextResponse.json({ message: 'Vote recorded' }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to record vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}
