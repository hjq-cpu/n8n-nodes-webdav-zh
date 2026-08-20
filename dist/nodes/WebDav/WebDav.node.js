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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebDav = exports.DataSource = exports.FolderOperation = exports.FileOperation = exports.ResourceType = exports.WebDavServerType = void 0;
const n8n_workflow_1 = require("n8n-workflow");
// 导入自定义 WebDAV 客户端实现
const webdav_client_1 = require("../../webdav-client");
const https = __importStar(require("https"));
const path = __importStar(require("path"));
// WebDAV 服务器类型
var WebDavServerType;
(function (WebDavServerType) {
    WebDavServerType["STANDARD"] = "standard";
    WebDavServerType["YANDEX_DISK"] = "yandexDisk";
    WebDavServerType["NEXTCLOUD"] = "nextcloud";
    WebDavServerType["OWNCLOUD"] = "owncloud";
    WebDavServerType["SHAREPOINT"] = "sharepoint";
})(WebDavServerType || (exports.WebDavServerType = WebDavServerType = {}));
// 资源类型
var ResourceType;
(function (ResourceType) {
    ResourceType["FILE"] = "file";
    ResourceType["FOLDER"] = "folder";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
// 文件操作
var FileOperation;
(function (FileOperation) {
    FileOperation["DOWNLOAD"] = "download";
    FileOperation["UPLOAD"] = "upload";
    FileOperation["DELETE"] = "delete";
    FileOperation["GET_INFO"] = "getInfo";
    FileOperation["COPY"] = "copy";
    FileOperation["MOVE"] = "move";
})(FileOperation || (exports.FileOperation = FileOperation = {}));
// 文件夹操作
var FolderOperation;
(function (FolderOperation) {
    FolderOperation["LIST"] = "list";
    FolderOperation["CREATE"] = "create";
    FolderOperation["DELETE"] = "delete";
    FolderOperation["SEARCH"] = "search";
})(FolderOperation || (exports.FolderOperation = FolderOperation = {}));
// 数据来源
var DataSource;
(function (DataSource) {
    DataSource["BINARY"] = "binary";
    DataSource["TEXT"] = "text";
})(DataSource || (exports.DataSource = DataSource = {}));
/**
 * WebDAV 节点 — 用于与 WebDAV 服务器集成
 */
class WebDav {
    constructor() {
        this.description = {
            displayName: 'WebDAV',
            name: 'webDav',
            icon: 'file:webdav.svg',
            group: ['input', 'output'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: '通过 WebDAV 协议操作文件',
            defaults: {
                name: 'WebDAV',
            },
            inputs: ["main" /* NodeConnectionType.Main */],
            outputs: ["main" /* NodeConnectionType.Main */],
            credentials: [
                {
                    name: 'webDavApi',
                    required: true,
                },
            ],
            properties: [
                // 资源类型（文件或文件夹）
                {
                    displayName: '资源类型',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: '文件',
                            value: ResourceType.FILE,
                        },
                        {
                            name: '文件夹',
                            value: ResourceType.FOLDER,
                        },
                    ],
                    default: ResourceType.FILE,
                    description: '要操作的资源类型',
                },
                // 文件操作
                {
                    displayName: '操作',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FILE,
                            ],
                        },
                    },
                    options: [
                        {
                            name: '下载',
                            value: FileOperation.DOWNLOAD,
                            description: '从 WebDAV 服务器下载文件',
                            action: '下载文件',
                        },
                        {
                            name: '上传',
                            value: FileOperation.UPLOAD,
                            description: '上传文件到 WebDAV 服务器',
                            action: '上传文件',
                        },
                        {
                            name: '删除',
                            value: FileOperation.DELETE,
                            description: '从 WebDAV 服务器删除文件',
                            action: '删除文件',
                        },
                        {
                            name: '获取信息',
                            value: FileOperation.GET_INFO,
                            description: '获取文件信息',
                            action: '获取文件信息',
                        },
                        {
                            name: '复制',
                            value: FileOperation.COPY,
                            description: '在 WebDAV 服务器上复制文件',
                            action: '复制文件',
                        },
                        {
                            name: '移动',
                            value: FileOperation.MOVE,
                            description: '移动或重命名文件',
                            action: '移动文件',
                        },
                    ],
                    default: FileOperation.DOWNLOAD,
                },
                // 文件夹操作
                {
                    displayName: '操作',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FOLDER,
                            ],
                        },
                    },
                    options: [
                        {
                            name: '列出内容',
                            value: FolderOperation.LIST,
                            description: '获取文件夹的内容列表',
                            action: '列出文件夹内容',
                        },
                        {
                            name: '搜索',
                            value: FolderOperation.SEARCH,
                            description: '按关键词搜索文件或文件夹',
                            action: '搜索文件或文件夹',
                        },
                        {
                            name: '创建',
                            value: FolderOperation.CREATE,
                            description: '创建新文件夹',
                            action: '创建新文件夹',
                        },
                        {
                            name: '删除',
                            value: FolderOperation.DELETE,
                            description: '删除文件夹',
                            action: '删除文件夹',
                        },
                    ],
                    default: FolderOperation.LIST,
                },
                // 文件或文件夹路径
                {
                    displayName: '路径',
                    name: 'path',
                    type: 'string',
                    default: '',
                    required: true,
                    placeholder: '/path/to/file.txt',
                    description: 'WebDAV 服务器上的文件或文件夹路径',
                },
                // 上传文件的数据来源
                {
                    displayName: '数据来源',
                    name: 'dataSource',
                    type: 'options',
                    options: [
                        {
                            name: '二进制数据',
                            value: DataSource.BINARY,
                        },
                        {
                            name: '文本',
                            value: DataSource.TEXT,
                        },
                    ],
                    default: DataSource.BINARY,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FILE,
                            ],
                            operation: [
                                FileOperation.UPLOAD,
                            ],
                        },
                    },
                    description: '上传文件的数据来源',
                },
                // 下载时的二进制属性名
                {
                    displayName: '二进制属性名称',
                    name: 'binaryPropertyName',
                    type: 'string',
                    default: 'data',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FILE,
                            ],
                            operation: [
                                FileOperation.DOWNLOAD,
                            ],
                        },
                    },
                    description: '用于保存下载数据的二进制属性名称',
                },
                // 上传时的二进制属性名
                {
                    displayName: '二进制属性名称',
                    name: 'binaryPropertyName',
                    type: 'string',
                    default: 'data',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FILE,
                            ],
                            operation: [
                                FileOperation.UPLOAD,
                            ],
                            dataSource: [
                                DataSource.BINARY,
                            ],
                        },
                    },
                    description: '用于读取上传数据的二进制属性名称',
                },
                // 文本文件内容
                {
                    displayName: '文件内容',
                    name: 'fileContent',
                    type: 'string',
                    typeOptions: {
                        alwaysOpenEditWindow: true,
                    },
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FILE,
                            ],
                            operation: [
                                FileOperation.UPLOAD,
                            ],
                            dataSource: [
                                DataSource.TEXT,
                            ],
                        },
                    },
                    description: '要上传的文本文件内容',
                },
                // 复制/移动的目标路径
                {
                    displayName: '目标路径',
                    name: 'targetPath',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FILE,
                            ],
                            operation: [
                                FileOperation.COPY,
                                FileOperation.MOVE,
                            ],
                        },
                    },
                    description: '复制或移动的目标路径',
                },
                // 递归列出
                {
                    displayName: '递归列出',
                    name: 'recursive',
                    type: 'boolean',
                    default: false,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FOLDER,
                            ],
                            operation: [
                                FolderOperation.LIST,
                            ],
                        },
                    },
                    description: '递归获取所有子文件夹的内容',
                },
                // 详细信息
                {
                    displayName: '显示详细信息',
                    name: 'details',
                    type: 'boolean',
                    default: true,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FOLDER,
                            ],
                            operation: [
                                FolderOperation.LIST,
                            ],
                        },
                    },
                    description: '包含文件/文件夹的详细信息（大小、修改时间等）',
                },
                // 搜索关键词
                {
                    displayName: '搜索关键词',
                    name: 'searchKeyword',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FOLDER,
                            ],
                            operation: [
                                FolderOperation.SEARCH,
                            ],
                        },
                    },
                    description: '搜索文件或文件夹名称的关键词',
                },
                // 搜索匹配方式
                {
                    displayName: '匹配方式',
                    name: 'searchMatchType',
                    type: 'options',
                    options: [
                        {
                            name: '包含',
                            value: 'contains',
                        },
                        {
                            name: '开头是',
                            value: 'startsWith',
                        },
                        {
                            name: '结尾是',
                            value: 'endsWith',
                        },
                        {
                            name: '精确匹配',
                            value: 'exact',
                        },
                        {
                            name: '正则表达式',
                            value: 'regex',
                        },
                    ],
                    default: 'contains',
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FOLDER,
                            ],
                            operation: [
                                FolderOperation.SEARCH,
                            ],
                        },
                    },
                    description: '搜索关键词的匹配方式',
                },
                // 搜索区分大小写
                {
                    displayName: '区分大小写',
                    name: 'searchCaseSensitive',
                    type: 'boolean',
                    default: false,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FOLDER,
                            ],
                            operation: [
                                FolderOperation.SEARCH,
                            ],
                        },
                    },
                    description: '搜索时是否区分大小写',
                },
                // 搜索过滤类型
                {
                    displayName: '过滤类型',
                    name: 'searchFilterType',
                    type: 'options',
                    options: [
                        {
                            name: '全部',
                            value: 'all',
                        },
                        {
                            name: '仅文件',
                            value: 'file',
                        },
                        {
                            name: '仅文件夹',
                            value: 'directory',
                        },
                    ],
                    default: 'all',
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FOLDER,
                            ],
                            operation: [
                                FolderOperation.SEARCH,
                            ],
                        },
                    },
                    description: '按类型过滤搜索结果',
                },
                // 覆盖选项
                {
                    displayName: '覆盖已存在的文件',
                    name: 'overwrite',
                    type: 'boolean',
                    default: false,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FILE,
                            ],
                            operation: [
                                FileOperation.UPLOAD,
                                FileOperation.COPY,
                                FileOperation.MOVE,
                            ],
                        },
                    },
                    description: '如果目标文件已存在，是否覆盖',
                },
                // 自动创建父文件夹
                {
                    displayName: '自动创建父文件夹',
                    name: 'createParentFolders',
                    type: 'boolean',
                    default: true,
                    displayOptions: {
                        show: {
                            resource: [
                                ResourceType.FILE,
                                ResourceType.FOLDER,
                            ],
                            operation: [
                                FileOperation.UPLOAD,
                                FileOperation.COPY,
                                FileOperation.MOVE,
                                FolderOperation.CREATE,
                            ],
                        },
                    },
                    description: '如果父文件夹不存在，自动创建',
                },
                // WebDAV 服务器类型
                {
                    displayName: 'WebDAV 服务器类型',
                    name: 'serverType',
                    type: 'options',
                    options: [
                        {
                            name: '标准 WebDAV',
                            value: WebDavServerType.STANDARD,
                        },
                        {
                            name: 'Yandex.Disk',
                            value: WebDavServerType.YANDEX_DISK,
                        },
                        {
                            name: 'Nextcloud',
                            value: WebDavServerType.NEXTCLOUD,
                        },
                        {
                            name: 'ownCloud',
                            value: WebDavServerType.OWNCLOUD,
                        },
                        {
                            name: 'Microsoft SharePoint',
                            value: WebDavServerType.SHAREPOINT,
                        },
                    ],
                    default: WebDavServerType.STANDARD,
                    description: 'WebDAV 服务器类型，用于特定配置优化',
                },
            ],
        };
    }
    async execute() {
        const returnData = [];
        const items = this.getInputData();
        let responseData;
        // 获取凭证信息
        const credentials = await this.getCredentials('webDavApi');
        // 检查 URL
        if (!credentials.webdavUrl) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'WebDAV URL 未在凭证中设置');
        }
        // 遍历处理每个数据项
        for (let i = 0; i < items.length; i++) {
            try {
                // 获取操作参数
                const resource = this.getNodeParameter('resource', i);
                const operation = this.getNodeParameter('operation', i);
                const filePath = this.getNodeParameter('path', i);
                const serverType = this.getNodeParameter('serverType', i, WebDavServerType.STANDARD);
                // 创建 WebDAV 客户端
                const options = {
                    maxBodyLength: 1024 * 1024 * 100, // 100 MB
                    maxContentLength: 1024 * 1024 * 100, // 100 MB
                };
                // 添加认证信息
                if (credentials.authType === 'basic') {
                    options.username = credentials.username;
                    options.password = credentials.password;
                }
                else if (credentials.authType === 'token') {
                    options.headers = {
                        Authorization: `Bearer ${credentials.token}`,
                    };
                }
                // 配置 SSL 忽略选项
                if (credentials.allowUnauthorizedCerts === true) {
                    options.httpsAgent = new https.Agent({
                        rejectUnauthorized: false,
                    });
                }
                // 不同服务器的特定配置
                if (serverType === WebDavServerType.YANDEX_DISK) {
                    if (!options.headers)
                        options.headers = {};
                    options.headers['X-Yandex-SDK-Version'] = 'n8n-webdav-node';
                }
                // 规范化 URL
                let webdavUrl = credentials.webdavUrl;
                if (!webdavUrl.endsWith('/')) {
                    webdavUrl = `${webdavUrl}/`;
                }
                // Yandex.Disk 特定 URL
                if (serverType === WebDavServerType.YANDEX_DISK && !webdavUrl.includes('webdav.yandex.ru')) {
                    webdavUrl = 'https://webdav.yandex.ru/';
                }
                // 创建 WebDAV 客户端 — 使用自定义实现
                const client = (0, webdav_client_1.createClient)(webdavUrl, options);
                // 辅助函数：自动创建父文件夹
                const createParentDirectories = async (dirPath) => {
                    // 分割路径
                    const parts = dirPath.split('/').filter(part => part.length > 0);
                    let currentPath = '';
                    // 依次创建路径中的每个文件夹
                    for (const part of parts) {
                        currentPath += '/' + part;
                        // 检查文件夹是否存在
                        const exists = await client.exists(currentPath);
                        if (!exists) {
                            // 如果不存在则创建
                            await client.createDirectory(currentPath);
                        }
                    }
                };
                // 根据资源类型和操作类型处理
                if (resource === ResourceType.FILE) {
                    if (operation === FileOperation.DOWNLOAD) {
                        // 下载文件
                        const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
                        // 检查文件是否存在
                        const exists = await client.exists(filePath);
                        if (!exists) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `文件 ${filePath} 在服务器上不存在`);
                        }
                        // 下载文件内容
                        const fileContent = await client.getFileContents(filePath, { format: 'binary' });
                        // 获取文件信息
                        const fileInfo = await client.stat(filePath);
                        const fileName = path.basename(filePath);
                        // 转换为二进制数据
                        const mimeType = fileInfo.mime || 'application/octet-stream';
                        const binaryData = await this.helpers.prepareBinaryData(fileContent, fileName, mimeType);
                        // 返回结果
                        const newItem = {
                            json: {
                                success: true,
                                file: filePath,
                                name: fileName,
                                size: fileInfo.size,
                                lastModified: fileInfo.lastmod,
                                operation: 'download',
                            },
                            binary: {},
                        };
                        newItem.binary[binaryPropertyName] = binaryData;
                        responseData = newItem;
                    }
                    else if (operation === FileOperation.UPLOAD) {
                        // 上传文件
                        const dataSource = this.getNodeParameter('dataSource', i);
                        const overwrite = this.getNodeParameter('overwrite', i, false);
                        const createParentFolders = this.getNodeParameter('createParentFolders', i, true);
                        let fileContent;
                        let fileName;
                        // 根据数据来源获取文件内容
                        if (dataSource === DataSource.BINARY) {
                            const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
                            const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
                            fileContent = Buffer.from(binaryData.data, 'base64');
                            fileName = binaryData.fileName || path.basename(filePath);
                        }
                        else {
                            fileContent = this.getNodeParameter('fileContent', i);
                            fileName = path.basename(filePath);
                        }
                        // 需要时创建父文件夹
                        if (createParentFolders) {
                            const dirPath = path.dirname(filePath);
                            if (dirPath !== '/' && dirPath !== '.') {
                                await createParentDirectories(dirPath);
                            }
                        }
                        // 检查文件是否已存在
                        if (!overwrite) {
                            const exists = await client.exists(filePath);
                            if (exists) {
                                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `文件 ${filePath} 已存在。请勾选"覆盖已存在的文件"选项以覆盖。`);
                            }
                        }
                        // 上传文件
                        await client.putFileContents(filePath, fileContent, { overwrite });
                        // 获取上传后的文件信息
                        const fileInfo = await client.stat(filePath);
                        responseData = {
                            success: true,
                            file: filePath,
                            name: fileName,
                            size: fileInfo.size,
                            lastModified: fileInfo.lastmod,
                            operation: 'upload',
                        };
                    }
                    else if (operation === FileOperation.DELETE) {
                        // 删除文件
                        const exists = await client.exists(filePath);
                        if (!exists) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `文件 ${filePath} 在服务器上不存在`);
                        }
                        await client.deleteFile(filePath);
                        responseData = {
                            success: true,
                            file: filePath,
                            operation: 'delete',
                        };
                    }
                    else if (operation === FileOperation.GET_INFO) {
                        // 获取文件信息
                        const exists = await client.exists(filePath);
                        if (!exists) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `文件 ${filePath} 在服务器上不存在`);
                        }
                        const fileInfo = await client.stat(filePath);
                        responseData = {
                            success: true,
                            file: filePath,
                            name: path.basename(filePath),
                            type: fileInfo.type,
                            size: fileInfo.size,
                            lastModified: fileInfo.lastmod,
                            mime: fileInfo.mime,
                            operation: 'getInfo',
                        };
                    }
                    else if (operation === FileOperation.COPY) {
                        // 复制文件
                        const targetPath = this.getNodeParameter('targetPath', i);
                        const overwrite = this.getNodeParameter('overwrite', i, false);
                        const createParentFolders = this.getNodeParameter('createParentFolders', i, true);
                        // 检查源文件是否存在
                        const sourceExists = await client.exists(filePath);
                        if (!sourceExists) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `源文件 ${filePath} 在服务器上不存在`);
                        }
                        // 检查目标文件是否存在
                        const targetExists = await client.exists(targetPath);
                        if (targetExists && !overwrite) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `目标文件 ${targetPath} 已存在。请勾选"覆盖已存在的文件"选项以覆盖。`);
                        }
                        // 需要时创建父文件夹
                        if (createParentFolders) {
                            const dirPath = path.dirname(targetPath);
                            if (dirPath !== '/' && dirPath !== '.') {
                                await createParentDirectories(dirPath);
                            }
                        }
                        // 复制文件
                        await client.copyFile(filePath, targetPath, { overwrite });
                        // 获取新文件信息
                        const fileInfo = await client.stat(targetPath);
                        responseData = {
                            success: true,
                            sourceFile: filePath,
                            targetFile: targetPath,
                            name: path.basename(targetPath),
                            size: fileInfo.size,
                            lastModified: fileInfo.lastmod,
                            operation: 'copy',
                        };
                    }
                    else if (operation === FileOperation.MOVE) {
                        // 移动/重命名文件
                        const targetPath = this.getNodeParameter('targetPath', i);
                        const overwrite = this.getNodeParameter('overwrite', i, false);
                        const createParentFolders = this.getNodeParameter('createParentFolders', i, true);
                        // 检查源文件是否存在
                        const sourceExists = await client.exists(filePath);
                        if (!sourceExists) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `源文件 ${filePath} 在服务器上不存在`);
                        }
                        // 检查目标文件是否存在
                        const targetExists = await client.exists(targetPath);
                        if (targetExists && !overwrite) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `目标文件 ${targetPath} 已存在。请勾选"覆盖已存在的文件"选项以覆盖。`);
                        }
                        // 需要时创建父文件夹
                        if (createParentFolders) {
                            const dirPath = path.dirname(targetPath);
                            if (dirPath !== '/' && dirPath !== '.') {
                                await createParentDirectories(dirPath);
                            }
                        }
                        // 移动文件
                        await client.moveFile(filePath, targetPath, { overwrite });
                        // 获取新文件信息
                        let fileInfo;
                        try {
                            fileInfo = await client.stat(targetPath);
                        }
                        catch (error) {
                            // 如果无法获取信息，返回基本信息
                            fileInfo = {
                                size: 0,
                                lastmod: new Date().toISOString(),
                            };
                        }
                        responseData = {
                            success: true,
                            sourceFile: filePath,
                            targetFile: targetPath,
                            name: path.basename(targetPath),
                            size: fileInfo.size,
                            lastModified: fileInfo.lastmod,
                            operation: 'move',
                        };
                    }
                }
                else if (resource === ResourceType.FOLDER) {
                    if (operation === FolderOperation.LIST) {
                        // 列出文件夹内容
                        const recursive = this.getNodeParameter('recursive', i, false);
                        const details = this.getNodeParameter('details', i, true);
                        // 检查文件夹是否存在
                        const exists = await client.exists(filePath);
                        if (!exists) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `文件夹 ${filePath} 在服务器上不存在`);
                        }
                        // 获取文件夹内容
                        const contents = await client.getDirectoryContents(filePath, { deep: recursive });
                        // 构建结果
                        const returnItems = [];
                        for (const item of contents) {
                            // 跳过当前文件夹
                            if (item.filename === filePath)
                                continue;
                            if (details) {
                                // 详细输出
                                returnItems.push({
                                    json: {
                                        path: item.filename,
                                        name: path.basename(item.filename),
                                        type: item.type,
                                        size: item.size,
                                        lastModified: item.lastmod,
                                        mime: item.mime,
                                    },
                                });
                            }
                            else {
                                // 简化输出
                                returnItems.push({
                                    json: {
                                        path: item.filename,
                                        name: path.basename(item.filename),
                                        type: item.type,
                                    },
                                });
                            }
                        }
                        responseData = returnItems;
                    }
                    else if (operation === FolderOperation.SEARCH) {
                        // 搜索文件/文件夹
                        const keyword = this.getNodeParameter('searchKeyword', i);
                        const matchType = this.getNodeParameter('searchMatchType', i, 'contains');
                        const caseSensitive = this.getNodeParameter('searchCaseSensitive', i, false);
                        const filterType = this.getNodeParameter('searchFilterType', i, 'all');
                        // 检查文件夹是否存在
                        const exists = await client.exists(filePath);
                        if (!exists) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `文件夹 ${filePath} 在服务器上不存在`);
                        }
                        // 执行搜索
                        const results = await client.search(filePath, keyword, {
                            matchType: matchType,
                            caseSensitive: caseSensitive,
                            filterType: filterType,
                        });
                        // 构建结果
                        const returnItems = [];
                        for (const item of results) {
                            returnItems.push({
                                json: {
                                    path: item.filename,
                                    name: item.basename,
                                    type: item.type,
                                    size: item.size,
                                    lastModified: item.lastmod,
                                    mime: item.mime,
                                },
                            });
                        }
                        responseData = returnItems;
                    }
                    else if (operation === FolderOperation.CREATE) {
                        // 创建文件夹
                        const createParentFolders = this.getNodeParameter('createParentFolders', i, true);
                        // 检查文件夹是否存在
                        const exists = await client.exists(filePath);
                        if (exists) {
                            // 文件夹已存在，返回信息
                            responseData = {
                                success: true,
                                folder: filePath,
                                name: path.basename(filePath),
                                alreadyExists: true,
                                operation: 'create',
                            };
                        }
                        else {
                            // 需要时创建父文件夹
                            if (createParentFolders) {
                                await createParentDirectories(filePath);
                            }
                            else {
                                // 只创建指定的文件夹
                                await client.createDirectory(filePath);
                            }
                            responseData = {
                                success: true,
                                folder: filePath,
                                name: path.basename(filePath),
                                alreadyExists: false,
                                operation: 'create',
                            };
                        }
                    }
                    else if (operation === FolderOperation.DELETE) {
                        // 删除文件夹
                        const exists = await client.exists(filePath);
                        if (!exists) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `文件夹 ${filePath} 在服务器上不存在`);
                        }
                        await client.deleteFile(filePath);
                        responseData = {
                            success: true,
                            folder: filePath,
                            operation: 'delete',
                        };
                    }
                }
                // 添加结果到返回数据
                if (Array.isArray(responseData)) {
                    returnData.push.apply(returnData, responseData);
                }
                else if (responseData !== undefined) {
                    // 如果 responseData 已经是 INodeExecutionData（包含 binary 数据），直接添加
                    if (responseData.binary !== undefined) {
                        returnData.push(responseData);
                    }
                    else {
                        // 否则包装为 json
                        returnData.push({ json: responseData });
                    }
                }
            }
            catch (error) {
                // 增强的错误处理，包含详细信息
                let errorMessage = error.message || '未知错误';
                let errorDetails = {
                    error: errorMessage
                };
                // 为 WebDAV 错误添加详细信息
                if (error instanceof webdav_client_1.WebDAVError) {
                    errorDetails = {
                        error: errorMessage,
                        statusCode: error.statusCode,
                        statusText: error.statusText,
                        type: 'WebDAVError'
                    };
                }
                if (this.continueOnFail()) {
                    returnData.push({ json: errorDetails });
                    continue;
                }
                // 创建包含详细信息的 NodeOperationError
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), errorMessage, {
                    itemIndex: i,
                    description: error instanceof webdav_client_1.WebDAVError
                        ? `HTTP ${error.statusCode}: ${error.statusText}`
                        : undefined
                });
            }
        }
        return [returnData];
    }
}
exports.WebDav = WebDav;