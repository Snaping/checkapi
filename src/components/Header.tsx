import { Plus, FileJson, Zap, Upload, Loader2 } from 'lucide-react';
import { useReviewStore } from '@/store/useReviewStore';
import { useState, useEffect, useRef, useCallback } from 'react';

interface HeaderProps {
  onImportClick: () => void;
}

const Header = ({ onImportClick }: HeaderProps) => {
  const { currentReview, createNewReview, updateApiName, loadPresetSpecifications, applyAutoReview } =
    useReviewStore();
  const [apiName, setApiName] = useState(currentReview?.apiName || '');
  const [isAutoReviewing, setIsAutoReviewing] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const autoReviewTriggeredRef = useRef(false);

  useEffect(() => {
    setApiName(currentReview?.apiName || '');
    autoReviewTriggeredRef.current = false;
  }, [currentReview?.id, currentReview?.apiName]);

  const tryAutoReview = useCallback((content: string) => {
    const trimmed = content.trim();
    
    if (!trimmed.startsWith('{')) {
      return;
    }

    if (!trimmed.includes('openapi') && !trimmed.includes('swagger')) {
      return;
    }

    setIsAutoReviewing(true);
    
    try {
      const success = applyAutoReview(trimmed);
      if (success) {
        autoReviewTriggeredRef.current = true;
      }
    } catch (e) {
      // 解析失败，忽略
    } finally {
      setTimeout(() => setIsAutoReviewing(false), 300);
    }
  }, [applyAutoReview]);

  const handleApiNameChange = (value: string) => {
    setApiName(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (autoReviewTriggeredRef.current) {
      updateApiName(value);
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed.startsWith('{') && (trimmed.includes('openapi') || trimmed.includes('swagger'))) {
        tryAutoReview(trimmed);
      } else {
        updateApiName(value);
      }
    }, 500);
  };

  const handleNewReview = () => {
    const name = prompt('请输入 API 名称（可选）：');
    if (name !== null) {
      createNewReview(name);
      setApiName(name);
      autoReviewTriggeredRef.current = false;
    }
  };

  const handleLoadPreset = () => {
    loadPresetSpecifications();
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <FileJson className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">API 设计评审工具</h1>
              <p className="text-xs text-slate-500">RESTful API 规范检查与质量评估</p>
            </div>
          </div>

          <div className="flex-1 max-w-md ml-12">
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              API 名称
              <span className="text-xs text-slate-400 font-normal ml-2">
                （粘贴 OpenAPI JSON 可自动评审）
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={apiName}
                onChange={(e) => handleApiNameChange(e.target.value)}
                placeholder="请输入 API 名称，或粘贴 OpenAPI JSON..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400 pr-10"
              />
              {isAutoReviewing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onImportClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Upload className="w-4 h-4" />
            导入文档
          </button>
          <button
            onClick={handleLoadPreset}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Zap className="w-4 h-4" />
            快速填充
          </button>
          <button
            onClick={handleNewReview}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            新建评审
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
