import { DID, VerifiableCredential, WACICredentialOfferSucceded, WACIProtocol } from "../../src";
import { IStorage } from "../../src/models/agent-storage";
import { MemoryStorage } from "../mock/memory-storage";

export function getIssuerWACIProtocol(storage?: IStorage) {
    return new WACIProtocol({
        storage: storage || new MemoryStorage(),
        issuer: {
            issuerVerificationRules: async (waciInvitationId: string, holdedDid: string) => {
                console.log("issuerVerificationRules", waciInvitationId);
                return {
                    verified: true,
                    rejectMsg: null,
                }
            },
            issueCredentials: async (waciInvitationId: string, holderId: string) => {
                return new WACICredentialOfferSucceded({
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
                        }],
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
            },
        },
        verifier: {
            businessVerificationRules: async (invitationId: string, holderDID: DID, vcs: VerifiableCredential[]) => {
                return { result: false, rejectMessage: 'Se rechaza por prueba' } as any;
            },
            presentationDefinition: async (invitationId: string) => {
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
            },
        },
    });
}