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
exports.getIssuerWACIProtocol = void 0;
var agent_1 = require("@quarkid/agent");
var memory_storage_1 = require("../mock/memory-storage");
function getIssuerWACIProtocol(storage) {
    var _this = this;
    return new agent_1.WACIProtocol({
        storage: storage || new memory_storage_1.MemoryStorage(),
        issuer: {
            issuerVerificationRules: function (waciInvitationId, holdedDid) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    console.log("issuerVerificationRules", waciInvitationId);
                    return [2 /*return*/, {
                            verified: true,
                            rejectMsg: null,
                        }];
                });
            }); },
            issueCredentials: function (waciInvitationId, holderId) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, new agent_1.WACICredentialOfferSucceded({
                            credentials: [
                                {
                                    credential: {
                                        "@context": [
                                            "https://www.w3.org/2018/credentials/v1",
                                            "https://www.w3.org/2018/credentials/examples/v1",
                                            "https://w3id.org/security/bbs/v1",
                                            "https://mocki.io/v1/48f18d57-8226-49ff-bc87-a78660767b06"
                                            // {
                                            //     "bitArrayStatusEntry": "https://example.org/terms/bitArrayStatusEntry",
                                            //     "persistanceType": "https://example.org/terms/persistanceType",
                                            //     "bitArrayIndex": "https://example.org/terms/bitArrayIndex",
                                            //     "bitArraySC": "https://example.org/terms/bitArraySC",
                                            //     "bitArrayID": "https://example.org/terms/bitArrayID"
                                            // } as any
                                        ],
                                        id: 'http://example.edu/credentials/58473',
                                        type: ['VerifiableCredential', 'AlumniCredential'],
                                        issuer: 'did:quarkid:matic:EiDs1liYifwFEg9l7rxrpR48MH-7Z-M2E32R1vEYThQWsQ',
                                        issuanceDate: new Date(),
                                        credentialSubject: {
                                            id: 'did:quarkid:matic:EiCG4tEWdX08DuGKM6rX-fUfHxmJ_N6SY8XqTI8QHfBgtQ',
                                            givenName: 'Jhon',
                                            familyName: 'Does',
                                        },
                                    },
                                    outputDescriptor: {
                                        id: 'alumni_credential_output',
                                        schema: 'https://schema.org/EducationalOccupationalCredential',
                                        display: {
                                            title: {
                                                path: ['$.credentialSubject.givenName'],
                                                fallback: 'Alumni Credential',
                                            },
                                            subtitle: {
                                                path: ['$.credentialSubject.familyName'],
                                                fallback: 'Alumni',
                                            },
                                            description: {
                                                text: 'Credencial que permite validar que es alumno del establecimiento',
                                            },
                                            properties: [{
                                                    path: ['$.credentialSubject.givenName'],
                                                    fallback: 'Sin nombre',
                                                    label: 'Nombre'
                                                }]
                                        },
                                        styles: {
                                            background: {
                                                color: '#ff0000',
                                            },
                                            thumbnail: {
                                                uri: 'https://dol.wa.com/logo.png',
                                                alt: 'Universidad Nacional',
                                            },
                                            hero: {
                                                uri: 'https://dol.wa.com/alumnos.png',
                                                alt: 'Alumnos de la universidad',
                                            },
                                            text: {
                                                color: '#d4d400',
                                            },
                                        },
                                    }
                                }
                            ],
                            inputDescriptors: null,
                            issuer: {
                                name: 'Universidad Nacional',
                                styles: {
                                    thumbnail: {
                                        uri: 'https://dol.wa.com/logo.png',
                                        alt: 'Universidad Nacional',
                                    },
                                    hero: {
                                        uri: 'https://dol.wa.com/alumnos.png',
                                        alt: 'Alumnos de la universidad',
                                    },
                                    background: {
                                        color: '#ff0000',
                                    },
                                    text: {
                                        color: '#d4d400',
                                    },
                                },
                            },
                            options: {
                                challenge: '508adef4-b8e0-4edf-a53d-a260371c1423',
                                domain: '9rf25a28rs96',
                            },
                        })];
                });
            }); },
        },
        verifier: {
            presentationDefinition: function (invitationId) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, {
                            frame: {
                                '@context': [
                                    'https://www.w3.org/2018/credentials/v1',
                                    'https://www.w3.org/2018/credentials/examples/v1',
                                    'https://w3id.org/security/bbs/v1',
                                ],
                                type: ['VerifiableCredential', 'AlumniCredential'],
                                credentialSubject: {
                                    '@explicit': true,
                                    type: ['AlumniCredential'],
                                    givenName: {},
                                    familyName: {},
                                },
                            },
                            inputDescriptors: [
                                {
                                    id: 'Alumni Credential',
                                    name: 'AlumniCredential',
                                    constraints: {
                                        fields: [
                                            {
                                                path: ['$.credentialSubject.givenName'],
                                                filter: {
                                                    type: 'string',
                                                },
                                            },
                                            {
                                                path: ['$.credentialSubject.familyName'],
                                                filter: {
                                                    type: 'string',
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        }];
                });
            }); },
        },
    });
}
exports.getIssuerWACIProtocol = getIssuerWACIProtocol;
//# sourceMappingURL=waci-protocol-helper.js.map