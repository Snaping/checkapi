import { Check, X, Minus, Trash2 } from 'lucide-react';
import { useReviewStore } from '@/store/useReviewStore';
import { SpecificationItem, SpecificationStatus } from '@/types';

interface ReviewRowProps {
  spec: SpecificationItem;
  index: number;
}

const ReviewRow = ({ spec, index }: ReviewRowProps) => {
  const { updateSpecification, removeSpecification } = useReviewStore();

  const handleStatusChange = (status: SpecificationStatus) => {
    updateSpecification(spec.id, { status });
  };

  const handleRemarksChange = (remarks: string) => {
    updateSpecification(spec.id, { remarks });
  };

  return (
    <tr
      className={`border-b border-slate-200 transition-colors ${
        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
      } hover:bg-blue-50/30`}
    >
      <td className="px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-medium flex items-center justify-center">
            {index + 1}
          </span>
          <div>
            <div className="font-medium text-slate-800">{spec.name}</div>
            <div className="text-sm text-slate-500 mt-1 leading-relaxed">
              {spec.description}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name={`status-${spec.id}`}
              checked={spec.status === 'pass'}
              onChange={() => handleStatusChange('pass')}
              className="sr-only"
            />
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all ${
                spec.status === 'pass'
                  ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30 scale-105'
                  : 'bg-white border-slate-300 text-slate-400 group-hover:border-green-400 group-hover:text-green-400'
              }`}
            >
              <Check className="w-4 h-4" />
            </span>
            <span
              className={`text-sm ${
                spec.status === 'pass' ? 'text-green-600 font-medium' : 'text-slate-500'
              }`}
            >
              通过
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group ml-4">
            <input
              type="radio"
              name={`status-${spec.id}`}
              checked={spec.status === 'fail'}
              onChange={() => handleStatusChange('fail')}
              className="sr-only"
            />
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all ${
                spec.status === 'fail'
                  ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                  : 'bg-white border-slate-300 text-slate-400 group-hover:border-red-400 group-hover:text-red-400'
              }`}
            >
              <X className="w-4 h-4" />
            </span>
            <span
              className={`text-sm ${
                spec.status === 'fail' ? 'text-red-600 font-medium' : 'text-slate-500'
              }`}
            >
              不通过
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group ml-4">
            <input
              type="radio"
              name={`status-${spec.id}`}
              checked={spec.status === 'pending'}
              onChange={() => handleStatusChange('pending')}
              className="sr-only"
            />
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all ${
                spec.status === 'pending'
                  ? 'bg-slate-500 border-slate-500 text-white shadow-lg shadow-slate-500/30 scale-105'
                  : 'bg-white border-slate-300 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-400'
              }`}
            >
              <Minus className="w-4 h-4" />
            </span>
            <span
              className={`text-sm ${
                spec.status === 'pending' ? 'text-slate-600 font-medium' : 'text-slate-500'
              }`}
            >
              待评
            </span>
          </label>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="relative">
          <input
            type="text"
            value={spec.remarks}
            onChange={(e) => handleRemarksChange(e.target.value)}
            placeholder="添加备注..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400"
          />
        </div>
      </td>

      <td className="px-4 py-4 w-16">
        <button
          onClick={() => removeSpecification(spec.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
          title="删除此项"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

const ReviewTable = () => {
  const { currentReview } = useReviewStore();

  if (!currentReview || currentReview.specifications.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Minus className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无评审规范</h3>
        <p className="text-slate-500 mb-6">
          点击上方「快速填充」按钮加载预设的 API 设计规范
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-4 py-4 text-left text-sm font-semibold w-96">
                规范名称 / 描述
              </th>
              <th className="px-4 py-4 text-left text-sm font-semibold w-80">
                评审结果
              </th>
              <th className="px-4 py-4 text-left text-sm font-semibold">
                备注说明
              </th>
              <th className="px-4 py-4 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {currentReview.specifications.map((spec, index) => (
              <ReviewRow key={spec.id} spec={spec} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewTable;
