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
// import { VerifiableCredential } from "@extrimian/vc-core";
var agent_1 = require("@quarkid/agent");
var memory_storage_1 = require("./mock/memory-storage");
var filesystme_storage_1 = require("./mock/filesystme-storage");
var filesystem_secure_storage_1 = require("./mock/filesystem-secure-storage");
var index_1 = require("../src/index");
var waci_protocol_helper_1 = require("./helpers/waci-protocol-helper");
var transport_mock_1 = require("./mock/transport-mock");
jest.setTimeout(1000000);
var issuerAgent;
var holderAgent;
var waciProtocol;
beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    var didDocumentRegistry, holderWaciProtocol, didDocumentRegistry2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                waciProtocol = new agent_1.WACIProtocol({
                    storage: new memory_storage_1.MemoryStorage(),
                });
                didDocumentRegistry = new agent_1.AgentModenaRegistry("https://cadena-aduana-a.extrimian.com/sidetree/", "did:cadena:lacnet");
                // didDocumentRegistry.setDefaultDIDMethod("did:quarkid")
                issuerAgent = new agent_1.Agent({
                    didDocumentRegistry: didDocumentRegistry,
                    didDocumentResolver: new agent_1.AgentModenaResolver("https://cadena-aduana-a.extrimian.com/sidetree/"),
                    agentStorage: new filesystme_storage_1.FileSystemStorage({
                        filepath: "./__test__/data/agent-issuer-storage.json"
                    }),
                    secureStorage: new filesystem_secure_storage_1.FileSystemAgentSecureStorage({
                        filepath: "./__test__/data/agent-issuer-secure-storage.json"
                    }),
                    vcStorage: new memory_storage_1.MemoryStorage(),
                    vcProtocols: [(0, waci_protocol_helper_1.getIssuerWACIProtocol)()],
                    supportedTransports: [new transport_mock_1.MockTransport()],
                    credentialStatusPlugins: [new index_1.ExtrimianStatusListAgentPlugin({
                            bitArraySC: '0xde2b7414e2918a393b59fc130bceb75c3ee52493',
                            pluginStorage: new filesystme_storage_1.FileSystemStorage({ filepath: 'vcsl.json' }),
                            vslApiURL: 'http://35.221.5.84:4242'
                        })]
                });
                return [4 /*yield*/, issuerAgent.initialize()];
            case 1:
                _a.sent();
                issuerAgent.vc.credentialIssued.on(function (args) {
                    console.log(args);
                });
                holderWaciProtocol = new agent_1.WACIProtocol({
                    storage: new memory_storage_1.MemoryStorage(),
                    holder: {
                        credentialApplication: function (inputs, selectiveDisclosure, message, issuer, credentialsToReceive) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, inputs.length == 0 || inputs[0].credentials.length == 0 ? null : [inputs[0].credentials[0].data]];
                            });
                        }); }
                    },
                });
                didDocumentRegistry2 = new agent_1.AgentModenaRegistry("https://cadena-aduana-a.extrimian.com/sidetree/", "did:cadena:lacnet");
                // didDocumentRegistry2.setDefaultDIDMethod("did:quarkid")
                holderAgent = new agent_1.Agent({
                    didDocumentRegistry: didDocumentRegistry2,
                    didDocumentResolver: new agent_1.AgentModenaResolver("https://cadena-aduana-a.extrimian.com/sidetree/"),
                    agentStorage: new filesystme_storage_1.FileSystemStorage({
                        filepath: "./__test__/data/agent-holder-storage.json"
                    }),
                    secureStorage: new filesystem_secure_storage_1.FileSystemAgentSecureStorage({
                        filepath: "./__test__/data/agent-holder-secure-storage.json"
                    }),
                    vcStorage: new filesystme_storage_1.FileSystemStorage({
                        filepath: "./__test__/data/agent-holder-vc-storage.json",
                    }),
                    vcProtocols: [holderWaciProtocol],
                    supportedTransports: [new transport_mock_1.MockTransport()],
                });
                return [4 /*yield*/, holderAgent.initialize()];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
describe("One Click Plugin", function () {
    it("Complete Flow", function () { return __awaiter(void 0, void 0, void 0, function () {
        var processMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    processMessage = function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                                    var _a, _b;
                                    var _c;
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0:
                                                holderAgent.vc.credentialArrived.on(function (vc) { return __awaiter(void 0, void 0, void 0, function () {
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0: return [4 /*yield*/, Promise.all(vc.credentials.map(function (v) { return __awaiter(void 0, void 0, void 0, function () {
                                                                    var result;
                                                                    return __generator(this, function (_a) {
                                                                        switch (_a.label) {
                                                                            case 0: return [4 /*yield*/, holderAgent.vc.saveCredentialWithInfo(v.data, {
                                                                                    display: v.display,
                                                                                    styles: v.styles
                                                                                })];
                                                                            case 1:
                                                                                _a.sent();
                                                                                expect(v === null || v === void 0 ? void 0 : v.data.id).toEqual('http://example.edu/credentials/58473');
                                                                                return [4 /*yield*/, holderAgent.vc.verifyVC({
                                                                                        vc: v.data,
                                                                                    })];
                                                                            case 2:
                                                                                result = _a.sent();
                                                                                expect(result.result).toBe(true);
                                                                                return [2 /*return*/];
                                                                        }
                                                                    });
                                                                }); }))];
                                                            case 1:
                                                                _a.sent();
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); });
                                                _b = (_a = holderAgent.vc).processMessage;
                                                _c = {};
                                                return [4 /*yield*/, issuerAgent.vc.createInvitationMessage({ flow: agent_1.CredentialFlow.Issuance })];
                                            case 1: return [4 /*yield*/, _b.apply(_a, [(_c.message = _d.sent(),
                                                        _c)])];
                                            case 2:
                                                _d.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        });
                    }); };
                    return [4 /*yield*/, processMessage()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=extrimian-status-list-plugin.test.js.map