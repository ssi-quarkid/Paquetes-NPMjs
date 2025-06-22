import { KMSStorage } from "@extrimian/kms-core";
import * as Vault from "hashi-vault-js";

type LoginWithAppRoleResponse = {
  client_token: string;
  accessor: string;
  token_policies: string[];
  metadata: Record<string, any> | null;
  lease_duration: number;
  renewable: boolean;
};
type ListKVSecretsResponse = {
  keys: string[];
};

export class KMSVaultStorage implements KMSStorage {
  private vault_token: string;
  private vault: Vault;
  private renewInterval: NodeJS.Timeout;
  private readonly roleId: string;
  private readonly secretId: string;
  private readonly expirationThresholdMillis: number;

  constructor(params: {
    roleId: string;
    secretId: string;
    vaultUrl: string;
    rootPath?: string;
    expirationThresholdMillis?: number;
  }) {
    this.vault_token = "";
    this.roleId = params.roleId;
    this.secretId = params.secretId;
    this.expirationThresholdMillis =
      params.expirationThresholdMillis || 60000 * 10;
    this.vault = new Vault({
      https: false,
      baseUrl: params.vaultUrl,
      rootPath: params.rootPath || "secret",
      cacert: undefined,
      cert: undefined,
      key: undefined,
      timeout: undefined,
    });
  }

  async init(): Promise<void> {
    try {
      this.vault_token = await this.getVaultToken();
    } catch (err: any) {
      console.error("Vault storage initialization failed");
      throw err;
    }
  }

  private async getVaultToken() {
    if (!this.vault_token) {
      try{
        const login = (await this.vault.loginWithAppRole(
          this.roleId,
          this.secretId,
          "auth/approle"
        )) as LoginWithAppRoleResponse;
        this.vault_token = login.client_token;
        this.scheduleRenewal(login.lease_duration * 1000);
      }catch(e){console.log('Error login with app role: ' , e)}
    }

    return this.vault_token;
  }

  private scheduleRenewal(ttlMillis: number): void {
    this.renewInterval = setInterval(async () => {
      const renew = (await this.vault.loginWithAppRole(
        this.roleId,
        this.secretId,
        "auth/approle"
      )) as LoginWithAppRoleResponse;
      this.vault_token = renew.client_token;
    }, ttlMillis - this.expirationThresholdMillis);
  }

  async add(key: string, data: any): Promise<void> {
    const token: string = await this.getVaultToken();
    await this.vault.createKVSecret(token, key, data);
  }
  async get(key: string): Promise<any> {
    const token: string = await this.getVaultToken();
    const secret = (await this.vault.readKVSecret(token, key)) as any;
    return secret.data;
  }
  async getAll(): Promise<Map<string, any>> {
    const token: string = await this.getVaultToken();
    let listOfSecrets: string[];
    try {
      listOfSecrets = (
        (await this.vault.listKVSecrets(token, "/")) as ListKVSecretsResponse
      ).keys;
    } catch (err: any) {
      if (err.isVaultError && err.response.status === 404) {
        return new Map<string, any>();
      } else {
        throw err;
      }
    }
    const result: Map<string, any> = new Map<string, any>();
    for (const key of listOfSecrets) {
      try {
        const data: any = await this.get(key);
        result.set(key, data);
      } catch (err: any) {
        if (
          !err.vaultHelpMessage ||
          !err.vaultHelpMessage.startsWith("Invalid path.")
        ) {
          throw err;
        }
      }
    }
    return result;
  }

  async update(key: string, data: any) {
    const token = await this.getVaultToken();
    await this.vault.updateKVSecret(token, key, data, undefined);
  }
  async remove(key: string) {
    const token: string = await this.getVaultToken();
    await this.vault.eliminateKVSecret(token, key);
  }
}
