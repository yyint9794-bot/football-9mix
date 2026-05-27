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
import * as wallet from './server/walletStore.mjs';
function readBody(req) {
    return new Promise(function (resolve) {
        var raw = '';
        req.on('data', function (chunk) {
            raw += chunk;
        });
        req.on('end', function () {
            if (!raw.trim()) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(raw));
            }
            catch (_a) {
                resolve({});
            }
        });
    });
}
function getToken(req) {
    var _a;
    var auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
        return auth.slice(7).trim();
    }
    var url = new URL((_a = req.url) !== null && _a !== void 0 ? _a : '', 'http://localhost');
    return url.searchParams.get('token') || '';
}
function sendJson(res, status, payload) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
}
function handleWalletApi(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var rawPath, segments, token, body, _a, result, result, result, result, result, result, result, result, result, query, result, result, result, result, query, result, result, result, error_1;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    rawPath = ((_b = req.url) !== null && _b !== void 0 ? _b : '/').split('?')[0] || '/';
                    segments = rawPath.replace(/^\//, '').split('/').filter(Boolean);
                    token = getToken(req);
                    if (!(req.method === 'GET')) return [3 /*break*/, 1];
                    _a = {};
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, readBody(req)];
                case 2:
                    _a = _e.sent();
                    _e.label = 3;
                case 3:
                    body = _a;
                    _e.label = 4;
                case 4:
                    _e.trys.push([4, 39, , 40]);
                    if (!(segments[0] === 'login' && req.method === 'POST')) return [3 /*break*/, 6];
                    return [4 /*yield*/, wallet.walletLogin(String(body.username || ''), String(body.password || ''))];
                case 5:
                    result = _e.sent();
                    sendJson(res, result.error ? 401 : 200, result);
                    return [2 /*return*/];
                case 6:
                    if (!(segments[0] === 'logout' && req.method === 'POST')) return [3 /*break*/, 8];
                    return [4 /*yield*/, wallet.walletLogout(token)];
                case 7:
                    _e.sent();
                    sendJson(res, 200, { ok: true });
                    return [2 /*return*/];
                case 8:
                    if (!(segments[0] === 'me' && req.method === 'GET')) return [3 /*break*/, 10];
                    return [4 /*yield*/, wallet.walletMe(token)];
                case 9:
                    result = _e.sent();
                    sendJson(res, result.error ? 401 : 200, result);
                    return [2 /*return*/];
                case 10:
                    if (!(segments[0] === 'accept-terms' && req.method === 'POST')) return [3 /*break*/, 12];
                    return [4 /*yield*/, wallet.walletAcceptTerms(token)];
                case 11:
                    result = _e.sent();
                    sendJson(res, result.error ? 401 : 200, result);
                    return [2 /*return*/];
                case 12:
                    if (!(segments[0] === 'password' && req.method === 'POST')) return [3 /*break*/, 14];
                    return [4 /*yield*/, wallet.walletChangePassword(token, body.currentPassword, body.newPassword)];
                case 13:
                    result = _e.sent();
                    sendJson(res, result.error ? 400 : 200, result);
                    return [2 /*return*/];
                case 14:
                    if (!(segments[0] === 'payment-config' && req.method === 'GET')) return [3 /*break*/, 16];
                    return [4 /*yield*/, wallet.walletPaymentConfig()];
                case 15:
                    result = _e.sent();
                    sendJson(res, 200, result);
                    return [2 /*return*/];
                case 16:
                    if (!(segments[0] === 'transactions' && req.method === 'GET')) return [3 /*break*/, 18];
                    return [4 /*yield*/, wallet.userListTransactions(token)];
                case 17:
                    result = _e.sent();
                    sendJson(res, result.error ? 401 : 200, result);
                    return [2 /*return*/];
                case 18:
                    if (!(segments[0] === 'request' && req.method === 'POST')) return [3 /*break*/, 20];
                    return [4 /*yield*/, wallet.userRequestTransaction(token, body)];
                case 19:
                    result = _e.sent();
                    sendJson(res, result.error ? 400 : 200, result);
                    return [2 /*return*/];
                case 20:
                    if (!(segments[0] === 'bets' && segments[1] === 'settle' && req.method === 'POST')) return [3 /*break*/, 22];
                    return [4 /*yield*/, wallet.walletSettleBets(token, Array.isArray(body.matches) ? body.matches : [])];
                case 21:
                    result = _e.sent();
                    sendJson(res, result.error ? 401 : 200, result);
                    return [2 /*return*/];
                case 22:
                    if (!(segments[0] === 'bets' && req.method === 'POST')) return [3 /*break*/, 24];
                    return [4 /*yield*/, wallet.walletPlaceBet(token, body)];
                case 23:
                    result = _e.sent();
                    sendJson(res, result.error ? 400 : 200, result);
                    return [2 /*return*/];
                case 24:
                    if (!(segments[0] === 'bets' && req.method === 'GET')) return [3 /*break*/, 26];
                    query = new URL((_c = req.url) !== null && _c !== void 0 ? _c : '/', 'http://localhost').searchParams;
                    return [4 /*yield*/, wallet.walletListBets(token, query.get('status') || 'all')];
                case 25:
                    result = _e.sent();
                    sendJson(res, result.error ? 401 : 200, result);
                    return [2 /*return*/];
                case 26:
                    if (!(segments[0] === 'admin' && segments[1] === 'users')) return [3 /*break*/, 32];
                    if (!(req.method === 'GET' && segments.length === 2)) return [3 /*break*/, 28];
                    return [4 /*yield*/, wallet.adminListUsers(token)];
                case 27:
                    result = _e.sent();
                    sendJson(res, result.error ? 403 : 200, result);
                    return [2 /*return*/];
                case 28:
                    if (!(req.method === 'POST' && segments.length === 2)) return [3 /*break*/, 30];
                    return [4 /*yield*/, wallet.adminCreateUser(token, body)];
                case 29:
                    result = _e.sent();
                    sendJson(res, result.error ? 400 : 200, result);
                    return [2 /*return*/];
                case 30:
                    if (!(req.method === 'PATCH' && segments[2])) return [3 /*break*/, 32];
                    return [4 /*yield*/, wallet.adminUpdateUser(token, segments[2], body)];
                case 31:
                    result = _e.sent();
                    sendJson(res, result.error ? 400 : 200, result);
                    return [2 /*return*/];
                case 32:
                    if (!(segments[0] === 'admin' && segments[1] === 'transactions')) return [3 /*break*/, 38];
                    if (!(req.method === 'GET')) return [3 /*break*/, 34];
                    query = new URL((_d = req.url) !== null && _d !== void 0 ? _d : '/', 'http://localhost').searchParams;
                    return [4 /*yield*/, wallet.adminListTransactions(token, {
                            userId: query.get('userId') || undefined,
                            status: query.get('status') || undefined,
                        })];
                case 33:
                    result = _e.sent();
                    sendJson(res, result.error ? 403 : 200, result);
                    return [2 /*return*/];
                case 34:
                    if (!(req.method === 'POST' && segments.length === 2)) return [3 /*break*/, 36];
                    return [4 /*yield*/, wallet.adminPostTransaction(token, body)];
                case 35:
                    result = _e.sent();
                    sendJson(res, result.error ? 400 : 200, result);
                    return [2 /*return*/];
                case 36:
                    if (!(req.method === 'POST' && segments[2] === 'review' && segments[3])) return [3 /*break*/, 38];
                    return [4 /*yield*/, wallet.adminReviewTransaction(token, segments[3], body.decision === 'approve' ? 'approve' : 'reject', body.note)];
                case 37:
                    result = _e.sent();
                    sendJson(res, result.error ? 400 : 200, result);
                    return [2 /*return*/];
                case 38:
                    sendJson(res, 404, { error: 'Not found' });
                    return [3 /*break*/, 40];
                case 39:
                    error_1 = _e.sent();
                    sendJson(res, 500, { error: error_1 instanceof Error ? error_1.message : 'Server error' });
                    return [3 /*break*/, 40];
                case 40: return [2 /*return*/];
            }
        });
    });
}
function attachWalletApi(middlewares) {
    middlewares.use('/api/wallet', function (req, res) {
        void handleWalletApi(req, res);
    });
}
export function walletApiPlugin() {
    return {
        name: 'wallet-api',
        configureServer: function (server) {
            attachWalletApi(server.middlewares);
        },
        configurePreviewServer: function (server) {
            attachWalletApi(server.middlewares);
        },
    };
}
