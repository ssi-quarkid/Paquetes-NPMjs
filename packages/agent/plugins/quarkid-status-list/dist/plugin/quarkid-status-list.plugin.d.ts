import { Agent, IStatusListAgentPlugin, IStatusListPluginMessage } from '@quarkid/agent';
import { IStorage } from '@quarkid/agent/dist/models/agent-storage';
export declare class ExtrimianStatusListAgentPlugin implements IStatusListAgentPlugin {
    private agent;
    private currentBitArray;
    private pluginStorage;
    private vslApiUrl;
    private bitArraySC;
    constructor(opts: {
        pluginStorage: IStorage;
        vslApiURL: string;
        bitArraySC: string;
    });
    canHandle(input: IStatusListPluginMessage): Promise<boolean>;
    handle(input: IStatusListPluginMessage): Promise<void>;
    initialize(params: {
        agent: Agent;
    }): Promise<void>;
    private getBitArrays;
    private getLastBitArray;
    private saveBitArrays;
    private createNewBitArray;
    private getIndexFromBitArray;
}
