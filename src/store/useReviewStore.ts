import { create } from 'zustand';
import { ReviewStore, ReviewRecord, SpecificationItem } from '@/types';
import { presetSpecifications } from '@/data/presetSpecs';
import { storage } from '@/utils/storage';
import { autoReviewOpenAPI } from '@/utils/autoReview';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const createReviewRecord = (apiName: string = ''): ReviewRecord => ({
  id: generateId(),
  apiName,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  specifications: []
});

const createSpecificationItem = (
  spec: Omit<SpecificationItem, 'id'>
): SpecificationItem => ({
  ...spec,
  id: generateId()
});

export const useReviewStore = create<ReviewStore>((set, get) => ({
  currentReview: null,
  history: [],
  deleteTargetId: null,

  loadFromStorage: () => {
    const currentReview = storage.getCurrentReview();
    const history = storage.getHistory();
    set({ currentReview, history });
  },

  createNewReview: (apiName?: string) => {
    const newReview = createReviewRecord(apiName);
    storage.setCurrentReview(newReview);
    set({ currentReview: newReview });
  },

  loadReview: (id: string) => {
    const review = get().history.find((r) => r.id === id);
    if (review) {
      const reviewCopy = { ...review, updatedAt: Date.now() };
      storage.setCurrentReview(reviewCopy);
      storage.addToHistory(reviewCopy);
      const updatedHistory = get().history.map((r) =>
        r.id === id ? reviewCopy : r
      );
      set({ currentReview: reviewCopy, history: updatedHistory });
    }
  },

  saveAsNewReview: (apiName?: string) => {
    const { currentReview } = get();
    if (!currentReview) return;

    const newReview: ReviewRecord = {
      ...currentReview,
      id: generateId(),
      apiName: apiName || currentReview.apiName,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.addToHistory(newReview);
    storage.setCurrentReview(newReview);
    set((state) => ({
      currentReview: newReview,
      history: [newReview, ...state.history]
    }));
  },

  deleteReview: (id: string) => {
    set({ deleteTargetId: id });
  },

  confirmDelete: () => {
    const { deleteTargetId, currentReview } = get();
    if (!deleteTargetId) return;

    storage.removeFromHistory(deleteTargetId);
    const updatedHistory = get().history.filter((r) => r.id !== deleteTargetId);

    let updatedCurrent = currentReview;
    if (currentReview?.id === deleteTargetId) {
      storage.setCurrentReview(null);
      updatedCurrent = null;
    }

    set({
      history: updatedHistory,
      currentReview: updatedCurrent,
      deleteTargetId: null
    });
  },

  cancelDelete: () => {
    set({ deleteTargetId: null });
  },

  updateApiName: (name: string) => {
    const { currentReview } = get();
    if (!currentReview) return;

    const updated = { ...currentReview, apiName: name, updatedAt: Date.now() };
    storage.setCurrentReview(updated);
    storage.addToHistory(updated);
    const updatedHistory = get().history.map((r) =>
      r.id === updated.id ? updated : r
    );
    set({ currentReview: updated, history: updatedHistory });
  },

  updateSpecification: (id: string, updates: Partial<SpecificationItem>) => {
    const { currentReview } = get();
    if (!currentReview) return;

    const updatedSpecs = currentReview.specifications.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    const updated = {
      ...currentReview,
      specifications: updatedSpecs,
      updatedAt: Date.now()
    };
    storage.setCurrentReview(updated);
    storage.addToHistory(updated);
    const updatedHistory = get().history.map((r) =>
      r.id === updated.id ? updated : r
    );
    set({ currentReview: updated, history: updatedHistory });
  },

  addSpecification: (spec: Omit<SpecificationItem, 'id'>) => {
    const { currentReview } = get();
    if (!currentReview) return;

    const newSpec = createSpecificationItem(spec);
    const updated = {
      ...currentReview,
      specifications: [...currentReview.specifications, newSpec],
      updatedAt: Date.now()
    };
    storage.setCurrentReview(updated);
    storage.addToHistory(updated);
    const updatedHistory = get().history.map((r) =>
      r.id === updated.id ? updated : r
    );
    set({ currentReview: updated, history: updatedHistory });
  },

  removeSpecification: (id: string) => {
    const { currentReview } = get();
    if (!currentReview) return;

    const updatedSpecs = currentReview.specifications.filter((s) => s.id !== id);
    const updated = {
      ...currentReview,
      specifications: updatedSpecs,
      updatedAt: Date.now()
    };
    storage.setCurrentReview(updated);
    storage.addToHistory(updated);
    const updatedHistory = get().history.map((r) =>
      r.id === updated.id ? updated : r
    );
    set({ currentReview: updated, history: updatedHistory });
  },

  loadPresetSpecifications: () => {
    const { currentReview, createNewReview } = get();
    let review = currentReview;

    if (!review) {
      createNewReview();
      review = get().currentReview;
      if (!review) return;
    }

    const presetItems = presetSpecifications.map(createSpecificationItem);
    const updated = {
      ...review,
      specifications: [...presetItems],
      updatedAt: Date.now()
    };
    storage.setCurrentReview(updated);
    storage.addToHistory(updated);
    const updatedHistory = get().history.map((r) =>
      r.id === updated.id ? updated : r
    );
    set({ currentReview: updated, history: updatedHistory });
  },

  applyAutoReview: (content: string) => {
    const result = autoReviewOpenAPI(content);
    if (!result) return false;

    const { createNewReview } = get();
    createNewReview(result.apiName);

    const review = get().currentReview;
    if (!review) return false;

    const specItems = result.specifications.map(createSpecificationItem);
    const updated = {
      ...review,
      apiName: result.apiName,
      specifications: specItems,
      updatedAt: Date.now()
    };
    storage.setCurrentReview(updated);
    storage.addToHistory(updated);
    const updatedHistory = get().history.map((r) =>
      r.id === updated.id ? updated : r
    );
    set({ currentReview: updated, history: updatedHistory });
    return true;
  },

  calculatePassRate: () => {
    const { currentReview } = get();
    if (!currentReview) return 0;
    const total = currentReview.specifications.length;
    if (total === 0) return 0;
    const passed = currentReview.specifications.filter(
      (s) => s.status === 'pass'
    ).length;
    return Math.round((passed / total) * 100);
  },

  exportReport: (format: 'json' | 'text') => {
    const { currentReview } = get();
    if (!currentReview) return;

    const passRate = get().calculatePassRate();
    const total = currentReview.specifications.length;
    const passed = currentReview.specifications.filter(
      (s) => s.status === 'pass'
    ).length;
    const failed = currentReview.specifications.filter(
      (s) => s.status === 'fail'
    ).length;
    const pending = total - passed - failed;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      const report = {
        apiName: currentReview.apiName,
        exportTime: new Date().toISOString(),
        passRate: `${passRate}%`,
        statistics: {
          total,
          passed,
          failed,
          pending
        },
        specifications: currentReview.specifications.map((s) => ({
          name: s.name,
          description: s.description,
          status: s.status,
          remarks: s.remarks
        }))
      };
      content = JSON.stringify(report, null, 2);
      filename = `api-review-${Date.now()}.json`;
      mimeType = 'application/json';
    } else {
      const lines: string[] = [];
      lines.push('========================================');
      lines.push('   RESTful API 设计评审报告');
      lines.push('========================================');
      lines.push('');
      lines.push(`API 名称: ${currentReview.apiName || '未命名'}`);
      lines.push(`导出时间: ${new Date().toLocaleString()}`);
      lines.push(`评审时间: ${new Date(currentReview.updatedAt).toLocaleString()}`);
      lines.push('');
      lines.push('----------------------------------------');
      lines.push('评审统计');
      lines.push('----------------------------------------');
      lines.push(`通过率: ${passRate}%`);
      lines.push(`总规范数: ${total}`);
      lines.push(`通过: ${passed}`);
      lines.push(`不通过: ${failed}`);
      lines.push(`待评审: ${pending}`);
      lines.push('');
      lines.push('----------------------------------------');
      lines.push('规范详情');
      lines.push('----------------------------------------');
      currentReview.specifications.forEach((spec, index) => {
        lines.push('');
        lines.push(`${index + 1}. ${spec.name}`);
        lines.push(`   状态: ${spec.status === 'pass' ? '✅ 通过' : spec.status === 'fail' ? '❌ 不通过' : '⏳ 待评审'}`);
        lines.push(`   描述: ${spec.description}`);
        if (spec.remarks) {
          lines.push(`   备注: ${spec.remarks}`);
        }
      });
      lines.push('');
      lines.push('========================================');
      content = lines.join('\n');
      filename = `api-review-${Date.now()}.txt`;
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}));
