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
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../src");
const agent_1 = require("../../src/agent");
const dwn_transport_1 = require("../../src/models/transports/dwn-transport");
const credentia_flow_1 = require("../../src/vc/models/credentia-flow");
const waci_protocol_1 = require("../../src/vc/protocols/waci-protocol");
const config_1 = require("../config");
const filesystem_secure_storage_1 = require("../mock/filesystem-secure-storage");
const filesystme_storage_1 = require("../mock/filesystme-storage");
const memory_storage_1 = require("../mock/memory-storage");
const vc = require('./mock/vc.json');
jest.setTimeout(1000000);
let issuerAgent;
let holderAgent;
let waciProtocol;
let holderResolve;
const holder = new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
    holderResolve = resolve;
}));
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    waciProtocol = new waci_protocol_1.WACIProtocol({
        storage: new memory_storage_1.MemoryStorage(),
        issuer: {
            issuerVerificationRules: (waciInvitationId, holdedDid) => __awaiter(void 0, void 0, void 0, function* () {
                console.log("issuerVerificationRules", waciInvitationId);
                return {
                    verified: true,
                    rejectMsg: null,
                };
            }),
            issueCredentials: (waciInvitationId, holderId) => __awaiter(void 0, void 0, void 0, function* () {
                return new waci_protocol_1.WACICredentialOfferSucceded({
                    credentials: [
                        {
                            credential: {
                                "@context": [
                                    "https://www.w3.org/2018/credentials/v1",
                                    "https://w3id.org/citizenship/v1",
                                    "https://w3id.org/security/bbs/v1"
                                ],
                                "id": "https://issuer.oidp.uscis.gov/credentials/83627465",
                                "type": ["VerifiableCredential", "PermanentResidentCard"],
                                "issuer": "did:example:489398593",
                                "name": "Permanent Resident Card",
                                "description": "Government of Example Permanent Resident Card.",
                                issuanceDate: "2021-11-17T12:19:52Z",
                                // "expirationDate": "2029-11-17T12:19:52Z",
                                "credentialSubject": {
                                    "id": "did:example:b34ca6cd37bbf23",
                                    "type": ["PermanentResident", "Person"],
                                    "givenName": "JOHN",
                                    "familyName": "SMITH",
                                    "gender": "Male",
                                    "image": "data:image/png;base64,iVBORw0KGgokJggg==",
                                    "residentSince": "2015-01-01",
                                    "lprCategory": "C09",
                                    "lprNumber": "999-999-999",
                                    "commuterClassification": "C1",
                                    "birthCountry": "Bahamas",
                                    "birthDate": "1958-07-17"
                                }
                            },
                            outputDescriptor: {
                                id: 'citizencard',
                                // schema: 'https://schema.org/EducationalOccupationalCredential',
                                display: {
                                    title: {
                                        path: ['$.name', '$.vc.name'],
                                        fallback: 'Resident Card',
                                    },
                                    subtitle: {
                                        path: ['$.class', '$.vc.class'],
                                        fallback: 'Resident Card',
                                    },
                                    description: {
                                        text: 'Credencial de residencia',
                                    },
                                    properties: [
                                        {
                                            path: [
                                                "$.credentialSubject.givenName",
                                            ],
                                            fallback: "Unknown",
                                            label: "Primer Nombre"
                                        },
                                        {
                                            path: [
                                                "$.credentialSubject.familyName",
                                            ],
                                            fallback: "Unknown",
                                            label: "Apellido"
                                        },
                                        {
                                            path: [
                                                "$.credentialSubject.image",
                                            ],
                                            fallback: "Unknown",
                                            label: "Foto"
                                        },
                                        {
                                            path: [
                                                "$.credentialSubject.birthDate",
                                            ],
                                            fallback: "Unknown",
                                            label: "Nacimiento"
                                        }
                                    ]
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
                    inputDescriptors: [
                        {
                            id: 'Permanent Resident',
                            name: 'PermanentResident',
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
                    frame: {
                        "@context": [
                            "https://www.w3.org/2018/credentials/v1",
                            "https://w3id.org/citizenship/v1",
                            "https://w3id.org/security/bbs/v1"
                        ],
                        "type": [
                            "VerifiableCredential",
                            "PermanentResidentCard"
                        ],
                        "credentialSubject": {
                            "@explicit": true,
                            "type": [
                                "PermanentResident",
                                "Person"
                            ],
                            "birthDate": {},
                            "image": {}
                        }
                    },
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
                });
            }),
        },
        verifier: {
            presentationDefinition: (invitationId) => __awaiter(void 0, void 0, void 0, function* () {
                return {
                    frame: {
                        "@context": [
                            "https://www.w3.org/2018/credentials/v1",
                            "https://w3id.org/citizenship/v1",
                            "https://w3id.org/security/bbs/v1"
                        ],
                        "type": [
                            "VerifiableCredential",
                            "PermanentResidentCard"
                        ],
                        "credentialSubject": {
                            "@explicit": true,
                            "type": [
                                "PermanentResident",
                                "Person"
                            ],
                            "birthDate": {},
                            "image": {}
                        }
                    },
                    inputDescriptors: [
                        {
                            id: 'Permanent Resident',
                            name: 'PermanentResident',
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
                };
            }),
        },
    });
    issuerAgent = new agent_1.Agent({
        didDocumentRegistry: new src_1.AgentModenaUniversalRegistry(config_1.TestConfig.modenaUrl, config_1.TestConfig.defaultDIDMethod),
        didDocumentResolver: new src_1.AgentModenaUniversalResolver(config_1.TestConfig.modenaUrl),
        agentStorage: new filesystme_storage_1.FileSystemStorage({
            filepath: './__test__/data/agent-issuer-storage.json',
        }),
        secureStorage: new filesystem_secure_storage_1.FileSystemAgentSecureStorage({
            filepath: './__test__/data/agent-issuer-secure-storage.json',
        }),
        vcStorage: new memory_storage_1.MemoryStorage(),
        vcProtocols: [waciProtocol],
        supportedTransports: [new dwn_transport_1.DWNTransport()],
    });
    yield issuerAgent.initialize();
    if (issuerAgent.identity.getOperationalDID() == null) {
        const createDID = new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            issuerAgent.identity.didCreated.on((did) => {
                resolve();
            });
            issuerAgent.identity.createNewDID({
                dwnUrl: config_1.TestConfig.dwnUrl
            });
        }));
        yield createDID;
    }
    issuerAgent.vc.credentialIssued.on((args) => {
        console.log(args);
    });
    const holderWaciProtocol = new waci_protocol_1.WACIProtocol({
        storage: new memory_storage_1.MemoryStorage(),
        holder: {
            credentialApplication: (inputs, selectiveDisclosure, message, issuer, credentialsToReceive) => __awaiter(void 0, void 0, void 0, function* () {
                if (selectiveDisclosure.credentialSubjectFieldsToReveal.indexOf("Foto") == -1 ||
                    selectiveDisclosure.credentialSubjectFieldsToReveal.indexOf("Nacimiento") == -1) {
                    throw new Error("Se espera que credentialSubjectFieldsToReveal cargue los labels del output.");
                }
                return inputs.length == 0 || inputs[0].credentials.length == 0 ? null : [inputs[0].credentials[0].data];
            })
        },
    });
    holderAgent = new agent_1.Agent({
        didDocumentRegistry: new src_1.AgentModenaUniversalRegistry(config_1.TestConfig.modenaUrl, config_1.TestConfig.defaultDIDMethod),
        didDocumentResolver: new src_1.AgentModenaUniversalResolver(config_1.TestConfig.modenaUrl),
        agentStorage: new filesystme_storage_1.FileSystemStorage({
            filepath: './__test__/data/agent-holder-storage.json',
        }),
        secureStorage: new filesystem_secure_storage_1.FileSystemAgentSecureStorage({
            filepath: './__test__/data/agent-holder-secure-storage.json',
        }),
        vcStorage: new filesystme_storage_1.FileSystemStorage({
            filepath: './__test__/data/agent-holder-vc-storage.json',
        }),
        vcProtocols: [holderWaciProtocol],
        supportedTransports: [new dwn_transport_1.DWNTransport()],
    });
    yield holderAgent.initialize();
    if (holderAgent.identity.getOperationalDID() == null) {
        const createDID = new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            holderAgent.identity.didCreated.on((did) => {
                resolve();
            });
            holderAgent.identity.createNewDID({
                dwnUrl: config_1.TestConfig.dwnUrl
            });
        }));
        yield createDID;
    }
    const wait = () => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, 20000);
        });
    });
    yield wait();
}));
afterAll(() => {
    issuerAgent.transport.transports.forEach(x => x.dispose());
    holderAgent.transport.transports.forEach(x => x.dispose());
});
describe('Verifiable Credentials', () => {
    it('Credential Issuance', () => __awaiter(void 0, void 0, void 0, function* () {
        const processMessage = () => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                holderAgent.vc.credentialArrived.on((vc) => __awaiter(void 0, void 0, void 0, function* () {
                    yield Promise.all(vc.credentials.map((v) => __awaiter(void 0, void 0, void 0, function* () {
                        yield holderAgent.vc.saveCredentialWithInfo(v.data, {
                            display: v.display,
                            styles: v.styles
                        });
                        expect(v === null || v === void 0 ? void 0 : v.data.id).toEqual('https://issuer.oidp.uscis.gov/credentials/83627465');
                        const result = yield holderAgent.vc.verifyVC({
                            vc: v.data,
                        });
                        expect(vc.messageId).not.toBeNull();
                        expect(result.result).toBe(true);
                    })));
                }));
                issuerAgent.vc.ackCompleted.on((args) => {
                    console.log(args);
                    expect(args.messageId).not.toBeNull();
                    resolve(null);
                });
                issuerAgent.vc.presentationVerified.on((args) => {
                    expect(args.messageId).not.toBeNull();
                    const credential = args.vcs[0];
                    //Acá se verifica que haya aplicado el selective disclosure
                    expect(credential.credentialSubject.birthDate).toEqual("1958-07-17");
                    expect(credential.credentialSubject.image).toEqual("data:image/png;base64,iVBORw0KGgokJggg==");
                    expect(credential.credentialSubject.familyName).toBeUndefined();
                });
                yield holderAgent.vc.processMessage({
                    message: yield issuerAgent.vc.createInvitationMessage({
                        flow: credentia_flow_1.CredentialFlow.Issuance,
                    }),
                });
            }));
        });
        yield processMessage();
    }));
    it('Credential Presentation: Holder wait and process message again', () => __awaiter(void 0, void 0, void 0, function* () {
        yield holderAgent.vc.processMessage({
            message: yield issuerAgent.vc.createInvitationMessage({
                flow: credentia_flow_1.CredentialFlow.Presentation,
            })
        });
        yield holderResolve;
        issuerAgent.vc.credentialPresented.on((args) => {
            console.log(args);
        });
        const waitCredentialArrived = () => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                holderAgent.vc.credentialArrived.on((vc) => __awaiter(void 0, void 0, void 0, function* () {
                    yield Promise.all(vc.credentials.map((v) => __awaiter(void 0, void 0, void 0, function* () {
                        yield holderAgent.vc.saveCredentialWithInfo(v.data, {
                            display: v.display,
                            styles: v.styles
                        });
                        expect(v === null || v === void 0 ? void 0 : v.data.id).toEqual('http://example.edu/credentials/58473');
                        const result = yield holderAgent.vc.verifyVC({
                            vc: v.data,
                        });
                        expect(result.result).toBe(true);
                    })));
                }));
                holderAgent.vc.ackCompleted.on((args) => {
                    expect(args.messageId).not.toBeNull();
                    resolve();
                });
                holderAgent.vc.problemReport.on((data) => {
                    expect(data.messageId).not.toBeNull();
                    reject("Problem Report");
                });
            }));
        });
        yield waitCredentialArrived();
    }));
});
//# sourceMappingURL=selective-disclosure-flow.test1.js.map