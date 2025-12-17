'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { TagWithVotes } from '@/types';

interface TagVoteButtonProps {
  tag: TagWithVotes;
  neighborhoodId: string;
  onVote?: () => void;
}

export default function TagVoteButton({ tag, neighborhoodId, onVote }: TagVoteButtonProps) {
  const { data: session } = useSession();
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(tag.hasVoted || false);
  const [voteCount, setVoteCount] = useState(tag.upvoteCount);

  const handleVote = async () => {
    if (!session || voting) return;

    setVoting(true);
    try {
      const res = await fetch(`/api/neighborhoods/${neighborhoodId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id }),
      });

      if (res.ok) {
        setVoted(!voted);
        setVoteCount((prev) => (voted ? prev - 1 : prev + 1));
        if (onVote) onVote();
      }
    } catch (error) {
      console.error('Failed to vote for tag:', error);
    } finally {
      setVoting(false);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={!session || voting}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        voted
          ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
          : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span>{tag.name}</span>
      <span className="flex items-center gap-1">
        <span className="text-xs">👍</span>
        <span className="font-semibold">{voteCount}</span>
      </span>
    </button>
  );
}
