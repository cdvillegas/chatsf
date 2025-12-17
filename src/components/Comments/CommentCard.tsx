'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { CommentWithUser } from '@/types';

interface CommentCardProps {
  comment: CommentWithUser;
  onVote?: (commentId: string, isHelpful: boolean) => void;
}

export default function CommentCard({ comment, onVote }: CommentCardProps) {
  const { data: session } = useSession();
  const [voting, setVoting] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState(comment.helpfulVotes);

  const handleVote = async (isHelpful: boolean) => {
    if (!session || voting) return;

    setVoting(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHelpful }),
      });

      if (res.ok) {
        // Optimistically update
        setHelpfulVotes((prev) => (isHelpful ? prev + 1 : prev));
        if (onVote) onVote(comment.id, isHelpful);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="border-b border-gray-100 pb-4 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {comment.user.name?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {comment.user.name || 'Anonymous'}
            </p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-3">{comment.content}</p>

      {comment.photoUrls && comment.photoUrls.length > 0 && (
        <div className="flex gap-2 mb-3">
          {comment.photoUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt="Review photo"
              className="w-20 h-20 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleVote(true)}
            disabled={!session || voting}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-green-600 transition-colors disabled:opacity-50"
          >
            <span className="text-lg">👍</span>
            <span className="font-medium">{helpfulVotes}</span>
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => handleVote(false)}
            disabled={!session || voting}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <span className="text-lg">👎</span>
            <span className="font-medium">{comment.notHelpfulVotes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
