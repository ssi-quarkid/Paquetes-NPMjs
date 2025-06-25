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
exports.getIssuerWACIProtocol = void 0;
const src_1 = require("../../src");
const memory_storage_1 = require("../mock/memory-storage");
function getIssuerWACIProtocol() {
    return new src_1.WACIProtocol({
        storage: new memory_storage_1.MemoryStorage(),
        issuer: {
            issuerVerificationRules: (waciInvitationId, holdedDid) => __awaiter(this, void 0, void 0, function* () {
                console.log("issuerVerificationRules", waciInvitationId);
                return {
                    verified: true,
                    rejectMsg: null,
                };
            }),
            issueCredentials: (waciInvitationId, holderId) => __awaiter(this, void 0, void 0, function* () {
                return new src_1.WACICredentialOfferSucceded({
                    credentials: [
                        {
                            credential: {
                                '@context': [
                                    'https://www.w3.org/2018/credentials/v1',
                                    'https://www.w3.org/2018/credentials/examples/v1',
                                    'https://w3id.org/security/bbs/v1',
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
                                        path: ['$.name', '$.vc.name'],
                                        fallback: 'Alumni Credential',
                                    },
                                    subtitle: {
                                        path: ['$.class', '$.vc.class'],
                                        fallback: 'Alumni',
                                    },
                                    description: {
                                        text: 'Credencial que permite validar que es alumno del establecimiento',
                                    },
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
                });
            }),
        },
        verifier: {
            presentationDefinition: (invitationId) => __awaiter(this, void 0, void 0, function* () {
                return {
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
                };
            }),
        },
    });
}
exports.getIssuerWACIProtocol = getIssuerWACIProtocol;
//# sourceMappingURL=waci-protocol-helper.js.map