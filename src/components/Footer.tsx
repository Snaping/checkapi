import { Save, Download, FileJson, FileText } from 'lucide-react';
import { useReviewStore } from '@/store/useReviewStore';
import { useState } from 'react';

const Footer = () => {
  const { currentReview, saveAsNewReview, exportReport } = useReviewStore();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleSaveAsNew = () => {
    const name = prompt('请输入新评审的名称（可选）：');
    if (name !== null) {
      saveAsNewReview(name || undefined);
    }
  };

  const handleExport = (format: 'json' | 'text') => {
    exportReport(format);
    setShowExportMenu(false);
  };

  return (
    <footer className="bg-white border-t border-slate-200 px-8 py-4 mt-auto">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {currentReview ? (
            <span>
              上次保存：
              <span className="text-slate-700 ml-1">
                {new Date(currentReview.updatedAt).toLocaleString('zh-CN')}
              </span>
            </span>
          ) : (
            <span>请创建或加载一个评审</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAsNew}
            disabled={!currentReview}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            另存为新评审
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!currentReview}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              导出评审报告
            </button>

            {showExportMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-slate-200 py-2 min-w-48 overflow-hidden z-50">
                <button
                  onClick={() => handleExport('json')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
                >
                  <FileJson className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium text-slate-700">JSON 格式</div>
                    <div className="text-xs text-slate-500">适合程序处理</div>
                  </div>
                </button>
                <div className="border-t border-slate-100" />
                <button
                  onClick={() => handleExport('text')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-left transition-colors"
                >
                  <FileText className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-sm font-medium text-slate-700">文本格式</div>
                    <div className="text-xs text-slate-500">适合阅读分享</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
