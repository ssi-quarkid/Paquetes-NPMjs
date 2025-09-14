import { DIDDocument } from "@quarkid/did-core";
import { ModenaResponse } from "@quarkid/did-resolver";
import { DID, IAgentResolver } from "../../src";

export class ResolverMock implements IAgentResolver {
    async resolve(did: DID): Promise<DIDDocument> {
        if (did.value == "did:quarkid:zksync:EiCWr5yfZvA_wFkvrW6f8FsNqSprc3U2mRALGUYVUac1UA") {
            return {
                "@context": [
                    "https://www.w3.org/ns/did/v1",
                    "https://w3id.org/security/suites/jws-2020/v1",
                    {
                        "@vocab": "https://www.w3.org/ns/did#"
                    }
                ],
                "id": "did:quarkid:zksync:EiCWr5yfZvA_wFkvrW6f8FsNqSprc3U2mRALGUYVUac1UA",
                "verificationMethod": [
                    {
                        "id": "#didcomm",
                        "controller": "did:quarkid:zksync:EiCWr5yfZvA_wFkvrW6f8FsNqSprc3U2mRALGUYVUac1UA",
                        "type": "X25519KeyAgreementKey2019",
                        "publicKeyJwk": {
                            "kty": "EC",
                            "crv": "Ed25519",
                            "x": "9sCe5K0h7zZ9UtFbqsiuig",
                            "y": "nxZmagayq0UypBt1KyF4hQ"
                        }
                    },
                    {
                        "id": "#vc-bbsbls",
                        "controller": "did:quarkid:zksync:EiCWr5yfZvA_wFkvrW6f8FsNqSprc3U2mRALGUYVUac1UA",
                        "type": "Bls12381G1Key2020",
                        "publicKeyJwk": {
                            "kty": "EC",
                            "crv": "Bls12381G2Key2020",
                            "x": "p83KWCHqoCz2xYB7_ubOQcG21944yN67QzcLcC2PC35XUBHAHT7vAql6h5xkplfd",
                            "y": "Ac4_yxGDDfer8FuT-0URTa0A-xKNmVn5AE7uUn6zwClpJeQsf7ysegstXWXr7x_u"
                        }
                    },
                    {
                        "id": "#rsa",
                        "controller": "did:quarkid:zksync:EiCWr5yfZvA_wFkvrW6f8FsNqSprc3U2mRALGUYVUac1UA",
                        "type": "RsaSignature2018",
                        "publicKeyJwk": {
                            "kty": "RSA",
                            "n": "1ApUWacFyuK4TMlDZkxEOuroHeP-wss37BI1o8VT23sfFMubJpjY-TZ1yKHv6ltPJPe4mSB5wDepzOubPMkcDkWZiSyvbTOmR-jzqyrAjUdoUUnl3dmZ1JppShgpyzftE73n8GDz9P_qTYEcZHoacz6JqH4LAULL4QDStlJOUbcGKMwN5b8nJm5wJX4yf1Gq1GUcpAx6eSNJkY2_EAm3zVXPkLc1-yh4ul1fubCtjD3tYQLnWmclylGmKEzXa5Hc4xauagkIpZ2bFYBSXENDJopebkBVQHKBX2DsRMQ4iqkAuP36KoAoacDkQRP-tCv3iWR3_aY9RYA7h1ylYon96Q",
                            "e": "AQAB"
                        }
                    }
                ],
                "keyAgreement": [
                    "#didcomm"
                ],
                "assertionMethod": [
                    "#vc-bbsbls"
                ],
                "authentication": [
                    "#rsa"
                ]
            } as any
        }
        return {
            "@context": [
                "https://www.w3.org/ns/did/v1",
                "https://w3id.org/security/suites/jws-2020/v1",
                {
                    "@vocab": "https://www.w3.org/ns/did#"
                }
            ],
            "id": "did:quarkid:zksync:EiD2STcz7xGq9GYXyeDWHxVJsQUQ_D73KnNIug0gjwXikg",
            "verificationMethod": [
                {
                    "id": "#didcomm",
                    "controller": "did:quarkid:zksync:EiD2STcz7xGq9GYXyeDWHxVJsQUQ_D73KnNIug0gjwXikg",
                    "type": "X25519KeyAgreementKey2019",
                    "publicKeyJwk": {
                        "kty": "EC",
                        "crv": "Ed25519",
                        "x": "JLHiazr3yZfhfFExslyt9g",
                        "y": "3ceQ2qpCoyQSxz5-sngSxg"
                    }
                },
                {
                    "id": "#vc-bbsbls",
                    "controller": "did:quarkid:zksync:EiD2STcz7xGq9GYXyeDWHxVJsQUQ_D73KnNIug0gjwXikg",
                    "type": "Bls12381G1Key2020",
                    "publicKeyJwk": {
                        "kty": "EC",
                        "crv": "Bls12381G2Key2020",
                        "x": "qnBqkxyo38PXIjKNB1zR_WASm_x6gRyseC7E6EgaAhNFN1mVj4Xc9UK0Fs7LF7qV",
                        "y": "FBebjw5yKwI1Ml9r-BUjEIHw2f-107USuy0BduZk4oaUU9rf_X7FLC_gVujhrWnW"
                    }
                },
                {
                    "id": "#rsa",
                    "controller": "did:quarkid:zksync:EiD2STcz7xGq9GYXyeDWHxVJsQUQ_D73KnNIug0gjwXikg",
                    "type": "RsaSignature2018",
                    "publicKeyJwk": {
                        "kty": "RSA",
                        "n": "p66N9Y9g19xi-5ZPqB7Wc5-rdVxUysK7ru8XmSdYsXcXVLxn5yuITclIdIoM8ojP2D5z5I9LEedCNItODuPuRAwGBy2gH9VX9yVNgvuqevbt_5cGdslPBKk5SMApzauEAsL2yVhogj0KWS6Ws2ULrwUJst0E4GVDzKHyrhWsm8RwFstnB8gHIQuQAfx1rYnHsa_UsbpgvkX7QxsOZK648Ox8Qd2_-PjGBmwC1b0XLng3yWfAMBST6sfSUWrDsqMAztFnXQeNKrbW73olfizsvdKtBpQCiX8I794J8hVmyNZYNe8sS0OyXuUh8eSeG0Uxuj2ira9cPf6NeJ3Lo-AmzQ",
                        "e": "AQAB"
                    }
                }
            ],
            "keyAgreement": [
                "#didcomm"
            ],
            "assertionMethod": [
                "#vc-bbsbls"
            ],
            "authentication": [
                "#rsa"
            ],
            "service": [
                {
                    "id": "#websocket",
                    "type": "MessagingWebSocket",
                    "serviceEndpoint": "https://21bc-186-182-88-152.ngrok.io"
                },
                {
                    "id": "#dwn-default",
                    "type": "DecentralizedWebNode",
                    "serviceEndpoint": {
                        "nodes": [
                            "https://run.mocky.io/v3/73394b7d-755e-4da7-b41e-39155474235f"
                        ]
                    }
                }
            ]
        } as any;
    }
    async resolveWithMetdata(did: DID): Promise<ModenaResponse> {
        if (did.value == "did:quarkid:zksync:EiCWr5yfZvA_wFkvrW6f8FsNqSprc3U2mRALGUYVUac1UA") {
            return {
                didDocument: {
                    "@context": [
                        "https://www.w3.org/ns/did/v1",
                        "https://w3id.org/security/suites/jws-2020/v1",
                        {
                            "@vocab": "https://www.w3.org/ns/did#"
                        }
                    ],
                    "id": "did:quarkid:zksync:EiCWr5yfZvA_wFkvrW6f8FsNqSprc3U2mRALGUYVUac1UA",
                    "verificationMethod": [
                        {
                            "id": "#didcomm",
                            "controller": "did:quarkid:zksync:EiCWr5yfZvA_wFkvrW6f8FsNqSprc3U2mRALGUYVUac1UA",
                            "type": "X25519KeyAgreementKey2019",
                            "publicKeyJwk": {
                                "kty": "EC",
                                "crv": "Ed25519",
                                "x": "9sCe5K0h7zZ9UtFbqsiuig",
                                "y": "nxZmagayq0UypBt1KyF4hQ"
                            }
                        },
                        {
                            "id": "#vc-bbsbls",
                            "controller": "did:quarkid:zksync:EiCWr5yfZvA_wFkvrW6f8FsNqSprc3U2mRALGUYVUac1UA",
                            "type": "Bls12381G1Key2020",
                            "publicKeyJwk": {
                                "kty": "EC",
                                "crv": "Bls12381G2Key2020",
                                "x": "p83KWCHqoCz2xYB7_ubOQcG21944yN67QzcLcC2PC35XUBHAHT7vAql6h5xkplfd",
                                "y": "Ac4_yxGDDfer8FuT-0URTa0A-xKNmVn5AE7uUn6zwClpJeQsf7ysegstXWXr7x_u"
                            }
                        },
                        {
                            "id": "#rsa",
                            "controller": "did:quarkid:zksync:EiCWr5yfZvA_wFkvrW6f8FsNqSprc3U2mRALGUYVUac1UA",
                            "type": "RsaSignature2018",
                            "publicKeyJwk": {
                                "kty": "RSA",
                                "n": "1ApUWacFyuK4TMlDZkxEOuroHeP-wss37BI1o8VT23sfFMubJpjY-TZ1yKHv6ltPJPe4mSB5wDepzOubPMkcDkWZiSyvbTOmR-jzqyrAjUdoUUnl3dmZ1JppShgpyzftE73n8GDz9P_qTYEcZHoacz6JqH4LAULL4QDStlJOUbcGKMwN5b8nJm5wJX4yf1Gq1GUcpAx6eSNJkY2_EAm3zVXPkLc1-yh4ul1fubCtjD3tYQLnWmclylGmKEzXa5Hc4xauagkIpZ2bFYBSXENDJopebkBVQHKBX2DsRMQ4iqkAuP36KoAoacDkQRP-tCv3iWR3_aY9RYA7h1ylYon96Q",
                                "e": "AQAB"
                            }
                        }
                    ],
                    "keyAgreement": [
                        "#didcomm"
                    ],
                    "assertionMethod": [
                        "#vc-bbsbls"
                    ],
                    "authentication": [
                        "#rsa"
                    ]
                } as any,
                didDocumentMetadata: {
                    canonicalId: 'did:quarkid:zksync:EiAKwJsI60QYvnftHvpRxXdeR-Pfm8eRniMWVPd7CHpvRQ',
                    versionId: 1,
                    method: {
                        published: true,
                        recoveryCommitment: [''],
                        updateCommitment: ['']
                    }
                },
                "@context": ""
            }
        }
        return {
            didDocument: {
                "@context": [
                    "https://www.w3.org/ns/did/v1",
                    "https://w3id.org/security/suites/jws-2020/v1",
                    {
                        "@vocab": "https://www.w3.org/ns/did#"
                    }
                ],
                "id": "did:quarkid:zksync:EiD2STcz7xGq9GYXyeDWHxVJsQUQ_D73KnNIug0gjwXikg",
                "verificationMethod": [
                    {
                        "id": "#didcomm",
                        "controller": "did:quarkid:zksync:EiD2STcz7xGq9GYXyeDWHxVJsQUQ_D73KnNIug0gjwXikg",
                        "type": "X25519KeyAgreementKey2019",
                        "publicKeyJwk": {
                            "kty": "EC",
                            "crv": "Ed25519",
                            "x": "JLHiazr3yZfhfFExslyt9g",
                            "y": "3ceQ2qpCoyQSxz5-sngSxg"
                        }
                    },
                    {
                        "id": "#vc-bbsbls",
                        "controller": "did:quarkid:zksync:EiD2STcz7xGq9GYXyeDWHxVJsQUQ_D73KnNIug0gjwXikg",
                        "type": "Bls12381G1Key2020",
                        "publicKeyJwk": {
                            "kty": "EC",
                            "crv": "Bls12381G2Key2020",
                            "x": "qnBqkxyo38PXIjKNB1zR_WASm_x6gRyseC7E6EgaAhNFN1mVj4Xc9UK0Fs7LF7qV",
                            "y": "FBebjw5yKwI1Ml9r-BUjEIHw2f-107USuy0BduZk4oaUU9rf_X7FLC_gVujhrWnW"
                        }
                    },
                    {
                        "id": "#rsa",
                        "controller": "did:quarkid:zksync:EiD2STcz7xGq9GYXyeDWHxVJsQUQ_D73KnNIug0gjwXikg",
                        "type": "RsaSignature2018",
                        "publicKeyJwk": {
                            "kty": "RSA",
                            "n": "p66N9Y9g19xi-5ZPqB7Wc5-rdVxUysK7ru8XmSdYsXcXVLxn5yuITclIdIoM8ojP2D5z5I9LEedCNItODuPuRAwGBy2gH9VX9yVNgvuqevbt_5cGdslPBKk5SMApzauEAsL2yVhogj0KWS6Ws2ULrwUJst0E4GVDzKHyrhWsm8RwFstnB8gHIQuQAfx1rYnHsa_UsbpgvkX7QxsOZK648Ox8Qd2_-PjGBmwC1b0XLng3yWfAMBST6sfSUWrDsqMAztFnXQeNKrbW73olfizsvdKtBpQCiX8I794J8hVmyNZYNe8sS0OyXuUh8eSeG0Uxuj2ira9cPf6NeJ3Lo-AmzQ",
                            "e": "AQAB"
                        }
                    }
                ],
                "keyAgreement": [
                    "#didcomm"
                ],
                "assertionMethod": [
                    "#vc-bbsbls"
                ],
                "authentication": [
                    "#rsa"
                ],
                "service": [
                    {
                        "id": "#websocket",
                        "type": "MessagingWebSocket",
                        "serviceEndpoint": "https://21bc-186-182-88-152.ngrok.io"
                    },
                    {
                        "id": "#dwn-default",
                        "type": "DecentralizedWebNode",
                        "serviceEndpoint": {
                            "nodes": [
                                "https://run.mocky.io/v3/73394b7d-755e-4da7-b41e-39155474235f"
                            ]
                        }
                    }
                ]
            } as any,
            didDocumentMetadata: {
                canonicalId: 'did:quarkid:zksync:EiAKwJsI60QYvnftHvpRxXdeR-Pfm8eRniMWVPd7CHpvRQ',
                versionId: 1,
                method: {
                    published: true,
                    recoveryCommitment: [''],
                    updateCommitment: ['']
                }
            },
            "@context": ""
        }
    }

}