import { SpecificationItem } from '@/types';

export const presetSpecifications: Omit<SpecificationItem, 'id'>[] = [
  {
    name: 'URL 命名规范',
    description: 'URL 使用小写字母和连字符，采用名词复数形式，避免使用动词。例如：/api/users 而非 /api/getUser',
    status: 'pending',
    remarks: ''
  },
  {
    name: 'HTTP 方法正确使用',
    description: 'GET用于查询、POST用于创建、PUT用于全量更新、PATCH用于部分更新、DELETE用于删除',
    status: 'pending',
    remarks: ''
  },
  {
    name: 'HTTP 状态码规范',
    description: '200成功、201创建成功、204无内容、400参数错误、401未认证、403无权限、404资源不存在、500服务器错误',
    status: 'pending',
    remarks: ''
  },
  {
    name: '请求/响应格式',
    description: '统一使用JSON格式，请求头Content-Type为application/json，响应结构统一包含code、message、data字段',
    status: 'pending',
    remarks: ''
  },
  {
    name: 'API 版本控制',
    description: 'URL中包含版本号，如/api/v1/users，或通过请求头Accept传递版本信息',
    status: 'pending',
    remarks: ''
  },
  {
    name: '分页设计规范',
    description: '列表接口支持分页参数page/pageSize或limit/offset，响应包含total总数和currentPage等信息',
    status: 'pending',
    remarks: ''
  },
  {
    name: '错误处理规范',
    description: '错误响应包含统一的错误码、错误信息、时间戳，4xx错误提供具体的字段验证信息',
    status: 'pending',
    remarks: ''
  },
  {
    name: '认证与授权',
    description: '使用Bearer Token进行身份认证，接口权限控制明确，敏感操作需要二次验证',
    status: 'pending',
    remarks: ''
  },
  {
    name: 'API 文档规范',
    description: '提供Swagger/OpenAPI文档，包含接口说明、参数定义、请求示例、响应示例、错误码说明',
    status: 'pending',
    remarks: ''
  },
  {
    name: '参数校验',
    description: '所有输入参数进行合法性校验，包括必填性、格式、长度、范围等，返回明确的错误信息',
    status: 'pending',
    remarks: ''
  },
  {
    name: '幂等性设计',
    description: 'POST创建接口支持幂等键Idempotency-Key，PUT/PATCH/DELETE天然幂等',
    status: 'pending',
    remarks: ''
  },
  {
    name: '日期时间格式',
    description: '统一使用ISO 8601格式，如2024-01-15T10:30:00Z，时区使用UTC',
    status: 'pending',
    remarks: ''
  },
  {
    name: '枚举值规范',
    description: '枚举值使用大写字母加下划线，如STATUS_ACTIVE，避免使用魔法数字',
    status: 'pending',
    remarks: ''
  },
  {
    name: '接口性能',
    description: '响应时间控制在200ms以内，大数据量接口支持流式返回或异步处理',
    status: 'pending',
    remarks: ''
  },
  {
    name: '安全性规范',
    description: 'HTTPS传输、敏感数据加密、防止SQL注入/XSS/CSRF攻击、接口限流防刷',
    status: 'pending',
    remarks: ''
  }
];
