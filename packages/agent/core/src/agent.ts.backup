import { KMSClient } from "@quarkid/kms-client";
import { IKMS, LANG } from "@quarkid/kms-core";
import { VCProtocolNotFoundError } from "./exceptions/vc-protocol-not-found";
import { Messaging } from "./messaging/messaging";
import { AgentIdentity } from "./models/agent-identity";
import { AgentKMS } from "./models/agent-kms";
import { IAgentRegistry } from "./models/agent-registry";
import { IAgentResolver } from "./models/agent-resolver";
import { AgentSecureStorage } from "./models/agent-secure-storage";
import { IStorage } from "./models/agent-storage";
import { DID } from "./models/did";
import { ITransport } from "./models/transports/transport";
import { IAgentPlugin } from "./plugins/iplugin";
import { PluginDispatcher } from "./plugins/plugin-dispatcher";
import { AgentTransport } from "./transport/transport";
import { VCProtocol } from "./vc/protocols/vc-protocol";
import { VC } from "./vc/vc";
import { LiteEvent } from "./utils/lite-event";
import { IStatusListAgentPlugin } from "./plugins/istatus-list-plugin";
import { AgentPluginBase } from "./plugins/ivc-interceptor-plugin";
import { VerifiableCredential } from "@extrimian/vc-core";

export class Agent {
    private _messaging: Messaging;

    public get messaging(): Messaging {
        return this._messaging;
    }

    private _vc: VC;

    public get vc(): VC {
        if (!this.identity.getOperationalDID()) {
            throw new Error("You need to create a DID first");
        }
        if (!this._vc) {
            this._vc = new VC({
                messaging: this.messaging,
                agentStorage: this.agentStorage,
                vcStorage: this.vcStorage,
                identity: this.identity,
                kms: this.kms,
                resolver: this.resolver,
                transports: this.agentTransport,
                vcProtocols: this.vcProtocols,
                verificationRules: this.verificationRules,
            })
        }
        return this._vc;
    }

    kms: IKMS;

    public identity: AgentIdentity;


    resolver: IAgentResolver;
    registry: IAgentRegistry;
    private agentSecureStorage: AgentSecureStorage;
    private vcStorage: IStorage;
    private agentStorage: IStorage;
    private vcProtocols: VCProtocol[];
    private agentTransport: AgentTransport;
    public agentKMS: AgentKMS;

    public get transport(): AgentTransport {
        return this.agentTransport;
    }

    private credentialStatusPlugins: IStatusListAgentPlugin[];
    private plugins: (IAgentPlugin | AgentPluginBase)[];
    private readonly pluginDispatcher: PluginDispatcher;

    private readonly onAgentInitialized = new LiteEvent<void>();
    public get agentInitialized() { return this.onAgentInitialized.expose(); }

    public verificationRules: ((vc: VerifiableCredential) => Promise<{ result: boolean, rejectDetail?: { name: string, description: string, code: number } }>)[] = [];

    constructor(params: {
        didDocumentResolver: IAgentResolver,
        didDocumentRegistry: IAgentRegistry,
        supportedTransports?: ITransport[],
        secureStorage: AgentSecureStorage,
        agentStorage: IStorage,
        vcStorage: IStorage,
        vcProtocols: VCProtocol[],
        agentPlugins?: (IAgentPlugin | AgentPluginBase)[],
        credentialStatusPlugins?: IStatusListAgentPlugin[],
        mnemonicLang?: LANG
    }) {
        this.agentSecureStorage = params.secureStorage;
        this.vcStorage = params.vcStorage;
        this.agentSecureStorage = params.secureStorage;
        this.agentStorage = params.agentStorage;
        this.pluginDispatcher = new PluginDispatcher(params.agentPlugins.filter(x => (<IAgentPlugin>x).canHandle) as IAgentPlugin[]);
        this.vcProtocols = params.vcProtocols;

        this.kms = new KMSClient({
            lang: params.mnemonicLang || LANG.en,
            storage: this.agentSecureStorage,
            didResolver: (did: string) => this.resolver.resolve(DID.from(did)),
            mobile: false,
        });

        if (!params.didDocumentResolver) {
            throw new Error("didDocumentResolver is required. You can define a custom resolver that extends AgentDocumentResolver interface or set an universal resolver endpoint URL.");
        }

        if (!params.didDocumentRegistry) {
            throw new Error("didDocumentRegistry is required. You can define a custom registry that extends AgentDocumentRegistry interface or set a modena endpoint URL.");
        }

        this.identity = new AgentIdentity({
            agentStorage: this.agentStorage,
            kms: this.kms,
            registry: this.registry,
            resolver: this.resolver,
        });

        this.resolver = params.didDocumentResolver as IAgentResolver;
        this.registry = params.didDocumentRegistry as IAgentRegistry;
        this.registry.initialize({ kms: this.kms as any });

        this.agentKMS = new AgentKMS({
            identity: this.identity,
            kms: this.kms as any,
            resolver: this.resolver
        });

        this.agentTransport = new AgentTransport({
            transports: params.supportedTransports,
            agent: this,
        });

        this.vcProtocols.forEach(vcProtocol => {
            vcProtocol.initialize({
                agent: this,
            });
        });

        this.plugins = params.agentPlugins;
        this.credentialStatusPlugins = params.credentialStatusPlugins;
    }

    async addVerificationRules(v: (vc: VerifiableCredential) => Promise<{ result: boolean, rejectDetail?: { name: string, description: string, code: number } }>) {
        this.verificationRules.push(v);
    }

    async initialize(params?: {
        operationalDID?: DID,
    }) {
        await this.identity.initialize({
            operationalDID: params?.operationalDID,
            registry: this.registry,
            resolver: this.resolver,
        });

        if (this.plugins) {
            await Promise.all(this.plugins.map(async x => await x.initialize({ agent: this })));
        }

        if (this.credentialStatusPlugins && this.credentialStatusPlugins.length > 0) {
            this.initializeStatusListPlugins();
        }

        if (!this._vc) {
            this._vc = new VC({
                messaging: this.messaging,
                agentStorage: this.agentStorage,
                vcStorage: this.vcStorage,
                identity: this.identity,
                kms: this.kms,
                resolver: this.resolver,
                transports: this.agentTransport,
                vcProtocols: this.vcProtocols,
                verificationRules: this.verificationRules,
            });
        }

        this._messaging = new Messaging({
            kms: this.kms as any,
            identity: this.identity,
            resolver: this.resolver,
            registry: this.registry,
            transport: this.agentTransport,
        });

        this.agentTransport.messageArrived.on(async (data) => {
            await this.processMessage({
                message: data.message,
                transport: data.transport,
                contextMessage: data.contextMessage
            });
        });

        this.onAgentInitialized.trigger();
    }

    async initializeStatusListPlugins() {
        const ensureDIDCreated = async () => {
            if (this.identity.getDIDs().length > 0) return;

            return new Promise<void>((resolve, reject) => {

                const didCreatedEvent = () => {
                    resolve();
                    this.identity.didCreated.off(didCreatedEvent);
                }

                this.identity.didCreated.on(didCreatedEvent)
            });
        }

        await ensureDIDCreated();

        for (let cs of this.credentialStatusPlugins) {
            this.vc.addCredentialStatusStrategy(cs);
            cs.initialize({ agent: this });
        }
    }

    async processMessage(params: {
        message: any,
        transport?: ITransport
        contextMessage?: any
    }) {
        try {
            await this.vc.processMessage(params)
        } catch (error) {
            if (error instanceof VCProtocolNotFoundError) {
                const response = await this.pluginDispatcher.dispatch(
                    {
                        message: params.message,
                        contextMessage: params.contextMessage
                    });

                if (response) {
                    await this.agentTransport.sendMessage({
                        message: response.message,
                        to: response.to,
                        messageContext: params.contextMessage,
                        preferredTransport: params.transport
                    });
                }
            } else {
                throw error;
            }
        }
    }
}