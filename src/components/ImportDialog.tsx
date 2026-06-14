import { useState, useRef } from 'react';
import { X, Upload, FileJson, FileText, Sparkles } from 'lucide-react';
import { autoReviewOpenAPI } from '@/utils/autoReview';
import { useReviewStore } from '@/store/useReviewStore';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportDialog = ({ isOpen, onClose }: ImportDialogProps) => {
  const [apiContent, setApiContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createNewReview, updateApiName, addSpecification } = useReviewStore();

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setApiContent(content);
      setError('');
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!apiContent.trim()) {
      setError('请输入或上传 API 文档内容');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result = autoReviewOpenAPI(apiContent);

      if (!result) {
        setError('无法解析 API 文档，请确保是有效的 OpenAPI/Swagger JSON 格式');
        setIsAnalyzing(false);
        return;
      }

      createNewReview(result.apiName);

      setTimeout(() => {
        updateApiName(result.apiName);
        for (const spec of result.specifications) {
          addSpecification({
            name: spec.name,
            description: spec.description,
            status: spec.status,
            remarks: spec.remarks
          });
        }
        onClose();
        setApiContent('');
        setIsAnalyzing(false);
      }, 100);
    } catch (err) {
      setError('分析失败，请检查文档格式');
      setIsAnalyzing(false);
    }
  };

  const loadSampleOpenAPI = () => {
    const sample = {
      openapi: '3.0.0',
      info: {
        title: '用户管理服务 API',
        version: '1.0.0',
        description: '用户管理相关的 RESTful API 接口'
      },
      servers: [
        {
          url: 'https://api.example.com/v1',
          description: '生产环境'
        }
      ],
      paths: {
        '/users': {
          get: {
            summary: '获取用户列表',
            description: '分页获取所有用户信息',
            tags: ['用户管理'],
            parameters: [
              {
                name: 'page',
                in: 'query',
                description: '页码',
                schema: { type: 'integer', minimum: 1, default: 1 }
              },
              {
                name: 'pageSize',
                in: 'query',
                description: '每页数量',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
              }
            ],
            responses: {
              '200': {
                description: '成功返回用户列表',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        code: { type: 'integer', example: 0 },
                        message: { type: 'string', example: 'success' },
                        data: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer' },
                            list: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/User' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              '400': { description: '请求参数错误' },
              '401': { description: '未授权' }
            }
          },
          post: {
            summary: '创建用户',
            description: '创建新用户',
            tags: ['用户管理'],
            parameters: [
              {
                name: 'Idempotency-Key',
                in: 'header',
                description: '幂等键',
                schema: { type: 'string' }
              }
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreateUserRequest' }
                }
              }
            },
            responses: {
              '201': {
                description: '用户创建成功',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        code: { type: 'integer' },
                        message: { type: 'string' },
                        data: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              },
              '400': { description: '参数错误' },
              '409': { description: '用户已存在' }
            }
          }
        },
        '/users/{id}': {
          get: {
            summary: '获取用户详情',
            tags: ['用户管理'],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: '用户ID',
                schema: { type: 'string' }
              }
            ],
            responses: {
              '200': {
                description: '成功',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        code: { type: 'integer' },
                        data: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              },
              '404': { description: '用户不存在' }
            }
          },
          put: {
            summary: '更新用户信息',
            tags: ['用户管理'],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: '用户ID',
                schema: { type: 'string' }
              }
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UpdateUserRequest' }
                }
              }
            },
            responses: {
              '200': { description: '更新成功' },
              '400': { description: '参数错误' },
              '404': { description: '用户不存在' }
            }
          },
          delete: {
            summary: '删除用户',
            tags: ['用户管理'],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: '用户ID',
                schema: { type: 'string' }
              }
            ],
            responses: {
              '204': { description: '删除成功' },
              '404': { description: '用户不存在' }
            }
          }
        }
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string', description: '用户ID' },
              name: { type: 'string', description: '用户名', minLength: 2, maxLength: 50 },
              email: { type: 'string', description: '邮箱', format: 'email' },
              status: {
                type: 'string',
                description: '用户状态',
                enum: ['ACTIVE', 'INACTIVE', 'BANNED']
              },
              createdAt: {
                type: 'string',
                description: '创建时间',
                format: 'date-time'
              },
              updatedAt: {
                type: 'string',
                description: '更新时间',
                format: 'date-time'
              }
            }
          },
          CreateUserRequest: {
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: { type: 'string', minLength: 2, maxLength: 50 },
              email: { type: 'string', format: 'email' }
            }
          },
          UpdateUserRequest: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 2, maxLength: 50 },
              email: { type: 'string', format: 'email' }
            }
          }
        },
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        {
          BearerAuth: []
        }
      ]
    };

    setApiContent(JSON.stringify(sample, null, 2));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">导入 API 文档</h2>
              <p className="text-sm text-slate-500">自动分析并生成评审报告</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              OpenAPI / Swagger 文档 (JSON 格式)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-blue-400 transition-colors bg-slate-50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  上传文件
                </button>
                <span className="text-sm text-slate-500">或</span>
                <button
                  onClick={loadSampleOpenAPI}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FileJson className="w-4 h-4" />
                  加载示例
                </button>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              文档内容
            </label>
            <textarea
              value={apiContent}
              onChange={(e) => {
                setApiContent(e.target.value);
                setError('');
              }}
              placeholder="粘贴 OpenAPI/Swagger JSON 内容到这里..."
              className="w-full h-64 px-4 py-3 border border-slate-300 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              自动评审包含以下项目
            </h3>
            <div className="grid grid-cols-3 gap-2 text-sm text-blue-700">
              <div>• URL 命名规范</div>
              <div>• HTTP 方法使用</div>
              <div>• 状态码规范</div>
              <div>• 请求响应格式</div>
              <div>• 版本控制</div>
              <div>• 分页设计</div>
              <div>• 错误处理</div>
              <div>• 认证授权</div>
              <div>• 文档完整性</div>
              <div>• 参数校验</div>
              <div>• 幂等性</div>
              <div>• 日期时间格式</div>
              <div>• 枚举命名</div>
              <div>• 性能考虑</div>
              <div>• 安全性</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !apiContent.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                开始自动评审
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDialog;
