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
exports.Agent = void 0;
const kms_client_1 = require("@quarkid/kms-client");
const kms_core_1 = require("@quarkid/kms-core");
const vc_protocol_not_found_1 = require("./exceptions/vc-protocol-not-found");
const messaging_1 = require("./messaging/messaging");
const agent_identity_1 = require("./models/agent-identity");
const agent_kms_1 = require("./models/agent-kms");
const did_1 = require("./models/did");
const plugin_dispatcher_1 = require("./plugins/plugin-dispatcher");
const transport_1 = require("./transport/transport");
const vc_1 = require("./vc/vc");
const lite_event_1 = require("./utils/lite-event");
class Agent {
    get messaging() {
        return this._messaging;
    }
    get vc() {
        if (!this.identity.getOperationalDID()) {
            throw new Error("You need to create a DID first");
        }
        if (!this._vc) {
            this._vc = new vc_1.VC({
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
        return this._vc;
    }
    get transport() {
        return this.agentTransport;
    }
    get agentInitialized() { return this.onAgentInitialized.expose(); }
    constructor(params) {
        this.onAgentInitialized = new lite_event_1.LiteEvent();
        this.verificationRules = [];
        this.agentSecureStorage = params.secureStorage;
        this.vcStorage = params.vcStorage;
        this.agentSecureStorage = params.secureStorage;
        this.agentStorage = params.agentStorage;
        this.pluginDispatcher = new plugin_dispatcher_1.PluginDispatcher(params.agentPlugins.filter(x => x.canHandle));
        this.vcProtocols = params.vcProtocols;
        if (!params.didDocumentResolver) {
            throw new Error("didDocumentResolver is required. You can define a custom resolver that extends AgentDocumentResolver interface or set an universal resolver endpoint URL.");
        }
        if (!params.didDocumentRegistry) {
            throw new Error("didDocumentRegistry is required. You can define a custom registry that extends AgentDocumentRegistry interface or set a modena endpoint URL.");
        }
        this.resolver = params.didDocumentResolver;
        this.registry = params.didDocumentRegistry;
        this.kms = new kms_client_1.KMSClient({
            lang: params.mnemonicLang || kms_core_1.LANG.en,
            storage: this.agentSecureStorage,
            didResolver: (did) => this.resolver.resolve(did_1.DID.from(did)),
            mobile: false,
        });
        this.identity = new agent_identity_1.AgentIdentity({
            agentStorage: this.agentStorage,
            kms: this.kms,
            registry: this.registry,
            resolver: this.resolver,
        });
        this.registry.initialize({ kms: this.kms });
        this.agentKMS = new agent_kms_1.AgentKMS({
            identity: this.identity,
            kms: this.kms,
            resolver: this.resolver
        });
        this.agentTransport = new transport_1.AgentTransport({
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
    addVerificationRules(v) {
        return __awaiter(this, void 0, void 0, function* () {
            this.verificationRules.push(v);
        });
    }
    initialize(params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.identity.initialize({
                operationalDID: params === null || params === void 0 ? void 0 : params.operationalDID,
                registry: this.registry,
                resolver: this.resolver,
            });
            if (this.plugins) {
                yield Promise.all(this.plugins.map((x) => __awaiter(this, void 0, void 0, function* () { return yield x.initialize({ agent: this }); })));
            }
            if (this.credentialStatusPlugins && this.credentialStatusPlugins.length > 0) {
                this.initializeStatusListPlugins();
            }
            if (!this._vc) {
                this._vc = new vc_1.VC({
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
            this._messaging = new messaging_1.Messaging({
                kms: this.kms,
                identity: this.identity,
                resolver: this.resolver,
                registry: this.registry,
                transport: this.agentTransport,
            });
            this.agentTransport.messageArrived.on((data) => __awaiter(this, void 0, void 0, function* () {
                yield this.processMessage({
                    message: data.message,
                    transport: data.transport,
                    contextMessage: data.contextMessage
                });
            }));
            this.onAgentInitialized.trigger();
        });
    }
    initializeStatusListPlugins() {
        return __awaiter(this, void 0, void 0, function* () {
            const ensureDIDCreated = () => __awaiter(this, void 0, void 0, function* () {
                if (this.identity.getDIDs().length > 0)
                    return;
                return new Promise((resolve, reject) => {
                    const didCreatedEvent = () => {
                        resolve();
                        this.identity.didCreated.off(didCreatedEvent);
                    };
                    this.identity.didCreated.on(didCreatedEvent);
                });
            });
            yield ensureDIDCreated();
            for (let cs of this.credentialStatusPlugins) {
                this.vc.addCredentialStatusStrategy(cs);
                cs.initialize({ agent: this });
            }
        });
    }
    processMessage(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.vc.processMessage(params);
            }
            catch (error) {
                if (error instanceof vc_protocol_not_found_1.VCProtocolNotFoundError) {
                    const response = yield this.pluginDispatcher.dispatch({
                        message: params.message,
                        contextMessage: params.contextMessage
                    });
                    if (response) {
                        yield this.agentTransport.sendMessage({
                            message: response.message,
                            to: response.to,
                            messageContext: params.contextMessage,
                            preferredTransport: params.transport
                        });
                    }
                }
                else {
                    throw error;
                }
            }
        });
    }
}
exports.Agent = Agent;
//# sourceMappingURL=agent.js.map