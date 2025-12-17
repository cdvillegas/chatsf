'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface CommentFormProps {
  neighborhoodId: string;
  onCommentAdded?: () => void;
}

export default function CommentForm({ neighborhoodId, onCommentAdded }: CommentFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/neighborhoods/${neighborhoodId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to post review');
        setLoading(false);
        return;
      }

      setContent('');
      router.refresh();
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Write a review
        </label>
        <textarea
          id="comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience with this neighborhood..."
          rows={4}
          maxLength={500}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {content.length}/500 characters
          </span>
          {error && (
            <span className="text-xs text-red-600">{error}</span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || content.length < 10}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Posting...' : 'Post Review'}
      </button>
    </form>
  );
}
