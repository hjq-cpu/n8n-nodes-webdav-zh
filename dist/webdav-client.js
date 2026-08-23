"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebDAVClient = exports.WebDAVError = void 0;
exports.createClient = createClient;
const axios_1 = __importDefault(require("axios"));
const path = __importStar(require("path"));
const fast_xml_parser_1 = require("fast-xml-parser");
/**
 * WebDAV 错误类，包含详细的错误信息
 */
class WebDAVError extends Error {
    constructor(message, statusCode, statusText, response) {
        super(message);
        this.name = 'WebDAVError';
        this.statusCode = statusCode;
        this.statusText = statusText;
        this.response = response;
    }
}
exports.WebDAVError = WebDAVError;
/**
 * 基于 Axios 的 WebDAV 客户端实现
 */
class WebDAVClient {
    constructor(baseURL, options = {}) {
        this.baseURL = baseURL;
        // 初始化 XML 解析器
        this.xmlParser = new fast_xml_parser_1.XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
            parseAttributeValue: true,
            trimValues: true,
        });
        const axiosConfig = {
            baseURL,
            maxBodyLength: options.maxBodyLength || 524288000, // 500MB（为大文件增加）
            maxContentLength: options.maxContentLength || 524288000, // 500MB
            httpsAgent: options.httpsAgent,
            headers: {
                'Content-Type': 'application/octet-stream',
                ...options.headers
            }
        };
        // 添加认证信息
        if (options.username && options.password) {
            axiosConfig.auth = {
                username: options.username,
                password: options.password
            };
        }
        else if (options.token) {
            axiosConfig.headers = {
                ...axiosConfig.headers,
                'Authorization': `Bearer ${options.token}`
            };
        }
        this.axios = axios_1.default.create(axiosConfig);
    }
    /**
     * 处理 Axios 错误，返回详细信息
     */
    handleError(error, context) {
        var _a, _b, _c;
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            const statusCode = (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status;
            const statusText = (_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.statusText;
            let message = `${context}: `;
            switch (statusCode) {
                case 401:
                    message += '认证失败，请检查您的账户凭证。';
                    break;
                case 403:
                    message += '访问被拒绝，权限不足。';
                    break;
                case 404:
                    message += '资源未找到。';
                    break;
                case 405:
                    message += '服务器不支持该操作方法。';
                    break;
                case 409:
                    message += '冲突：资源已存在或被锁定。';
                    break;
                case 412:
                    message += '前置条件未满足。';
                    break;
                case 423:
                    message += '资源已被锁定。';
                    break;
                case 507:
                    message += '服务器存储空间不足。';
                    break;
                default:
                    message += axiosError.message;
            }
            throw new WebDAVError(message, statusCode, statusText, (_c = axiosError.response) === null || _c === void 0 ? void 0 : _c.data);
        }
        throw new WebDAVError(`${context}: ${error.message}`);
    }
    /**
     * 解析 WebDAV XML 响应
     */
    parseWebDAVResponse(xmlData) {
        try {
            const parsed = this.xmlParser.parse(xmlData);
            // WebDAV 响应结构: multistatus -> response[]
            const multistatus = parsed['d:multistatus'] || parsed['D:multistatus'] || parsed.multistatus;
            if (!multistatus) {
                throw new Error('无效的 WebDAV 响应格式');
            }
            let responses = multistatus['d:response'] || multistatus['D:response'] || multistatus.response;
            // 转为数组
            if (!Array.isArray(responses)) {
                responses = [responses];
            }
            return responses.map((resp) => this.normalizeWebDAVResponse(resp));
        }
        catch (error) {
            throw new WebDAVError(`XML 解析错误: ${error.message}`);
        }
    }
    /**
     * 规范化 WebDAV 响应，兼容不同的命名空间前缀
     */
    normalizeWebDAVResponse(response) {
        const getField = (obj, ...keys) => {
            for (const key of keys) {
                if (obj[key] !== undefined)
                    return obj[key];
            }
            return undefined;
        };
        const href = getField(response, 'd:href', 'D:href', 'href');
        const propstat = getField(response, 'd:propstat', 'D:propstat', 'propstat');
        // 处理 propstat（可能为数组）
        const propstatArray = Array.isArray(propstat) ? propstat : [propstat];
        const successPropstat = propstatArray.find((ps) => {
            const status = getField(ps, 'd:status', 'D:status', 'status');
            return status && status.includes('200');
        }) || propstatArray[0];
        const prop = getField(successPropstat, 'd:prop', 'D:prop', 'prop') || {};
        return {
            href: decodeURIComponent(href || ''),
            propstat: {
                prop: {
                    getcontentlength: getField(prop, 'd:getcontentlength', 'D:getcontentlength', 'getcontentlength'),
                    getlastmodified: getField(prop, 'd:getlastmodified', 'D:getlastmodified', 'getlastmodified'),
                    getcontenttype: getField(prop, 'd:getcontenttype', 'D:getcontenttype', 'getcontenttype'),
                    getetag: getField(prop, 'd:getetag', 'D:getetag', 'getetag'),
                    resourcetype: getField(prop, 'd:resourcetype', 'D:resourcetype', 'resourcetype'),
                    displayname: getField(prop, 'd:displayname', 'D:displayname', 'displayname'),
                },
                status: getField(successPropstat, 'd:status', 'D:status', 'status') || 'HTTP/1.1 200 OK',
            },
        };
    }
    /**
     * 将 WebDAV 响应转换为 FileInfo
     */
    webdavResponseToFileInfo(response) {
        const prop = Array.isArray(response.propstat)
            ? response.propstat[0].prop
            : response.propstat.prop;
        const isDirectory = prop.resourcetype &&
            (prop.resourcetype.collection !== undefined ||
                prop.resourcetype['d:collection'] !== undefined ||
                prop.resourcetype['D:collection'] !== undefined);
        return {
            filename: response.href,
            basename: path.basename(response.href) || prop.displayname || '',
            type: isDirectory ? 'directory' : 'file',
            size: parseInt(prop.getcontentlength || '0', 10),
            lastmod: prop.getlastmodified || new Date().toISOString(),
            mime: prop.getcontenttype,
            etag: prop.getetag,
        };
    }
    /**
     * 检查文件或文件夹是否存在
     */
    async exists(filePath) {
        try {
            // 使用 PROPFIND 替代 HEAD 来检查资源是否存在
            // 某些 WebDAV 服务器对 HEAD 请求返回 200 即使资源不存在
            await this.stat(filePath);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 获取文件内容
     */
    async getFileContents(filePath, options = {}) {
        try {
            const response = await this.axios.get(encodePath(filePath), {
                responseType: options.format === 'binary' ? 'arraybuffer' : 'text'
            });
            if (options.format === 'binary') {
                return Buffer.from(response.data);
            }
            return response.data;
        }
        catch (error) {
            this.handleError(error, '无法获取文件内容');
        }
    }
    /**
     * 以流的形式获取文件内容（适用于大文件）
     */
    async getFileStream(filePath) {
        try {
            const response = await this.axios.get(encodePath(filePath), {
                responseType: 'stream'
            });
            return response.data;
        }
        catch (error) {
            this.handleError(error, '无法获取文件流');
        }
    }
    /**
     * 上传文件内容
     */
    async putFileContents(filePath, data, options = {}) {
        try {
            // 如果文件存在且不允许覆盖，则报错
            if (!options.overwrite) {
                const exists = await this.exists(filePath);
                if (exists) {
                    throw new WebDAVError(`文件 ${filePath} 已存在`, 409, 'Conflict');
                }
            }
            await this.axios.put(encodePath(filePath), data, {
                headers: {
                    'Content-Type': 'application/octet-stream'
                }
            });
        }
        catch (error) {
            if (error instanceof WebDAVError) {
                throw error;
            }
            this.handleError(error, '无法上传文件内容');
        }
    }
    /**
     * 以流的形式上传文件（适用于大文件）
     */
    async putFileStream(filePath, stream, options = {}) {
        try {
            // 如果文件存在且不允许覆盖，则报错
            if (!options.overwrite) {
                const exists = await this.exists(filePath);
                if (exists) {
                    throw new WebDAVError(`文件 ${filePath} 已存在`, 409, 'Conflict');
                }
            }
            await this.axios.put(encodePath(filePath), stream, {
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            });
        }
        catch (error) {
            if (error instanceof WebDAVError) {
                throw error;
            }
            this.handleError(error, '无法上传文件流');
        }
    }
    /**
     * 创建目录
     */
    async createDirectory(dirPath) {
        try {
            await this.axios.request({
                method: 'MKCOL',
                url: encodePath(dirPath)
            });
        }
        catch (error) {
            this.handleError(error, '无法创建目录');
        }
    }
    /**
     * 删除文件或文件夹
     */
    async deleteFile(filePath) {
        try {
            await this.axios.delete(encodePath(filePath));
        }
        catch (error) {
            this.handleError(error, '无法删除文件或文件夹');
        }
    }
    /**
     * 移动或重命名文件
     */
    async moveFile(source, destination, options = {}) {
        try {
            const headers = {
                'Destination': this.createAbsoluteUrl(destination)
            };
            // 添加 Overwrite 头
            if (options.overwrite !== undefined) {
                headers['Overwrite'] = options.overwrite ? 'T' : 'F';
            }
            await this.axios.request({
                method: 'MOVE',
                url: encodePath(source),
                headers
            });
        }
        catch (error) {
            this.handleError(error, '无法移动文件');
        }
    }
    /**
     * 复制文件
     */
    async copyFile(source, destination, options = {}) {
        try {
            const headers = {
                'Destination': this.createAbsoluteUrl(destination)
            };
            // 添加 Overwrite 头
            if (options.overwrite !== undefined) {
                headers['Overwrite'] = options.overwrite ? 'T' : 'F';
            }
            await this.axios.request({
                method: 'COPY',
                url: encodePath(source),
                headers
            });
        }
        catch (error) {
            this.handleError(error, '无法复制文件');
        }
    }
    /**
     * 获取文件或文件夹信息
     */
    async stat(filePath) {
        try {
            const response = await this.axios.request({
                method: 'PROPFIND',
                url: encodePath(filePath),
                headers: {
                    'Depth': '0',
                    'Content-Type': 'application/xml; charset=utf-8'
                },
                data: `<?xml version="1.0" encoding="utf-8" ?>
                      <d:propfind xmlns:d="DAV:">
                          <d:prop>
                              <d:resourcetype/>
                              <d:getcontentlength/>
                              <d:getlastmodified/>
                              <d:getcontenttype/>
                              <d:getetag/>
                              <d:displayname/>
                          </d:prop>
                      </d:propfind>`,
                responseType: 'text'
            });
            // 解析 XML 响应
            const webdavResponses = this.parseWebDAVResponse(response.data);
            if (webdavResponses.length === 0) {
                throw new WebDAVError('无法获取资源信息', 404, 'Not Found');
            }
            // 返回第一个（也是唯一一个）资源的信息
            return this.webdavResponseToFileInfo(webdavResponses[0]);
        }
        catch (error) {
            if (error instanceof WebDAVError) {
                throw error;
            }
            this.handleError(error, '无法获取文件信息');
        }
    }
    /**
     * 获取目录内容
     */
    async getDirectoryContents(dirPath, options = {}) {
        try {
            // 规范化路径 - 确保以 / 结尾
            let normalizedPath = dirPath;
            if (!normalizedPath.endsWith('/')) {
                normalizedPath += '/';
            }
            const response = await this.axios.request({
                method: 'PROPFIND',
                url: encodePath(normalizedPath),
                headers: {
                    'Depth': options.deep ? 'infinity' : '1',
                    'Content-Type': 'application/xml; charset=utf-8'
                },
                data: `<?xml version="1.0" encoding="utf-8" ?>
                      <d:propfind xmlns:d="DAV:">
                          <d:prop>
                              <d:resourcetype/>
                              <d:getcontentlength/>
                              <d:getlastmodified/>
                              <d:getcontenttype/>
                              <d:getetag/>
                              <d:displayname/>
                          </d:prop>
                      </d:propfind>`,
                responseType: 'text'
            });
            // 解析 XML 响应
            const webdavResponses = this.parseWebDAVResponse(response.data);
            // 转换为 FileInfo 并过滤掉目录本身
            const files = [];
            for (const webdavResponse of webdavResponses) {
                // 跳过目录本身
                const href = webdavResponse.href;
                // 多种方式判断是否为同一目录
                if (href === normalizedPath ||
                    href === dirPath ||
                    href === normalizedPath.slice(0, -1) ||
                    href + '/' === normalizedPath) {
                    continue;
                }
                const fileInfo = this.webdavResponseToFileInfo(webdavResponse);
                files.push(fileInfo);
            }
            return files;
        }
        catch (error) {
            if (error instanceof WebDAVError) {
                throw error;
            }
            this.handleError(error, '无法获取目录内容');
        }
    }
    /**
     * 搜索文件/文件夹（递归列出 + 客户端过滤）
     */
    async search(dirPath, keyword, options = {}) {
        try {
            if (!keyword || keyword.trim() === '') {
                throw new WebDAVError('搜索关键词不能为空', 400, 'Bad Request');
            }
            // 递归获取目录所有内容
            const allContents = await this.getDirectoryContents(dirPath, { deep: true });
            // 根据关键词和选项过滤
            const matchType = options.matchType || 'contains';
            const caseSensitive = options.caseSensitive || false;
            const filterType = options.filterType || 'all';
            const results = allContents.filter(item => {
                const basename = item.basename;
                let kw = keyword;
                let name = basename;
                if (!caseSensitive) {
                    kw = keyword.toLowerCase();
                    name = basename.toLowerCase();
                }
                // 按匹配方式过滤
                let matched = false;
                switch (matchType) {
                    case 'contains':
                        matched = name.includes(kw);
                        break;
                    case 'startsWith':
                        matched = name.startsWith(kw);
                        break;
                    case 'endsWith':
                        matched = name.endsWith(kw);
                        break;
                    case 'exact':
                        matched = (name === kw);
                        break;
                    case 'regex':
                        try {
                            const re = new RegExp(keyword, caseSensitive ? '' : 'i');
                            matched = re.test(basename);
                        }
                        catch (e) {
                            matched = false;
                        }
                        break;
                }
                if (!matched)
                    return false;
                // 按类型过滤
                if (filterType === 'file' && item.type !== 'file')
                    return false;
                if (filterType === 'directory' && item.type !== 'directory')
                    return false;
                return true;
            });
            return results;
        }
        catch (error) {
            if (error instanceof WebDAVError) {
                throw error;
            }
            this.handleError(error, '搜索文件失败');
        }
    }
    /**
     * 辅助方法：创建绝对 URL
     */
    createAbsoluteUrl(path) {
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        try {
            return new URL(path, this.baseURL).toString();
        }
        catch (error) {
            // 如果无法创建 URL，则直接拼接路径（同时编码非 ASCII 字符）
            return this.baseURL.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
            const encoded = encodePath(path);
        }
    }
}
exports.WebDAVClient = WebDAVClient;
/**
 * 对路径中的非 ASCII 字符进行 URL 编码
 * 只编码每个路径段，保留 / 分隔符
 * 解决中文文件夹名在 Linux 服务器上创建失败的问题
 */
function encodePath(pathStr) {
    if (!pathStr) return pathStr;
    return pathStr
        .split('/')
        .map(segment => encodeURIComponent(segment))
        .join('/');
}

/**
 * 创建 WebDAV 客户端的工厂函数
 */
function createClient(baseURL, options = {}) {
    return new WebDAVClient(baseURL, options);
}