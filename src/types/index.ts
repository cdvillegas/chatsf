import { Neighborhood, Rating, Comment, Tag, User } from '@prisma/client';

// Extended types with relations
export type NeighborhoodWithStats = Neighborhood & {
  _count?: {
    ratings: number;
    comments: number;
    tags: number;
  };
};

export type CommentWithUser = Comment & {
  user: {
    name: string | null;
  };
};

export type RatingWithUser = Rating & {
  user: {
    name: string | null;
  };
};

export type TagWithVotes = Tag & {
  _count?: {
    votes: number;
  };
  hasVoted?: boolean;
};

// Category ratings structure
export interface CategoryRatings {
  safety: number;
  vibe: number;
  transit: number;
  food: number;
  nightlife: number;
  value: number;
}

// API response types
export interface NeighborhoodDetail extends NeighborhoodWithStats {
  ratings: RatingWithUser[];
  comments: CommentWithUser[];
  tags: TagWithVotes[];
  userRating?: Rating | null;
}

// Map types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface NeighborhoodFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    slug: string;
    avgRating: number;
    ratingCount: number;
  };
  geometry: any; // GeoJSON geometry
}

export interface NeighborhoodCollection {
  type: 'FeatureCollection';
  features: NeighborhoodFeature[];
}

// Form types
export interface RatingFormData {
  rating: number;
  categories: CategoryRatings;
}

export interface CommentFormData {
  content: string;
  photoUrls?: string[];
}

export interface TagFormData {
  name: string;
}
