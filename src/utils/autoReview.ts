import { SpecificationItem } from '@/types';
import { presetSpecifications } from '@/data/presetSpecs';

interface OpenAPIInfo {
  title?: string;
  version?: string;
  description?: string;
}

interface OpenAPIPathItem {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  [key: string]: OpenAPIOperation | undefined;
}

interface OpenAPIOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses?: Record<string, OpenAPIResponse>;
  security?: any[];
}

interface OpenAPIParameter {
  name: string;
  in: string;
  description?: string;
  required?: boolean;
  schema?: any;
  type?: string;
  format?: string;
}

interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, any>;
}

interface OpenAPIResponse {
  description?: string;
  content?: Record<string, any>;
}

interface OpenAPIDocument {
  openapi?: string;
  swagger?: string;
  info?: OpenAPIInfo;
  paths?: Record<string, OpenAPIPathItem>;
  components?: any;
  security?: any[];
  securitySchemes?: any;
  servers?: any[];
}

interface ReviewResult {
  apiName: string;
  specifications: SpecificationItem[];
}

const parseOpenAPI = (content: string): OpenAPIDocument | null => {
  try {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return JSON.parse(trimmed);
    }
    return null;
  } catch (e) {
    console.error('Failed to parse OpenAPI document:', e);
    return null;
  }
};

const checkUrlNaming = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const paths = Object.keys(doc.paths || {});
  if (paths.length === 0) return { pass: false, remarks: '未找到任何 API 路径' };

  let violations: string[] = [];
  let passCount = 0;

  for (const path of paths) {
    const pathWithoutParams = path.replace(/\{[^}]+\}/g, 'param');
    const segments = pathWithoutParams.split('/').filter((s) => s.length > 0);

    let hasVerbs = false;
    let hasUpperCase = false;
    let usesUnderscore = false;

    for (const seg of segments) {
      if (seg === 'param') continue;
      const lowerSeg = seg.toLowerCase();
      if (
        lowerSeg.startsWith('get') ||
        lowerSeg.startsWith('create') ||
        lowerSeg.startsWith('update') ||
        lowerSeg.startsWith('delete') ||
        lowerSeg.startsWith('list') ||
        lowerSeg.startsWith('add') ||
        lowerSeg.startsWith('remove')
      ) {
        hasVerbs = true;
      }
      if (/[A-Z]/.test(seg)) hasUpperCase = true;
      if (seg.includes('_')) usesUnderscore = true;
    }

    if (!hasVerbs && !hasUpperCase && !usesUnderscore) {
      passCount++;
    } else {
      if (violations.length < 3) {
        const reasons = [];
        if (hasVerbs) reasons.push('含动词');
        if (hasUpperCase) reasons.push('有大写字母');
        if (usesUnderscore) reasons.push('用下划线');
        violations.push(`${path} (${reasons.join(', ')})`);
      }
    }
  }

  const passRate = passCount / paths.length;
  const pass = passRate >= 0.7;

  let remarks = `共 ${paths.length} 个接口，${passCount} 个符合规范 (${Math.round(
    passRate * 100
  )}%)`;
  if (violations.length > 0) {
    remarks += `。问题示例：${violations.join('；')}`;
  }

  return { pass, remarks };
};

const checkHttpMethods = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const paths = Object.keys(doc.paths || {});
  if (paths.length === 0) return { pass: false, remarks: '未找到任何 API 路径' };

  let totalOps = 0;
  let correctOps = 0;
  let issues: string[] = [];

  for (const path of paths) {
    const pathItem = doc.paths?.[path];
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'];

    for (const method of methods) {
      const op = pathItem[method];
      if (!op) continue;
      totalOps++;

      let isCorrect = true;
      const pathLower = path.toLowerCase();

      if (method === 'post') {
        if (pathLower.includes('update') || pathLower.includes('edit')) {
          isCorrect = false;
          if (issues.length < 3) issues.push(`${method.toUpperCase()} ${path} 应用 PUT/PATCH`);
        }
      }

      if (method === 'get' && op.requestBody) {
        isCorrect = false;
        if (issues.length < 3) issues.push(`${method.toUpperCase()} ${path} 不应有请求体`);
      }

      if (isCorrect) correctOps++;
    }
  }

  const passRate = totalOps > 0 ? correctOps / totalOps : 1;
  const pass = passRate >= 0.8;

  let remarks = `共 ${totalOps} 个操作，${correctOps} 个方法使用正确 (${Math.round(
    passRate * 100
  )}%)`;
  if (issues.length > 0) {
    remarks += `。问题示例：${issues.join('；')}`;
  }

  return { pass, remarks };
};

const checkStatusCodes = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const paths = Object.keys(doc.paths || {});
  if (paths.length === 0) return { pass: false, remarks: '未找到任何 API 路径' };

  let totalOps = 0;
  let has2xx = 0;
  let hasErrorCodes = 0;
  let issues: string[] = [];

  for (const path of paths) {
    const pathItem = doc.paths?.[path];
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'];

    for (const method of methods) {
      const op = pathItem[method];
      if (!op || !op.responses) continue;
      totalOps++;

      const responseCodes = Object.keys(op.responses);
      const hasSuccess = responseCodes.some((c) => c.startsWith('2'));
      const has4xx = responseCodes.some((c) => c.startsWith('4'));
      const has5xx = responseCodes.some((c) => c.startsWith('5'));

      if (hasSuccess) has2xx++;
      if (has4xx || has5xx) hasErrorCodes++;

      if (!hasSuccess && issues.length < 3) {
        issues.push(`${method.toUpperCase()} ${path} 缺少成功响应`);
      }
    }
  }

  const successRate = totalOps > 0 ? has2xx / totalOps : 1;
  const errorRate = totalOps > 0 ? hasErrorCodes / totalOps : 0;
  const pass = successRate >= 0.9 && errorRate >= 0.5;

  let remarks = `共 ${totalOps} 个操作，${has2xx} 个有成功响应 (${Math.round(
    successRate * 100
  )}%)，${hasErrorCodes} 个有错误响应 (${Math.round(errorRate * 100)}%)`;
  if (issues.length > 0) {
    remarks += `。问题示例：${issues.join('；')}`;
  }

  return { pass, remarks };
};

const checkRequestResponseFormat = (doc: OpenAPIDocument): {
  pass: boolean;
  remarks: string;
} => {
  const paths = Object.keys(doc.paths || {});
  if (paths.length === 0) return { pass: false, remarks: '未找到任何 API 路径' };

  let totalWithBody = 0;
  let jsonCount = 0;

  for (const path of paths) {
    const pathItem = doc.paths?.[path];
    if (!pathItem) continue;

    const methods = ['post', 'put', 'patch'];

    for (const method of methods) {
      const op = pathItem[method];
      if (!op) continue;

      if (op.requestBody?.content) {
        totalWithBody++;
        if ('application/json' in op.requestBody.content) {
          jsonCount++;
        }
      }

      if (op.responses) {
        for (const code of Object.keys(op.responses)) {
          const response = op.responses[code];
          if (response.content) {
            totalWithBody++;
            if ('application/json' in response.content) {
              jsonCount++;
            }
          }
        }
      }
    }

    if (pathItem.get?.responses) {
      for (const code of Object.keys(pathItem.get.responses)) {
        const response = pathItem.get.responses[code];
        if (response.content) {
          totalWithBody++;
          if ('application/json' in response.content) {
            jsonCount++;
          }
        }
      }
    }
  }

  const passRate = totalWithBody > 0 ? jsonCount / totalWithBody : 1;
  const pass = passRate >= 0.9;

  const remarks = `共 ${totalWithBody} 个请求/响应体，${jsonCount} 个使用 JSON 格式 (${Math.round(
    passRate * 100
  )}%)`;

  return { pass, remarks };
};

const checkVersioning = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const paths = Object.keys(doc.paths || {});
  const infoVersion = doc.info?.version || '';

  let hasUrlVersion = false;
  let hasAcceptVersion = false;

  for (const path of paths) {
    if (/\/v\d+/.test(path) || /\/version\/\d+/.test(path)) {
      hasUrlVersion = true;
      break;
    }
  }

  let versionedPaths = 0;
  for (const path of paths) {
    if (/\/v\d+/.test(path)) {
      versionedPaths++;
    }
  }

  const pass = hasUrlVersion || (infoVersion.length > 0);
  const versionPercentage =
    paths.length > 0 ? Math.round((versionedPaths / paths.length) * 100) : 0;

  let remarks = '';
  if (hasUrlVersion) {
    remarks = `URL 中包含版本号，${versionedPaths}/${paths.length} 个接口带版本 (${versionPercentage}%)`;
  } else if (infoVersion) {
    remarks = `文档版本: ${infoVersion}，但 URL 中未包含版本号`;
  } else {
    remarks = '未发现版本控制机制';
  }

  return { pass, remarks };
};

const checkPagination = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const paths = Object.keys(doc.paths || {});
  if (paths.length === 0) return { pass: false, remarks: '未找到任何 API 路径' };

  let listEndpoints = 0;
  let withPagination = 0;
  let examples: string[] = [];

  for (const path of paths) {
    const pathItem = doc.paths?.[path];
    if (!pathItem?.get) continue;

    const lastSegment = path.split('/').filter(Boolean).pop() || '';
    const isListLike =
      !path.includes('{') ||
      lastSegment.endsWith('s') ||
      lastSegment.includes('list') ||
      lastSegment.includes('search') ||
      lastSegment.includes('query');

    if (isListLike) {
      listEndpoints++;

      const params = pathItem.get.parameters || [];
      const hasPageParams = params.some(
        (p) =>
          p.name.toLowerCase().includes('page') ||
          p.name.toLowerCase().includes('limit') ||
          p.name.toLowerCase().includes('offset') ||
          p.name.toLowerCase().includes('size') ||
          p.name.toLowerCase().includes('cursor')
      );

      if (hasPageParams) {
        withPagination++;
      } else if (examples.length < 3) {
        examples.push(path);
      }
    }
  }

  const passRate = listEndpoints > 0 ? withPagination / listEndpoints : 1;
  const pass = passRate >= 0.6;

  let remarks = `共 ${listEndpoints} 个列表类接口，${withPagination} 个支持分页 (${Math.round(
    passRate * 100
  )}%)`;
  if (examples.length > 0) {
    remarks += `。缺少分页的接口示例：${examples.join('、')}`;
  }

  return { pass, remarks };
};

const checkErrorHandling = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const paths = Object.keys(doc.paths || {});
  if (paths.length === 0) return { pass: false, remarks: '未找到任何 API 路径' };

  let totalOps = 0;
  let has400 = 0;
  let has401 = 0;
  let has404 = 0;

  for (const path of paths) {
    const pathItem = doc.paths?.[path];
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'];

    for (const method of methods) {
      const op = pathItem[method];
      if (!op?.responses) continue;
      totalOps++;

      const codes = Object.keys(op.responses);
      if (codes.includes('400') || codes.includes('422')) has400++;
      if (codes.includes('401')) has401++;
      if (codes.includes('404')) has404++;
    }
  }

  const errorCoverage = totalOps > 0 ? (has400 + has404) / (totalOps * 2) : 0;
  const pass = errorCoverage >= 0.4;

  let remarks = `共 ${totalOps} 个操作，参数错误响应: ${has400} (${Math.round(
    (has400 / (totalOps || 1)) * 100
  )}%)，未找到响应: ${has404} (${Math.round(
    (has404 / (totalOps || 1)) * 100
  )}%)，未授权响应: ${has401}`;

  return { pass, remarks };
};

const checkAuth = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const hasSecuritySchemes =
    doc.components?.securitySchemes || doc.securitySchemes;
  const hasGlobalSecurity = doc.security && doc.security.length > 0;

  const paths = Object.keys(doc.paths || {});
  let securedEndpoints = 0;
  let totalEndpoints = 0;

  for (const path of paths) {
    const pathItem = doc.paths?.[path];
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    for (const method of methods) {
      const op = pathItem[method];
      if (!op) continue;
      totalEndpoints++;

      if (op.security || hasGlobalSecurity) {
        securedEndpoints++;
      }
    }
  }

  const pass = hasSecuritySchemes && securedEndpoints > 0;
  const coveragePercent =
    totalEndpoints > 0 ? Math.round((securedEndpoints / totalEndpoints) * 100) : 0;

  let remarks = '';
  if (hasSecuritySchemes) {
    remarks = `已定义安全方案，${securedEndpoints}/${totalEndpoints} 个接口受保护 (${coveragePercent}%)`;
  } else {
    remarks = '未定义安全认证方案';
  }

  return { pass, remarks };
};

const checkDocumentation = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const paths = Object.keys(doc.paths || {});
  if (paths.length === 0) return { pass: false, remarks: '未找到任何 API 路径' };

  let totalOps = 0;
  let withSummary = 0;
  let withDescription = 0;
  let paramsDocumented = 0;
  let totalParams = 0;

  for (const path of paths) {
    const pathItem = doc.paths?.[path];
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'];

    for (const method of methods) {
      const op = pathItem[method];
      if (!op) continue;
      totalOps++;

      if (op.summary) withSummary++;
      if (op.description) withDescription++;

      const params = op.parameters || [];
      for (const param of params) {
        totalParams++;
        if (param.description) paramsDocumented++;
      }
    }
  }

  const summaryRate = totalOps > 0 ? withSummary / totalOps : 1;
  const paramDocRate = totalParams > 0 ? paramsDocumented / totalParams : 1;
  const pass = summaryRate >= 0.7 && paramDocRate >= 0.5;

  let remarks = `共 ${totalOps} 个操作，${withSummary} 个有摘要 (${Math.round(
    summaryRate * 100
  )}%)；共 ${totalParams} 个参数，${paramsDocumented} 个有描述 (${Math.round(
    paramDocRate * 100
  )}%)`;

  if (doc.info?.description) {
    remarks += '；包含整体文档说明';
  }

  return { pass, remarks };
};

const checkParameterValidation = (doc: OpenAPIDocument): {
  pass: boolean;
  remarks: string;
} => {
  const paths = Object.keys(doc.paths || {});
  if (paths.length === 0) return { pass: false, remarks: '未找到任何 API 路径' };

  let totalParams = 0;
  let withType = 0;
  let withConstraints = 0;

  for (const path of paths) {
    const pathItem = doc.paths?.[path];
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'];

    for (const method of methods) {
      const op = pathItem[method];
      if (!op) continue;

      const params = op.parameters || [];
      for (const param of params) {
        totalParams++;
        if (param.schema || param.type) {
          withType++;
          const schema = param.schema || param;
          if (
            schema.minLength !== undefined ||
            schema.maxLength !== undefined ||
            schema.minimum !== undefined ||
            schema.maximum !== undefined ||
            schema.pattern ||
            schema.enum
          ) {
            withConstraints++;
          }
        }
      }
    }
  }

  const typeRate = totalParams > 0 ? withType / totalParams : 1;
  const constraintRate = totalParams > 0 ? withConstraints / totalParams : 0;
  const pass = typeRate >= 0.7;

  let remarks = `共 ${totalParams} 个参数，${withType} 个有类型定义 (${Math.round(
    typeRate * 100
  )}%)，${withConstraints} 个有约束条件 (${Math.round(constraintRate * 100)}%)`;

  return { pass, remarks };
};

const checkIdempotency = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const paths = Object.keys(doc.paths || {});
  if (paths.length === 0) return { pass: false, remarks: '未找到任何 API 路径' };

  let postCount = 0;
  let withIdempotency = 0;

  for (const path of paths) {
    const pathItem = doc.paths?.[path];
    if (!pathItem?.post) continue;

    postCount++;
    const op = pathItem.post;
    const hasIdempotencyHeader = (op.parameters || []).some(
      (p) =>
        p.name.toLowerCase().includes('idempotency') ||
        p.name.toLowerCase().includes('幂等')
    );

    if (hasIdempotencyHeader) {
      withIdempotency++;
    }
  }

  const pass = postCount === 0 || withIdempotency > 0;
  const percentage = postCount > 0 ? Math.round((withIdempotency / postCount) * 100) : 0;

  let remarks = '';
  if (postCount === 0) {
    remarks = '无 POST 接口，无需幂等设计';
  } else {
    remarks = `共 ${postCount} 个 POST 接口，${withIdempotency} 个支持幂等键 (${percentage}%)`;
  }

  return { pass, remarks };
};

const checkDateTimeFormat = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const paths = Object.keys(doc.paths || {});
  if (paths.length === 0) return { pass: false, remarks: '未找到任何 API 路径' };

  let dateFields = 0;
  let isoFormat = 0;

  const checkSchema = (schema: any, path: string) => {
    if (!schema) return;

    if (schema.type === 'string' && (schema.format === 'date-time' || schema.format === 'date')) {
      dateFields++;
      isoFormat++;
    }

    if (schema.properties) {
      for (const prop of Object.keys(schema.properties)) {
        checkSchema(schema.properties[prop], `${path}.${prop}`);
      }
    }

    if (schema.items) {
      checkSchema(schema.items, `${path}[]`);
    }

    if (schema.allOf) {
      schema.allOf.forEach((s: any, i: number) => checkSchema(s, `${path}[allOf:${i}]`));
    }
  };

  if (doc.components?.schemas) {
    for (const name of Object.keys(doc.components.schemas)) {
      checkSchema(doc.components.schemas[name], name);
    }
  }

  for (const path of paths) {
    const pathItem = doc.paths?.[path];
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    for (const method of methods) {
      const op = pathItem[method];
      if (!op) continue;

      if (op.responses) {
        for (const code of Object.keys(op.responses)) {
          const response = op.responses[code];
          if (response.content?.['application/json']?.schema) {
            checkSchema(response.content['application/json'].schema, `${path}.${method}.response.${code}`);
          }
        }
      }

      if (op.requestBody?.content?.['application/json']?.schema) {
        checkSchema(op.requestBody.content['application/json'].schema, `${path}.${method}.request`);
      }
    }
  }

  const pass = dateFields === 0 || isoFormat > 0;
  const percentage = dateFields > 0 ? Math.round((isoFormat / dateFields) * 100) : 0;

  let remarks = '';
  if (dateFields === 0) {
    remarks = '未发现日期时间字段';
  } else {
    remarks = `共 ${dateFields} 个日期时间字段，${isoFormat} 个使用 ISO 8601 格式 (${percentage}%)`;
  }

  return { pass, remarks };
};

const checkEnumValues = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const paths = Object.keys(doc.paths || {});
  if (paths.length === 0) return { pass: false, remarks: '未找到任何 API 路径' };

  let enumFields = 0;
  let properlyNamed = 0;

  const checkEnum = (schema: any, name: string) => {
    if (!schema) return;

    if (schema.enum && Array.isArray(schema.enum)) {
      enumFields++;
      const allUpperUnderscore = schema.enum.every(
        (v: any) => typeof v === 'string' && /^[A-Z_]+$/.test(v)
      );
      if (allUpperUnderscore || schema.type === 'string') {
        properlyNamed++;
      }
    }

    if (schema.properties) {
      for (const prop of Object.keys(schema.properties)) {
        checkEnum(schema.properties[prop], prop);
      }
    }

    if (schema.items) {
      checkEnum(schema.items, `${name}[]`);
    }
  };

  if (doc.components?.schemas) {
    for (const name of Object.keys(doc.components.schemas)) {
      checkEnum(doc.components.schemas[name], name);
    }
  }

  const pass = enumFields === 0 || properlyNamed >= enumFields * 0.7;
  const percentage = enumFields > 0 ? Math.round((properlyNamed / enumFields) * 100) : 0;

  let remarks = '';
  if (enumFields === 0) {
    remarks = '未发现枚举字段';
  } else {
    remarks = `共 ${enumFields} 个枚举字段，${properlyNamed} 个命名规范 (${percentage}%)`;
  }

  return { pass, remarks };
};

const checkPerformance = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const paths = Object.keys(doc.paths || {});
  if (paths.length === 0) return { pass: false, remarks: '未找到任何 API 路径' };

  let listEndpoints = 0;
  let withLimit = 0;

  for (const path of paths) {
    const pathItem = doc.paths?.[path];
    if (!pathItem?.get) continue;

    const lastSegment = path.split('/').filter(Boolean).pop() || '';
    const isListLike =
      !path.includes('{') ||
      lastSegment.endsWith('s') ||
      lastSegment.includes('list') ||
      lastSegment.includes('search');

    if (isListLike) {
      listEndpoints++;
      const params = pathItem.get.parameters || [];
      const hasLimit = params.some(
        (p) =>
          p.name.toLowerCase().includes('limit') ||
          p.name.toLowerCase().includes('size') ||
          p.name.toLowerCase().includes('page')
      );
      if (hasLimit) withLimit++;
    }
  }

  const pass = listEndpoints === 0 || withLimit >= listEndpoints * 0.5;
  const percentage = listEndpoints > 0 ? Math.round((withLimit / listEndpoints) * 100) : 0;

  let remarks = '';
  if (listEndpoints === 0) {
    remarks = '无列表类接口';
  } else {
    remarks = `共 ${listEndpoints} 个列表接口，${withLimit} 个支持分页限制 (${percentage}%)，有利于性能控制`;
  }

  return { pass, remarks };
};

const checkSecurity = (doc: OpenAPIDocument): { pass: boolean; remarks: string } => {
  const hasHttps =
    doc.servers?.some((s: any) => s.url?.startsWith('https')) || false;
  const hasSecuritySchemes =
    doc.components?.securitySchemes || doc.securitySchemes;
  const hasAuth = hasSecuritySchemes !== undefined;

  const paths = Object.keys(doc.paths || {});
  let sensitiveEndpoints = 0;
  let securedSensitive = 0;

  for (const path of paths) {
    const pathItem = doc.paths?.[path];
    if (!pathItem) continue;

    const hasSensitiveOp = pathItem.post || pathItem.put || pathItem.patch || pathItem.delete;
    if (hasSensitiveOp) {
      sensitiveEndpoints++;
      const hasSecurity =
        Object.values(pathItem).some(
          (op: any) => op && op.security && op.security.length > 0
        ) || (doc.security && doc.security.length > 0);
      if (hasSecurity) securedSensitive++;
    }
  }

  const sensitiveRate =
    sensitiveEndpoints > 0 ? securedSensitive / sensitiveEndpoints : 1;
  const pass = hasHttps || (hasAuth && sensitiveRate >= 0.5);

  let remarks = '';
  const issues: string[] = [];
  if (!hasHttps) issues.push('未使用 HTTPS');
  if (!hasAuth) issues.push('未定义认证机制');
  if (sensitiveEndpoints > 0 && sensitiveRate < 0.5)
    issues.push('敏感操作认证覆盖率不足');

  if (issues.length === 0) {
    remarks = '安全性良好：HTTPS + 认证机制 + 敏感操作保护';
  } else {
    remarks = `安全问题：${issues.join('；')}`;
  }

  return { pass, remarks };
};

export const autoReviewOpenAPI = (content: string): ReviewResult | null => {
  const doc = parseOpenAPI(content);
  if (!doc) return null;

  const apiName = doc.info?.title || '未命名 API';

  const checkers: Record<string, (doc: OpenAPIDocument) => { pass: boolean; remarks: string }> = {
    'URL 命名规范': checkUrlNaming,
    'HTTP 方法正确使用': checkHttpMethods,
    'HTTP 状态码规范': checkStatusCodes,
    '请求/响应格式': checkRequestResponseFormat,
    'API 版本控制': checkVersioning,
    '分页设计规范': checkPagination,
    '错误处理规范': checkErrorHandling,
    '认证与授权': checkAuth,
    'API 文档规范': checkDocumentation,
    '参数校验': checkParameterValidation,
    '幂等性设计': checkIdempotency,
    '日期时间格式': checkDateTimeFormat,
    '枚举值规范': checkEnumValues,
    '接口性能': checkPerformance,
    '安全性规范': checkSecurity
  };

  const specifications: SpecificationItem[] = presetSpecifications.map((spec) => {
    const checker = checkers[spec.name];
    if (checker) {
      const result = checker(doc);
      return {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: spec.name,
        description: spec.description,
        status: result.pass ? 'pass' : 'fail',
        remarks: result.remarks
      };
    }
    return {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: spec.name,
      description: spec.description,
      status: 'pending',
      remarks: '无法自动检测'
    };
  });

  return {
    apiName,
    specifications
  };
};
