export type SpecificationStatus = 'pass' | 'fail' | 'pending';

export interface SpecificationItem {
  id: string;
  name: string;
  description: string;
  status: SpecificationStatus;
  remarks: string;
}

export interface ReviewRecord {
  id: string;
  apiName: string;
  createdAt: number;
  updatedAt: number;
  specifications: SpecificationItem[];
}

export interface ReviewState {
  currentReview: ReviewRecord | null;
  history: ReviewRecord[];
  deleteTargetId: string | null;
}

export interface ReviewActions {
  createNewReview: (apiName?: string) => void;
  loadReview: (id: string) => void;
  saveAsNewReview: (apiName?: string) => void;
  deleteReview: (id: string) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  updateApiName: (name: string) => void;
  updateSpecification: (id: string, updates: Partial<SpecificationItem>) => void;
  addSpecification: (spec: Omit<SpecificationItem, 'id'>) => void;
  removeSpecification: (id: string) => void;
  loadPresetSpecifications: () => void;
  exportReport: (format: 'json' | 'text') => void;
  calculatePassRate: () => number;
  loadFromStorage: () => void;
}

export type ReviewStore = ReviewState & ReviewActions;
