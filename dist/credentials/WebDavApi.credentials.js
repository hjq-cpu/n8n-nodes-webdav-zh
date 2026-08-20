"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebDavApi = void 0;
class WebDavApi {
    constructor() {
        this.name = 'webDavApi';
        this.displayName = 'WebDAV API';
        this.documentationUrl = '';
        this.properties = [
            {
                displayName: 'WebDAV 服务器地址',
                name: 'webdavUrl',
                type: 'string',
                default: '',
                placeholder: 'https://webdav.example.com/remote.php/webdav/',
                required: true,
                description: '您的 WebDAV 服务器 URL 地址',
            },
            {
                displayName: '认证方式',
                name: 'authType',
                type: 'options',
                options: [
                    {
                        name: 'Basic 认证',
                        value: 'basic',
                    },
                    {
                        name: 'Token 令牌认证',
                        value: 'token',
                    },
                ],
                default: 'basic',
                description: '连接 WebDAV 服务器使用的认证方法',
            },
            {
                displayName: '用户名',
                name: 'username',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        authType: [
                            'basic',
                        ],
                    },
                },
                description: 'Basic 认证的用户名',
            },
            {
                displayName: '密码',
                name: 'password',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        authType: [
                            'basic',
                        ],
                    },
                },
                description: 'Basic 认证的密码',
            },
            {
                displayName: '访问令牌',
                name: 'token',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        authType: [
                            'token',
                        ],
                    },
                },
                description: '用于认证的访问令牌',
            },
            {
                displayName: '忽略 SSL 证书错误',
                name: 'allowUnauthorizedCerts',
                type: 'boolean',
                default: false,
                description: '忽略 SSL 错误，例如自签名或无效证书',
            },
        ];
    }
}
exports.WebDavApi = WebDavApi;