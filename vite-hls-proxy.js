var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { Buffer } from 'node:buffer';
var ALLOWED_HOSTS = new Set(['pull.niues.live', 'pull.niur.live', 'pull.scstream.net']);
var STREAM_REFERER = 'https://livefootball.org/';
function isAllowedUrl(rawUrl) {
    try {
        var parsed = new URL(rawUrl);
        return parsed.protocol === 'https:' && ALLOWED_HOSTS.has(parsed.hostname);
    }
    catch (_a) {
        return false;
    }
}
function getPublicOrigin(req) {
    var hostHeader = (typeof req.headers['x-forwarded-host'] === 'string' ? req.headers['x-forwarded-host'] : '') ||
        req.headers.host ||
        'localhost:5173';
    var host = hostHeader.split(',')[0].trim();
    var hostName = host.replace(/:\d+$/, '');
    var forwarded = req.headers['x-forwarded-proto'];
    var protoFromHeader = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
    var isLocalHost = hostName === 'localhost' ||
        hostName === '127.0.0.1' ||
        /^\d+\.\d+\.\d+\.\d+$/.test(hostName);
    var proto = protoFromHeader || (isLocalHost ? 'http' : 'https');
    return "".concat(proto, "://").concat(host);
}
function proxyUrlFor(req, targetUrl) {
    return "".concat(getPublicOrigin(req), "/api/hls-proxy?url=").concat(encodeURIComponent(targetUrl));
}
function rewriteManifest(body, sourceUrl, req) {
    var base = new URL(sourceUrl);
    return body
        .split('\n')
        .map(function (line) {
        var trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return line;
        }
        var absolute = new URL(trimmed, base).href;
        if (!isAllowedUrl(absolute)) {
            return line;
        }
        return proxyUrlFor(req, absolute);
    })
        .join('\n');
}
function attachHlsProxy(middlewares) {
    var _this = this;
    middlewares.use('/api/hls-proxy', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var requestUrl, targetUrl, upstream, contentType, isManifest, text, buffer, _a, _b, _c;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 5, , 6]);
                    requestUrl = new URL((_d = req.url) !== null && _d !== void 0 ? _d : '', 'http://localhost');
                    targetUrl = requestUrl.searchParams.get('url');
                    if (!targetUrl || !isAllowedUrl(targetUrl)) {
                        res.statusCode = 400;
                        res.end('Invalid url');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, fetch(targetUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (compatible; FootballStreamHub/1.0)',
                                Referer: STREAM_REFERER,
                                Accept: '*/*',
                            },
                        })];
                case 1:
                    upstream = _e.sent();
                    if (!upstream.ok) {
                        res.statusCode = upstream.status;
                        res.end('Upstream error');
                        return [2 /*return*/];
                    }
                    contentType = upstream.headers.get('content-type') || '';
                    isManifest = targetUrl.includes('.m3u8') || contentType.includes('mpegurl');
                    if (!isManifest) return [3 /*break*/, 3];
                    return [4 /*yield*/, upstream.text()];
                case 2:
                    text = _e.sent();
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
                    res.setHeader('Cache-Control', 'no-store');
                    res.end(rewriteManifest(text, targetUrl, req));
                    return [2 /*return*/];
                case 3:
                    _b = (_a = Buffer).from;
                    return [4 /*yield*/, upstream.arrayBuffer()];
                case 4:
                    buffer = _b.apply(_a, [_e.sent()]);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', contentType || 'video/mp2t');
                    res.setHeader('Cache-Control', 'no-store');
                    res.end(buffer);
                    return [3 /*break*/, 6];
                case 5:
                    _c = _e.sent();
                    res.statusCode = 502;
                    res.end('Proxy error');
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
}
export function hlsProxyPlugin() {
    return {
        name: 'hls-proxy',
        configureServer: function (server) {
            attachHlsProxy(server.middlewares);
        },
        configurePreviewServer: function (server) {
            attachHlsProxy(server.middlewares);
        },
    };
}
