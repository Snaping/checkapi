import { useReviewStore } from '@/store/useReviewStore';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const ProgressBar = () => {
  const { currentReview, calculatePassRate } = useReviewStore();
  const passRate = calculatePassRate();

  const total = currentReview?.specifications.length || 0;
  const passed = currentReview?.specifications.filter((s) => s.status === 'pass').length || 0;
  const failed = currentReview?.specifications.filter((s) => s.status === 'fail').length || 0;
  const pending = total - passed - failed;

  const getProgressColor = () => {
    if (passRate >= 80) return 'from-green-500 to-emerald-400';
    if (passRate >= 50) return 'from-amber-500 to-yellow-400';
    return 'from-red-500 to-rose-400';
  };

  const getTextColor = () => {
    if (passRate >= 80) return 'text-green-600';
    if (passRate >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">当前评审进度</h3>
          <p className="text-sm text-slate-500 mt-1">
            实时统计评审通过情况
          </p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${getTextColor()}`}>
            {passRate}%
          </div>
          <p className="text-sm text-slate-500 mt-1">整体通过率</p>
        </div>
      </div>

      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressColor()} transition-all duration-700 ease-out rounded-full`}
          style={{ width: `${passRate}%` }}
        />
      </div>

      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-slate-600">
            通过 <span className="font-semibold text-green-600">{passed}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-slate-600">
            不通过 <span className="font-semibold text-red-600">{failed}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">
            待评审 <span className="font-semibold text-slate-600">{pending}</span>
          </span>
        </div>
        <div className="flex-1 text-right">
          <span className="text-sm text-slate-500">
            共 <span className="font-semibold text-slate-700">{total}</span> 条规范
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
