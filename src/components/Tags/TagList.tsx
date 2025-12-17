'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TagWithVotes } from '@/types';
import TagVoteButton from './TagVoteButton';

interface TagListProps {
  tags: TagWithVotes[];
  neighborhoodId: string;
}

export default function TagList({ tags: initialTags, neighborhoodId }: TagListProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newTagName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/neighborhoods/${neighborhoodId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to add tag');
        setLoading(false);
        return;
      }

      setNewTagName('');
      setShowAddTag(false);
      router.refresh();
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (tags.length === 0 && !session) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">No tags yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Community Tags</h3>
        {session && (
          <button
            onClick={() => setShowAddTag(!showAddTag)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAddTag ? 'Cancel' : '+ Add Tag'}
          </button>
        )}
      </div>

      {showAddTag && (
        <form onSubmit={handleAddTag} className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="e.g., Dog Friendly"
            maxLength={30}
            required
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            disabled={loading || !newTagName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? '...' : 'Add'}
          </button>
        </form>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagVoteButton
            key={tag.id}
            tag={tag}
            neighborhoodId={neighborhoodId}
            onVote={() => router.refresh()}
          />
        ))}
      </div>

      {tags.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">
          No tags yet. Be the first to add one!
        </p>
      )}
    </div>
  );
}
