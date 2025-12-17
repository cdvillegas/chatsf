'use client';

import { useState } from 'react';
import { CommentWithUser } from '@/types';
import CommentCard from './CommentCard';

interface CommentListProps {
  comments: CommentWithUser[];
}

type SortOption = 'helpful' | 'recent' | 'highest' | 'lowest';

export default function CommentList({ comments: initialComments }: CommentListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('helpful');
  const [comments, setComments] = useState(initialComments);

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'helpful':
        return b.helpfulVotes - a.helpfulVotes;
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'highest':
        return b.helpfulVotes - a.helpfulVotes; // Could use rating if we add it to comments
      case 'lowest':
        return a.helpfulVotes - b.helpfulVotes;
      default:
        return 0;
    }
  });

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">
          Reviews ({comments.length})
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="helpful">Most Helpful</option>
          <option value="recent">Most Recent</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>

      <div className="space-y-4">
        {sortedComments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
