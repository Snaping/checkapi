import { AlertTriangle, X } from 'lucide-react';
import { useReviewStore } from '@/store/useReviewStore';

const ConfirmDialog = () => {
  const { deleteTargetId, confirmDelete, cancelDelete, history } = useReviewStore();

  if (!deleteTargetId) return null;

  const targetRecord = history.find((r) => r.id === deleteTargetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={cancelDelete}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">确认删除</h3>
              <p className="text-sm text-slate-500 mt-1">此操作不可撤销</p>
            </div>
          </div>

          <div className="mt-6 bg-slate-50 rounded-xl p-4">
            <p className="text-slate-600">
              确定要删除评审记录
              <span className="font-semibold text-slate-800 mx-1">
                「{targetRecord?.apiName || '未命名'}」
              </span>
              吗？
            </p>
            <p className="text-sm text-slate-500 mt-2">
              删除后将无法恢复该评审的所有数据。
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={cancelDelete}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={confirmDelete}
            className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
          >
            确认删除
          </button>
        </div>

        <button
          onClick={cancelDelete}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ConfirmDialog;
