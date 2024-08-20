# Extrimian Agent

The Extrimian agent solves basic self-sovereign identity problems.

It allows creating DIDs, configuring services such as DWN, setting up protocols for credential transfer (WACI), and automating flows. Through events, it enables identifying when a credential is received and when it is presented (also reporting the result of the presentation).

## Examples of component usage

### 1. Instantiate the Agent
First, you must configure the credential exchange protocols (for example, WACI). This configuration allows you to define which credentials this agent will issue and which credentials it will present when requested.

```javascript
// The agent needs to preconfigure credential exchange protocols. At this point, you should also configure the credentials that this agent will issue.
// If the agent is not going to receive or issue credentials, does not expect to verify them or receive them, it is not necessary to configure the WACIProtocol. In that case, an empty object is sent in the constructor. This scenario is not usually useful, however, it can serve to quickly test the agent.
const waciProtocol = new WACIProtocol({});
```

If you are instantiating an agent that generates credentials, it is necessary to configure the waciProtocol. An example configuration could be as follows:

```javascript
waciProtocol = new WACIProtocol({
    issuer: {
        issueCredentials: async (waciInvitationId: string, holderId: string) => {
            return new WACICredentialOfferSucceded({
                credentials: [{
                    credential: {
                        "@context": [
                            "https://www.w3.org/2018/credentials/v1",
                            "https://www.w3.org/2018/credentials/examples/v1",
                            "https://w3id.org/security/bbs/v1"
                        ],
                        id: "http://example.edu/credentials/58473",
                        type: [
                            "VerifiableCredential",
                            "AlumniCredential"
                        ],
                        issuer: issuerDID,
                        issuanceDate: new Date(),
                        credentialSubject: {
                            id: holderId,
                            givenName: "John",
                            familyName: "Doe"
                        }
                    },
                    outputDescriptor: {
                        id: "alumni_credential_output",
                        schema: "https://schema.org/EducationalOccupationalCredential",
                        display: {
                            title: {
                                path: [
                                    "$.name",
                                    "$.vc.name"
                                ],
                                fallback: "Alumni Credential"
                            },
                            subtitle: {
                                path: [
                                    "$.class",
                                    "$.vc.class"
                                ],
                                fallback: "Alumni"
                            },
                            description: {
                                "text": "Credential that allows validating that they are a student of the institution"
                            },
                        },
                        styles: {                                
                            background: {
                                color: "#ff0000"
                            },
                            thumbnail: {
                                uri: "https://dol.wa.com/logo.png",
                                alt: "National University"
                            },
                            hero: {
                                uri: "https://dol.wa.com/alumnos.png",
                                alt: "University students"
                            },
                            text: {
                                color: "#d4d400"
                            }
                        }
                    }
                }],
                issuer: {
                    name: "National University",
                    styles: {
                        thumbnail: {
                            uri: "https://dol.wa.com/logo.png",
                            alt: "National University"
                        },
                        hero: {
                            uri: "https://dol.wa.com/alumnos.png",
                            alt: "University students"
                        },
                        background: {
                            color: "#ff0000"
                        },
                        text: {
                            color: "#d4d400"
                        }
                    }
                },
                options: {
                    challenge: "508adef4-b8e0-4edf-a53d-a260371c1423",
                    domain: "9rf25a28rs96"
                },
            });
        }
    },
});
```

If you want to verify credentials, you'll need to configure the waciProtocol for that purpose and restrict the credentials that can be presented to you as a verifier.

```javascript
verifier: {
    presentationDefinition: async (invitationId: string) => {
        return {
            frame: {
                "@context": [
                    "https://www.w3.org/2018/credentials/v1",
                    "https://www.w3.org/2018/credentials/examples/v1",
                    "https://w3id.org/security/bbs/v1"
                ],
                "type": [
                    "VerifiableCredential",
                    "AlumniCredential"
                ],
                "credentialSubject": {
                    "@explicit": true,
                    "type": [
                        "AlumniCredential"
                    ],
                    "givenName": {},
                    "familyName": {}
                }
            },
            inputDescriptors: [
                {
                    id: "Alumni Credential",
                    name: "AlumniCredential",
                    constraints: {
                        fields: [
                            {
                                path: [
                                    "$.credentialSubject.givenName"
                                ],
                                filter: {
                                    type: "string"
                                }
                            },
                            {
                                path: [
                                    "$.credentialSubject.familyName"
                                ],
                                filter: {
                                    type: "string"
                                }
                            }
                        ]
                    }
                }
            ],
        }
    }
}
```

To configure the holder's behavior, you can optionally configure the waciProtocol. As a holder, you must select which of the credentials being requested in the flow you want to present. By default, if you don't configure this behavior, the agent will send the first one that applies (since more than one may apply to the restrictions applied by the verifier).

```javascript
const holderWaciProtocol = new WACIProtocol({
    holder: {
        selectVcToPresent: async (vcs: VerifiableCredential[]) => {
            return vcs;
        }
    },
});
```

The agent requires that storage behaviors be defined. Whoever implements the agent must decide how the data will be stored. For this, they must implement the IAgentStorage and IAgentSecureStorage interfaces. Below is an example that implements the storages in the filesystem. This code is for example purposes and serves for development testing. In production, it is recommended to implement AgentSecureStorage that stores data in a Vault. These storages must then be passed in the agent constructor mandatorily.

```javascript
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { IAgentStorage } from '@extrimian/agent';

export class FileSystemStorage implements IAgentStorage {
    public readonly filepath: string;

    constructor(params: {
        filepath: string
    }) {
        this.filepath = params.filepath;
    }

    async update<T>(key: string, value: T): Promise<void> {
        const map = this.getData();
        map.set(key, value as T);
        this.saveData(map);
    }

    async getAll<T>(): Promise<Map<string, any>> {
        return this.getData();
    }

    async remove(key: string): Promise<void> {
        const map = this.getData();
        map.delete(key);
        this.saveData(map);
    }

    async add(key: string, data: any): Promise<void> {
        const map = this.getData();
        map.set(key, data);
        this.saveData(map);
    }

    async get(key: string): Promise<any> {
        return this.getData().get(key);
    }

    private getData(): Map<string, any> {
        if (!existsSync(this.filepath)) {
            return new Map();
        }

        const file = readFileSync(this.filepath, {
            encoding: "utf-8",
        });

        if (!file) {
            return new Map();
        }

        return new Map(Object.entries(JSON.parse(file)));
    }

    private saveData(data: Map<string, any>) {
        writeFileSync(this.filepath, JSON.stringify(Object.fromEntries(data)), {
            encoding: "utf-8",
        });
    }
}
```

```javascript
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { AgentSecureStorage } from '@extrimian/agent';

export class FileSystemAgentSecureStorage implements AgentSecureStorage {
    public readonly filepath: string;


    constructor(params: {
        filepath: string
    }) {
        this.filepath = params.filepath;
    }

    async add(key: string, data: any): Promise<void> {
        const map = this.getData();
        map.set(key, data);
        this.saveData(map);
    }

    async get(key: string): Promise<any> {
        return this.getData().get(key);
    }

    async getAll(): Promise<Map<string, any>> {
        return this.getData();
    }

    update(key: string, data: any) {
        const map = this.getData();
        map.set(key, data);
        this.saveData(map);
    }

    remove(key: string) {
        const map = this.getData();
        map.delete(key);
        this.saveData(map);
    }

    private getData(): Map<string, any> {
        if (!existsSync(this.filepath)) {
            return new Map();
        }

        const file = readFileSync(this.filepath, {
            encoding: "utf-8",
        });

        if (!file) {
            return new Map();
        }

        return new Map(Object.entries(JSON.parse(file)));
    }

    private saveData(data: Map<string, any>) {
        writeFileSync(this.filepath, JSON.stringify(Object.fromEntries(data)), {
            encoding: "utf-8",
        });
    }
}
```

Once the WACIProtocol that defines the agent's behavior regarding credentials is configured, you must instantiate the Agent itself:

```javascript
// Create a new instance of the agent, you must pass the protocols to be used for VC generation (for example, the WACIProtocol we defined earlier)
agent = new Agent({
    didDocumentRegistry: new AgentModenaUniversalRegistry("http://modena.gcba-extrimian.com:8080"),
    didDocumentResolver: new AgentModenaUniversalResolver("http://modena.gcba-extrimian.com:8080"),
    vcProtocols: [waciProtocol],
});
```

Regarding the registry and resolver, you must define Modena nodes or proxies that allow you to reach a Universal Modena Resolver or a Universal Modena Registry.

```javascript
// Always, first, you must initialize the agent to begin operating. This configures internal classes that are required to function.
await agent.initialize();
```

To create a new DID, you can invoke the following function:

```javascript
const did = await agent.identity.createNewDID({
    dwnUrl: dwnUrl
});
```

At this point, you can define some key services and configurations, such as your DWN URL.

The process of creating a DID is asynchronous, which is why the agent will notify you when the DID has been created through the following event:

```javascript
agent.identity.didCreated.on(async args => {
    console.log(args.did);
});
```

Once the DID has been created, you can operate with the agent.

### 2. (ISSUER) Create invitation for credential generation
As an Issuer, you can generate a message that will function as an invitation to initiate the credential generation flow for a holder.

For this, you can invoke the following code:

```javascript
const invitationMessage = await issuerAgent.vc.createInvitationMessage({ flow: CredentialFlow.Issuance })
```

This message can be converted into a QR code and subsequently processed by the holder's Agent that will initiate the WACI flow for credential exchange.

To process this first invitation message with the Extrimian agent, the holder can call the processMessage method, which will initiate the flow that will continue automatically.

### 3. (HOLDER) Process invitation message for credential generation

```javascript
holderAgent.vc.processMessage({
    message: invitationMessage
});
```

On the other hand, the holder must configure the event to know when a credential was generated.

```javascript
holderAgent.vc.credentialArrived.on((vc) => {
    holderAgent.vc.saveCredential(vc);
});
```

The generation of a credential does not necessarily imply that the holder must save it, which is why within that event, the holder can invoke the saveCredential method to persist the VC among their credentials.

### 4. (VERIFIER) Create invitation for credential verification
Just as the Issuer generates the invitation message for issuance, the verifier must create the flow for credential presentation...

```javascript
const presentationMessage = verifierAgent.vc.createInvitationMessage({ flow: CredentialFlow.Presentation }),
```

In the same way that the issuer could do, the presentation invitation message can be converted to a QR code so that the holder can scan it and begin the presentation flow by sending the message to be processed.

The verifier will know when the presentation flow has finished through an event that will return the presented credential and the flow result (valid or invalid), both for the presentation validations and for the credential itself:

```javascript
issuerAgent.vc.credentialPresented.on((args) => {
    expect(args.vcVerified).toBe(true);
    expect(args.presentationVerified).toBe(true); 
    console.log(args.vc);    
});
```