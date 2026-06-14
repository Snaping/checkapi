import { Clock, Trash2, FileText } from 'lucide-react';
import { useReviewStore } from '@/store/useReviewStore';

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Sidebar = () => {
  const { history, currentReview, loadReview, deleteReview } = useReviewStore();

  return (
    <aside className="w-72 bg-slate-900 text-white h-screen flex flex-col border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
          <Clock className="w-5 h-5 text-blue-400" />
          历史评审
        </h2>
        <p className="text-sm text-slate-400 mt-1">点击加载继续编辑</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">暂无历史评审</p>
            <p className="text-xs mt-1">新建评审后可保存到历史</p>
          </div>
        ) : (
          history.map((record) => (
            <div
              key={record.id}
              className={`group relative p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                currentReview?.id === record.id
                  ? 'bg-blue-600/20 border-blue-500/50'
                  : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <div onClick={() => loadReview(record.id)}>
                <h3 className="font-medium text-sm truncate pr-8">
                  {record.apiName || '未命名 API'}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span>{formatDate(record.updatedAt)}</span>
                  <span className="text-slate-600">·</span>
                  <span>{record.specifications.length} 条规范</span>
                </div>
                {record.specifications.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
                        style={{
                          width: `${Math.round(
                            (record.specifications.filter((s) => s.status === 'pass').length /
                              record.specifications.length) *
                              100
                          )}%`
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      {Math.round(
                        (record.specifications.filter((s) => s.status === 'pass').length /
                          record.specifications.length) *
                          100
                      )}%
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteReview(record.id);
                }}
                className="absolute top-3 right-3 p-1.5 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
