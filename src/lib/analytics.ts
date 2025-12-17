// Google Analytics helper functions

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID!, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Custom event tracking functions
export const trackRating = (neighborhoodName: string, rating: number) => {
  event({
    action: 'submit_rating',
    category: 'engagement',
    label: neighborhoodName,
    value: rating,
  });
};

export const trackComment = (neighborhoodName: string) => {
  event({
    action: 'submit_comment',
    category: 'engagement',
    label: neighborhoodName,
  });
};

export const trackMapInteraction = (action: 'zoom' | 'pan' | 'click', neighborhoodName?: string) => {
  event({
    action,
    category: 'map_interaction',
    label: neighborhoodName,
  });
};

export const trackShare = (neighborhoodName: string) => {
  event({
    action: 'share_neighborhood',
    category: 'engagement',
    label: neighborhoodName,
  });
};

export const trackSignIn = (provider: string) => {
  event({
    action: 'sign_in',
    category: 'authentication',
    label: provider,
  });
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}
