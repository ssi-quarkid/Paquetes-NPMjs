import {
  Agent,
  DID,
  IAgentPlugin,
  IAgentPluginMessage,
  IAgentPluginResponse,
  IStatusListAgentPlugin,
  IStatusListPluginMessage,
} from '@quarkid/agent';
import { QuarkIDCredentialStatus, PersistanceType } from '../models/quarkid-credential-status';
import axios from "axios";
import { BitArray } from '../models/bit-array';
import { IStorage } from '@quarkid/agent/dist/models/agent-storage';

export class ExtrimianStatusListAgentPlugin implements IStatusListAgentPlugin {
  private agent: Agent;
  private currentBitArray: BitArray;

  // private onStatusListPublished: LiteEvent<{}>
  // private onUserLoggedIn: LiteEvent<{ invitationId: string, did: string }> = new LiteEvent();
  // public get userLoggedIn() { return this.onUserLoggedIn.expose(); }

  private pluginStorage: IStorage;
  private vslApiUrl: string;
  private bitArraySC: string;

  constructor(opts: {
    pluginStorage: IStorage,
    vslApiURL: string,
    bitArraySC: string,
  }) {
    this.pluginStorage = opts.pluginStorage;
    this.vslApiUrl = opts.vslApiURL.endsWith('/') ? opts.vslApiURL.slice(0, -1) : opts.vslApiURL;
    this.bitArraySC = opts.bitArraySC;
  }

  async canHandle(input: IStatusListPluginMessage): Promise<boolean> {
    return true;
  }

  async handle(input: IStatusListPluginMessage): Promise<void> {
    const cs = new QuarkIDCredentialStatus();

    let index = await this.getIndexFromBitArray(this.currentBitArray);

    cs.type = "bitArrayStatusEntry";
    cs.persistanceType = PersistanceType.IPFS;
    cs.bitArrayIndex = index;
    cs.bitArraySC = this.bitArraySC;
    cs.bitArrayID = this.currentBitArray.id;

    input.vc.credentialStatus = cs;
  }

  async initialize(params: { agent: Agent }): Promise<void> {
    this.agent = params.agent;

    const bitArrays = await this.getBitArrays();

    if (!bitArrays || (bitArrays && bitArrays.length == 0)) {
      await this.createNewBitArray();
    }

    this.currentBitArray = await this.getLastBitArray();
  }

  private async getBitArrays(): Promise<BitArray[]> {
    return await this.pluginStorage.get("bit-array") || [];
  }

  private async getLastBitArray(): Promise<BitArray> {
    let bitArrays = await this.getBitArrays();
    if (bitArrays.length == 0) return null;
    return bitArrays[bitArrays.length - 1];
  }

  private async saveBitArrays(bitArrays: BitArray[]): Promise<void> {
    await this.pluginStorage.add("bit-array", bitArrays);
  }

  private async createNewBitArray(): Promise<void> {
    let url = `${this.vslApiUrl}/bit-array`;
    let result = (await axios.put(url)).data as { id: string };
    let bitArrays = await this.getBitArrays();
    bitArrays.push(result);
    await this.saveBitArrays(bitArrays);
  }

  private async getIndexFromBitArray(bitArray: BitArray): Promise<number> {
    let url = `${this.vslApiUrl}/bit-array/${bitArray.id}/index`;
    let result = (await axios.put(url)).data as { index: number };
    return result.index;
  }
}
