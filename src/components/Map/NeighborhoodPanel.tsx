'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Review {
  id: string;
  content: string;
  rating: number;
  categories: {
    safety: number;
    vibe: number;
    transit: number;
    food: number;
    nightlife: number;
    value: number;
  };
  user: {
    name: string;
  };
  createdAt: string;
  helpfulVotes: number;
  notHelpfulVotes: number;
}

interface NeighborhoodData {
  id: string;
  name: string;
  avgRating: number;
  ratingCount: number;
  comments: Review[];
}

interface Props {
  neighborhoodId: string | null;
  onClose: () => void;
}

export default function NeighborhoodPanel({ neighborhoodId, onClose }: Props) {
  const { data: session } = useSession();
  const [data, setData] = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [categories, setCategories] = useState({
    safety: 0,
    vibe: 0,
    transit: 0,
    food: 0,
    nightlife: 0,
    value: 0,
  });
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    if (!neighborhoodId) return;
    
    setLoading(true);
    fetch(`/api/neighborhoods/${neighborhoodId}`)
      .then(res => res.json())
      .then(data => {
        console.log('Neighborhood data:', data);
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching neighborhood:', err);
        setLoading(false);
      });
  }, [neighborhoodId]);

  const handleSubmitRating = async () => {
    if (!session || !neighborhoodId) return;

    try {
      await fetch(`/api/neighborhoods/${neighborhoodId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, categories }),
      });

      if (reviewText.trim()) {
        await fetch(`/api/neighborhoods/${neighborhoodId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: reviewText }),
        });
      }

      // Refresh data
      const res = await fetch(`/api/neighborhoods/${neighborhoodId}`);
      const newData = await res.json();
      setData(newData);
      
      setShowRatingForm(false);
      setRating(0);
      setCategories({ safety: 0, vibe: 0, transit: 0, food: 0, nightlife: 0, value: 0 });
      setReviewText('');
    } catch (err) {
      console.error(err);
    }
  };

  if (!neighborhoodId) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '64px',
      right: 0,
      bottom: 0,
      width: '440px',
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(0, 0, 0, 0.08)',
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.3s ease-out',
    }}>
      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#000',
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: '1.2',
          }}>
            {loading ? 'Loading...' : data?.name || 'Neighborhood'}
          </h2>
          {data && data.ratingCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '18px' }}>{'⭐'.repeat(Math.round(data.avgRating || 0))}</span>
              <span style={{ fontSize: '15px', color: '#86868b' }}>
                {(data.avgRating || 0).toFixed(1)} ({data.ratingCount} rating{data.ratingCount !== 1 ? 's' : ''})
              </span>
            </div>
          )}
          {data && data.ratingCount === 0 && (
            <div style={{ fontSize: '14px', color: '#86868b', marginTop: '4px' }}>
              No ratings yet
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: '#86868b',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#86868b' }}>
            Loading...
          </div>
        ) : (
          <>
            {/* Rate Button */}
            {!showRatingForm && session && (
              <button
                onClick={() => setShowRatingForm(true)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '24px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1d1d1f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#000';
                }}
              >
                Rate this neighborhood
              </button>
            )}

            {!session && (
              <div style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.03)',
                borderRadius: '12px',
                marginBottom: '24px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#86868b',
              }}>
                Sign in to rate and review
              </div>
            )}

            {/* Rating Form */}
            {showRatingForm && (
              <div style={{
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.02)',
                borderRadius: '12px',
                marginBottom: '24px',
              }}>
                <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '16px', color: '#000' }}>
                  Rate {data?.name}
                </h3>
                
                {/* Overall Rating */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '14px', color: '#86868b', display: 'block', marginBottom: '8px' }}>
                    Overall Rating
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <button
                        key={i}
                        onMouseEnter={() => setHoverRating(i)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(i)}
                        style={{
                          fontSize: '32px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          filter: (hoverRating >= i || rating >= i) ? 'none' : 'grayscale(1)',
                          opacity: (hoverRating >= i || rating >= i) ? 1 : 0.3,
                          transition: 'all 0.2s',
                        }}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                {Object.entries(categories).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', color: '#86868b', display: 'block', marginBottom: '6px', textTransform: 'capitalize' }}>
                      {key}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={value || 3}
                      onChange={(e) => setCategories({...categories, [key]: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}

                {/* Review Text */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', color: '#86868b', display: 'block', marginBottom: '8px' }}>
                    Write a review (optional)
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience..."
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleSubmitRating}
                    disabled={rating === 0}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: rating === 0 ? '#e5e5e7' : '#000',
                      color: rating === 0 ? '#86868b' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: rating === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setShowRatingForm(false)}
                    style={{
                      padding: '12px 20px',
                      background: 'transparent',
                      color: '#000',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '16px', color: '#000' }}>
                Reviews
              </h3>
              {data?.comments && data.comments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {data.comments.map(review => (
                    <div
                      key={review.id}
                      style={{
                        padding: '16px',
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#000' }}>
                            {review.user.name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#86868b' }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ fontSize: '16px' }}>
                          {'⭐'.repeat(review.rating)}
                        </div>
                      </div>
                      {review.content && (
                        <p style={{ fontSize: '14px', color: '#1d1d1f', lineHeight: '1.5', margin: '8px 0' }}>
                          {review.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#86868b', fontSize: '14px' }}>
                  No reviews yet. Be the first to review!
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
