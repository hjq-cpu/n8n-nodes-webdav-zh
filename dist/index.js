"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodes = exports.credentials = void 0;
const WebDavApi_credentials_1 = require("./credentials/WebDavApi.credentials");
const WebDav_node_1 = require("./nodes/WebDav/WebDav.node");
const path_1 = require("path");
// 导出凭证类型
exports.credentials = {
    webDavApi: {
        className: WebDavApi_credentials_1.WebDavApi,
        sourcePath: (0, path_1.join)(__dirname, 'credentials/WebDavApi.credentials.js'),
    },
};
// 导出节点类型
exports.nodes = {
    webDav: {
        className: WebDav_node_1.WebDav,
        sourcePath: (0, path_1.join)(__dirname, 'nodes/WebDav/WebDav.node.js'),
    },
};