import { Agent } from "../agent";
import { DID } from "../models/did";
import { DWNTransport } from "../models/transports/dwn-transport";
import { ITransport, MessageArrivedEventArg } from "../models/transports/transport";
import { LiteEvent } from "../utils/lite-event";
const LRU = require('lru-cache');

export class AgentTransport {
    private cacheStorage;

    private readonly onMessageArrived = new LiteEvent<{ message: any, transport: ITransport, contextMessage: any }>();
    public get messageArrived() { return this.onMessageArrived.expose(); }

    private readonly onConnected = new LiteEvent<{ did: DID }>();
    public get connected() { return this.onConnected.expose(); }

    private readonly onDisconnected = new LiteEvent<{ did: DID }>();
    public get disconnected() { return this.onDisconnected.expose(); }

    transports: ITransport[];
    agent: Agent;

    constructor(params: {
        agent: Agent,
        transports?: ITransport[],
    }) {
        this.cacheStorage = new LRU({ ttl: 1000 *  30, checkperiod: 120 });

        this.agent = params.agent;
        if (!params.transports) {
            params.transports = Array<ITransport>();
            params.transports.push(new DWNTransport());
        }

        params.agent.identity.identityInitialized.on(async () => {
            await Promise.all(this.transports.map(async transport => await transport.initialize({
                agent: params.agent
            })));
        });

        this.transports = params.transports;
    }

    async handleConnect(
        params?: { did: DID }
    ) {
        this.onConnected.trigger(
            {
                did: params.did
            }
        );
    }

    async handleDisconnect(params?: { did: DID }) {
        this.onDisconnected.trigger({
            did: params.did
        });
    }

    async handleMessage(
        params: MessageArrivedEventArg,
        transport: ITransport
    ) {
        console.info("Message arrived using", transport.constructor?.name)
        const unpackedMessage = await this.agent.messaging.unpackMessage({
            message: params.data,
        });

        if (unpackedMessage?.id) {
            this.cacheStorage.set(unpackedMessage.id, transport.constructor.name);
        }

        this.onMessageArrived.trigger({
            message: unpackedMessage,
            transport: transport,
            contextMessage: params.context
        });
    }

    addTransports(transport: ITransport) {

    }

    getTranportByMessageId(messageId: string) {
        const transportName = (this.cacheStorage.get(messageId) as any);
        if (transportName != null) {
            return this.transports.find(x => x.constructor.name == transportName);
        }
        return null;
    }

    async sendMessage(params: { to: DID, from?: DID, message: any, preferredTransport?: ITransport, messageContext?: any }) {

        if (params.preferredTransport) {
            const result = await this.sendMessageUsingTransport({
                to: params.to,
                from: params.from,
                transport: params.preferredTransport,
                messageContext: params.messageContext,
                message: params.message
            });

            if (result) return;
        }

        for (let transport of this.transports) {
            if (!params.preferredTransport || transport != params.preferredTransport) {
                if (await transport.transportSupportedByTarget({ targetDID: params.to })) {
                    const result = await this.sendMessageUsingTransport({
                        to: params.to,
                        from: params.from,
                        transport: transport,
                        messageContext: params.messageContext,
                        message: params.message
                    });

                    if (result) return;
                }
            }
        }

        console.info(`The message could not be sent to ${params.to.value} because the transport layers have thrown errors or because the DIDs do not share common transport layers.`);
    }

    private async sendMessageUsingTransport(params: { to: DID, from?: DID, message: any, transport?: ITransport, messageContext?: any }) {
        try {
            console.info("Sending message to", params.to.value, "using", params.transport?.constructor?.name)

            await params.transport.send({
                data: params.message,
                to: params.to,
                from: params.from,
                context: params.messageContext
            });

            return true;
        }
        catch (ex) {
            console.error(`Error sending message to ${params.to.value} using ${params.transport?.constructor?.name}.`);
            return false;
        }
    }
}