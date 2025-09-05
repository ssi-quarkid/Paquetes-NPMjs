import { VerifiableCredential } from "@quarkid/vc-core";
import { Agent } from "../agent";
import { DID } from "../models/did";
export interface IStatusListAgentPlugin {
    canHandle(input: IStatusListPluginMessage): Promise<boolean>;
    handle(input: IStatusListPluginMessage): Promise<void>;
    initialize(params: {
        agent: Agent;
    }): Promise<void>;
}
export interface IStatusListPluginMessage {
    vc: VerifiableCredential;
    issuerDID: DID;
}
