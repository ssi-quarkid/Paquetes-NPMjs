import { IKMS, LANG } from "@quarkid/kms-core";
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
import { AgentTransport } from "./transport/transport";
import { VCProtocol } from "./vc/protocols/vc-protocol";
import { VC } from "./vc/vc";
import { IStatusListAgentPlugin } from "./plugins/istatus-list-plugin";
import { AgentPluginBase } from "./plugins/ivc-interceptor-plugin";
import { VerifiableCredential } from "@extrimian/vc-core";
export declare class Agent {
    private _messaging;
    get messaging(): Messaging;
    private _vc;
    get vc(): VC;
    kms: IKMS;
    identity: AgentIdentity;
    resolver: IAgentResolver;
    registry: IAgentRegistry;
    private agentSecureStorage;
    private vcStorage;
    private agentStorage;
    private vcProtocols;
    private agentTransport;
    agentKMS: AgentKMS;
    get transport(): AgentTransport;
    private credentialStatusPlugins;
    private plugins;
    private readonly pluginDispatcher;
    private readonly onAgentInitialized;
    get agentInitialized(): import("./utils/lite-event").ILiteEvent<void>;
    verificationRules: ((vc: VerifiableCredential) => Promise<{
        result: boolean;
        rejectDetail?: {
            name: string;
            description: string;
            code: number;
        };
    }>)[];
    constructor(params: {
        didDocumentResolver: IAgentResolver;
        didDocumentRegistry: IAgentRegistry;
        supportedTransports?: ITransport[];
        secureStorage: AgentSecureStorage;
        agentStorage: IStorage;
        vcStorage: IStorage;
        vcProtocols: VCProtocol[];
        agentPlugins?: (IAgentPlugin | AgentPluginBase)[];
        credentialStatusPlugins?: IStatusListAgentPlugin[];
        mnemonicLang?: LANG;
    });
    addVerificationRules(v: (vc: VerifiableCredential) => Promise<{
        result: boolean;
        rejectDetail?: {
            name: string;
            description: string;
            code: number;
        };
    }>): Promise<void>;
    initialize(params?: {
        operationalDID?: DID;
    }): Promise<void>;
    initializeStatusListPlugins(): Promise<void>;
    processMessage(params: {
        message: any;
        transport?: ITransport;
        contextMessage?: any;
    }): Promise<void>;
}
