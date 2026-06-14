import { ReviewRecord } from '@/types';

const CURRENT_REVIEW_KEY = 'api-review-current';
const HISTORY_KEY = 'api-review-history';

export const storage = {
  getCurrentReview: (): ReviewRecord | null => {
    try {
      const data = localStorage.getItem(CURRENT_REVIEW_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentReview: (review: ReviewRecord | null): void => {
    try {
      if (review) {
        localStorage.setItem(CURRENT_REVIEW_KEY, JSON.stringify(review));
      } else {
        localStorage.removeItem(CURRENT_REVIEW_KEY);
      }
    } catch {
      console.error('Failed to save current review to localStorage');
    }
  },

  getHistory: (): ReviewRecord[] => {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setHistory: (history: ReviewRecord[]): void => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      console.error('Failed to save history to localStorage');
    }
  },

  addToHistory: (record: ReviewRecord): void => {
    const history = storage.getHistory();
    const existingIndex = history.findIndex((r) => r.id === record.id);
    if (existingIndex >= 0) {
      history[existingIndex] = record;
    } else {
      history.unshift(record);
    }
    storage.setHistory(history);
  },

  removeFromHistory: (id: string): void => {
    const history = storage.getHistory().filter((r) => r.id !== id);
    storage.setHistory(history);
  }
};
