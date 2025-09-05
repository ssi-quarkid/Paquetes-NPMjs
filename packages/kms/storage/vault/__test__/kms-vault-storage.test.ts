import { KMSVaultStorage } from "../src/services/kms-vault-storage"
import { BaseConverter, Base } from "@quarkid/kms-core";
import { LANG, Suite } from "@quarkid/kms-core";

const roleId = "a237ad8e-cbdc-bd21-be0d-72721955d5b4"
const secretId = "df3e3579-0e90-e388-2cf7-d1a3d12db38d"
const vaultUrl = "http://20.231.113.193:8200/v1"
const rootPath = 'testing'

jest.setTimeout(50000)

describe("Storage", () => {
    it("Create secret", async () => {
        const storage = new KMSVaultStorage({
            roleId: roleId,
            secretId: secretId,
            vaultUrl: vaultUrl,
            rootPath: rootPath
        })

        await storage.add("Test1", {"data":"foo"});
        const secrets = await storage.getAll();
        expect(secrets.size === 1);
    })

    it ("Remove secret", async () => {
        const storage = new KMSVaultStorage({
            roleId: roleId,
            secretId: secretId,
            vaultUrl: vaultUrl,
            rootPath: rootPath
        })

        await storage.remove("Test1");
        const secrets = await storage.getAll();
        expect(secrets.size === 0);
    })

    it ("Create Secret, Update it multiple times and remove", async () => {
        const storage = new KMSVaultStorage({
            roleId: roleId,
            secretId: secretId,
            vaultUrl: vaultUrl,
            rootPath: rootPath
        })

        await storage.add("Test2", {"data":"foo"})
        await storage.update("Test2", {"data":"bar"})
        await storage.update("Test2", {"data": "boo"})

        let secrets = await storage.getAll()
        expect(secrets.size === 1)

        const result = await storage.get("Test2")
        expect(result.data === "boo")

        await storage.remove("Test2")
        secrets = await storage.getAll()
        expect(secrets.size === 0)
    })
})