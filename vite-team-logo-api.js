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
var ALLOWED_HOSTS = new Set([
    'sta.vnres.co',
    'assets.b365api.com',
    'upload.wikimedia.org',
    'wikipedia.org',
]);
function attachTeamLogoProxy(middlewares) {
    var _this = this;
    middlewares.use('/api/team-logo', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var requestUrl, imageUrl, parsed, upstream, buffer, _a, _b, _c;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 3, , 4]);
                    requestUrl = new URL((_d = req.url) !== null && _d !== void 0 ? _d : '', 'http://localhost');
                    imageUrl = requestUrl.searchParams.get('url');
                    if (!imageUrl) {
                        res.statusCode = 400;
                        res.end('Missing url');
                        return [2 /*return*/];
                    }
                    parsed = new URL(imageUrl);
                    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
                        res.statusCode = 403;
                        res.end('Forbidden host');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, fetch(imageUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (compatible; FootballStreamHub/1.0)',
                                Accept: 'image/*,*/*',
                                Referer: "".concat(parsed.protocol, "//").concat(parsed.hostname, "/"),
                            },
                        })];
                case 1:
                    upstream = _e.sent();
                    if (!upstream.ok) {
                        res.statusCode = upstream.status;
                        res.end('Upstream error');
                        return [2 /*return*/];
                    }
                    _b = (_a = Buffer).from;
                    return [4 /*yield*/, upstream.arrayBuffer()];
                case 2:
                    buffer = _b.apply(_a, [_e.sent()]);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                    res.end(buffer);
                    return [3 /*break*/, 4];
                case 3:
                    _c = _e.sent();
                    res.statusCode = 502;
                    res.end('Proxy error');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
}
export function teamLogoApiPlugin() {
    return {
        name: 'team-logo-api',
        configureServer: function (server) {
            attachTeamLogoProxy(server.middlewares);
        },
        configurePreviewServer: function (server) {
            attachTeamLogoProxy(server.middlewares);
        },
    };
}
