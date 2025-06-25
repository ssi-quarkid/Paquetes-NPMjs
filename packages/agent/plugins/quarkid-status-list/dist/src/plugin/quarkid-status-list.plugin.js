"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtrimianStatusListAgentPlugin = void 0;
var quarkid_credential_status_1 = require("../models/quarkid-credential-status");
var axios_1 = require("axios");
var ExtrimianStatusListAgentPlugin = /** @class */ (function () {
    function ExtrimianStatusListAgentPlugin(opts) {
        this.pluginStorage = opts.pluginStorage;
        this.vslApiUrl = opts.vslApiURL.endsWith('/') ? opts.vslApiURL.slice(0, -1) : opts.vslApiURL;
        this.bitArraySC = opts.bitArraySC;
    }
    ExtrimianStatusListAgentPlugin.prototype.canHandle = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, true];
            });
        });
    };
    ExtrimianStatusListAgentPlugin.prototype.handle = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var cs, index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cs = new quarkid_credential_status_1.QuarkIDCredentialStatus();
                        return [4 /*yield*/, this.getIndexFromBitArray(this.currentBitArray)];
                    case 1:
                        index = _a.sent();
                        cs.type = "bitArrayStatusEntry";
                        cs.persistanceType = quarkid_credential_status_1.PersistanceType.IPFS;
                        cs.bitArrayIndex = index;
                        cs.bitArraySC = this.bitArraySC;
                        cs.bitArrayID = this.currentBitArray.id;
                        input.vc.credentialStatus = cs;
                        return [2 /*return*/];
                }
            });
        });
    };
    ExtrimianStatusListAgentPlugin.prototype.initialize = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var bitArrays, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.agent = params.agent;
                        return [4 /*yield*/, this.getBitArrays()];
                    case 1:
                        bitArrays = _b.sent();
                        if (!(!bitArrays || (bitArrays && bitArrays.length == 0))) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createNewBitArray()];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _a = this;
                        return [4 /*yield*/, this.getLastBitArray()];
                    case 4:
                        _a.currentBitArray = _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ExtrimianStatusListAgentPlugin.prototype.getBitArrays = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.pluginStorage.get("bit-array")];
                    case 1: return [2 /*return*/, (_a.sent()) || []];
                }
            });
        });
    };
    ExtrimianStatusListAgentPlugin.prototype.getLastBitArray = function () {
        return __awaiter(this, void 0, void 0, function () {
            var bitArrays;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getBitArrays()];
                    case 1:
                        bitArrays = _a.sent();
                        if (bitArrays.length == 0)
                            return [2 /*return*/, null];
                        return [2 /*return*/, bitArrays[bitArrays.length - 1]];
                }
            });
        });
    };
    ExtrimianStatusListAgentPlugin.prototype.saveBitArrays = function (bitArrays) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.pluginStorage.add("bit-array", bitArrays)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ExtrimianStatusListAgentPlugin.prototype.createNewBitArray = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, result, bitArrays;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.vslApiUrl, "/bit-array");
                        return [4 /*yield*/, axios_1.default.put(url)];
                    case 1:
                        result = (_a.sent()).data;
                        return [4 /*yield*/, this.getBitArrays()];
                    case 2:
                        bitArrays = _a.sent();
                        bitArrays.push(result);
                        return [4 /*yield*/, this.saveBitArrays(bitArrays)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ExtrimianStatusListAgentPlugin.prototype.getIndexFromBitArray = function (bitArray) {
        return __awaiter(this, void 0, void 0, function () {
            var url, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.vslApiUrl, "/bit-array/").concat(bitArray.id, "/index");
                        return [4 /*yield*/, axios_1.default.put(url)];
                    case 1:
                        result = (_a.sent()).data;
                        return [2 /*return*/, result.index];
                }
            });
        });
    };
    return ExtrimianStatusListAgentPlugin;
}());
exports.ExtrimianStatusListAgentPlugin = ExtrimianStatusListAgentPlugin;
//# sourceMappingURL=quarkid-status-list.plugin.js.map