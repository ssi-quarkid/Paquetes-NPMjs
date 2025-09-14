import { MockAgent } from "./mock/mock-agent";
import { MemoryMessageStorage } from "./mock/message-mock-storage";
import { MessageStorage } from "../src";
import { ContentType , PlsACKOnValues , ACKStatus, MessageTypes} from "@quarkid/ami-core";
import { AMISDK } from "../src";
import { FileSystemStorage } from "./mock/filesystem-storage";
import { MemoryStorage } from "./mock/memory-storage";


jest.setTimeout(1000000);

async function clearStorage( storage: FileSystemStorage){
    let all = await storage.getAll()
    let keys = Array.from(all.keys())
    Promise.all(
        keys.map(x => storage.remove(x))
    )
}

describe("Sdk tests",   () => {
    describe("Standard message test", () => 
        it("Flow test", async () => {
            //Step 1: preparation:
            //setting agent and mock storages
            const issuerAgent = new MockAgent('did:test:issuer')
            const holderAgent = new MockAgent('did:test:holder')
            const issuerAgentStorage = new MemoryMessageStorage()
            const holderAgentStorage = new MemoryMessageStorage()
            const holderAgentChatIStorage = new MemoryStorage()
            const issuerAgentChatIStorage = new MemoryStorage()
            //setting sdk
            const issuerAMISDK = new AMISDK(issuerAgent.operationalDid ,  issuerAgent.didCommPack , issuerAgent.didCommUnpack,issuerAgentStorage , issuerAgentChatIStorage);
            const holderAMISDK = new AMISDK(holderAgent.operationalDid , holderAgent.didCommPack , holderAgent.didCommUnpack, holderAgentStorage, holderAgentChatIStorage );
            
            //setting event handlers
            let issuerMessages = []
            let issuerAcks = []
            let issuerProblems = []
            issuerAMISDK.standardMessage.on( (data) => issuerMessages.push(data))
            issuerAMISDK.problemReport.on( (data) => issuerProblems.push(data))
            issuerAMISDK.messageAck.on( (data) => issuerAcks.push(data))

            let holderMessages = []
            let holderAcks = []
            let holderProblems = []
            holderAMISDK.standardMessage.on( (data) => holderMessages.push(data))
            holderAMISDK.problemReport.on( (data) => holderProblems.push(data))
            holderAMISDK.messageAck.on( (data) => holderAcks.push(data))

            //Step 2: message setup
            let body = { contentType: ContentType.TEXT , data: "Hello holder!" }
            let ackResponseOn = [PlsACKOnValues.RECEIPT] 
            let to = [ holderAgent.operationalDid ]
            let thid = undefined
            const unpackedStandardMessage = await issuerAMISDK.createStandardMessage(body, to , thid, ackResponseOn );
        
            //check if message is correctly formed
            expect(await issuerAMISDK.isMessageUnpacked(unpackedStandardMessage)).toBe(true)

            //Save thid for late
            thid = unpackedStandardMessage.thid;

            //Step 3: pack the message and simulate transport
            const packed = await issuerAgent.didCommPack(holderAgent.operationalDid,unpackedStandardMessage);
                // packed ---> dwn holder ---> holder sdk
            const response = await holderAMISDK.processMessage(packed.packedMessage);
            const responseMessage = response.packedMessage

            //Step 5: Send the ack back || holder ---> dwn issuer ---> issuer sdk

            //expect it to be a correctly formed ack

            expect(await issuerAMISDK.isMessage(responseMessage)).toBe(true)

            let unpackedResponse = issuerAgent.didCommUnpack(responseMessage);
            expect(unpackedResponse.type).toBe(MessageTypes.ACK)
            expect(unpackedResponse.body.status === ACKStatus.OK).toBe( true)

            const response2 = await issuerAMISDK.processMessage(response.packedMessage )         
            expect(response2?.packedMessage).toBeUndefined()

            //Step 6: check events
            expect(issuerMessages.length).toBe(0)
            expect(issuerAcks.length).toBe(1)
            expect(issuerProblems.length).toBe(0)
            
            expect(holderMessages.length).toBe(1)
            expect(holderAcks.length).toBe(0)
            expect(holderProblems.length).toBe(0)
            
            //check message event
            let holderMessage = holderMessages.pop();
            expect(holderMessage.messageId === unpackedStandardMessage.id).toBe(true)
            expect(holderMessage.did === issuerAgent.operationalDid).toBe(true)
            expect(holderMessage.body.contentType === unpackedStandardMessage.body.contentType).toBe(true)
            expect(holderMessage.body.data === unpackedStandardMessage.body.data).toBe(true)
            //check ack event
            let issuerAck = issuerAcks.pop()
            expect(issuerAck.did === holderAgent.operationalDid).toBe(true)
            expect(issuerAck.status).toBe(ACKStatus.OK)
            expect(issuerAck.messageId === unpackedResponse.id).toBe(true)
            
        }
        )
    )

    describe("Standard message with IStorage", () =>
        it("Flow test", async () => {
            //Step 1: preparation:
            //setting agent and mock storages
            const issuerAgent = new MockAgent('did:test:issuer')
            const holderAgent = new MockAgent('did:test:holder')
            const issuerIStorageMessages = new FileSystemStorage({ filepath:'./__test__/data/sdk-tests/issuer-message-storage.json'})
            const issuerIStorageThreads = new FileSystemStorage({filepath:'./__test__/data/sdk-tests/issuer-thread-storage.json'})
            const issuerIStorageChat = new FileSystemStorage({filepath:'./__test__/data/storage-tests/issuer-chat-storage.json'})
            const holderIStorageMessages = new FileSystemStorage({filepath:'./__test__/data/sdk-tests/holder-message-storage.json'})
            const holderIStorageThreads = new FileSystemStorage({filepath:'./__test__/data/sdk-tests/holder-thread-storage.json'})
            const holderIStorageChat = new FileSystemStorage({filepath:'./__test__/data/storage-tests/issuer-chat-storage.json'})
            const issuerAgentStorage = new MessageStorage(issuerIStorageMessages,issuerIStorageThreads)
            const holderAgentStorage = new MessageStorage(holderIStorageMessages,holderIStorageThreads)
            //setting sdk
            const issuerAMISDK = new AMISDK(issuerAgent.operationalDid ,  issuerAgent.didCommPack , issuerAgent.didCommUnpack,issuerAgentStorage,issuerIStorageChat);
            const holderAMISDK = new AMISDK(holderAgent.operationalDid , holderAgent.didCommPack , holderAgent.didCommUnpack, holderAgentStorage,holderIStorageChat);
            await clearStorage(issuerIStorageMessages)
            await clearStorage(issuerIStorageThreads)
            await clearStorage(issuerIStorageChat)
            await clearStorage(holderIStorageMessages)
            await clearStorage(holderIStorageThreads)
            await clearStorage(holderIStorageChat)

            //setting event handlers
            let issuerMessages = []
            let issuerAcks = []
            let issuerProblems = []
            issuerAMISDK.standardMessage.on( (data) => issuerMessages.push(data))
            issuerAMISDK.problemReport.on( (data) => issuerProblems.push(data))
            issuerAMISDK.messageAck.on( (data) => issuerAcks.push(data))

            let holderMessages = []
            let holderAcks = []
            let holderProblems = []
            holderAMISDK.standardMessage.on( (data) => holderMessages.push(data))
            holderAMISDK.problemReport.on( (data) => holderProblems.push(data))
            holderAMISDK.messageAck.on( (data) => holderAcks.push(data))

            //Step 2: message setup
            let body = { contentType: ContentType.TEXT , data: "Hello holder!" }
            let ackResponseOn = [PlsACKOnValues.RECEIPT] 
            let to = [ holderAgent.operationalDid ]
            let thid = undefined
            const unpackedStandardMessage = await issuerAMISDK.createStandardMessage(body, to , thid, ackResponseOn );
            
            //check if message is correctly formed
            expect(await issuerAMISDK.isMessageUnpacked(unpackedStandardMessage)).toBe(true)

            //Save thid for late
            thid = unpackedStandardMessage.thid;

         
            //Step 3: pack the message and simulate transport
            const packed = await issuerAgent.didCommPack(holderAgent.operationalDid,unpackedStandardMessage);
                // packed ---> dwn holder ---> holder sdk
            
            const response = await holderAMISDK.processMessage(packed.packedMessage);
            expect(response === null ).toBe(false)
           
            const responseMessage = response.packedMessage

            //Step 5: Send the ack back || holder ---> dwn issuer ---> issuer sdk
           
            //expect it to be a correctly formed ack

            expect(await issuerAMISDK.isMessage(responseMessage)).toBe(true)

            let unpackedResponse = issuerAgent.didCommUnpack(responseMessage);
            expect(unpackedResponse.type).toBe(MessageTypes.ACK)
            expect(unpackedResponse.body.status === ACKStatus.OK).toBe( true)

            const response2 = await issuerAMISDK.processMessage(response.packedMessage);
            expect(response2?.packedMessage).toBeUndefined()

            //Step 6: check events
            expect(issuerMessages.length).toBe(0)
            expect(issuerAcks.length).toBe(1)
            expect(issuerProblems.length).toBe(0)
            
            expect(holderMessages.length).toBe(1)
            expect(holderAcks.length).toBe(0)
            expect(holderProblems.length).toBe(0)
            
            //check message event
            let holderMessage = holderMessages.pop();
            expect(holderMessage.messageId === unpackedStandardMessage.id).toBe(true)
            expect(holderMessage.did === issuerAgent.operationalDid).toBe(true)
            expect(holderMessage.body.contentType === unpackedStandardMessage.body.contentType).toBe(true)
            expect(holderMessage.body.data === unpackedStandardMessage.body.data).toBe(true)
            //check ack event
            let issuerAck = issuerAcks.pop()
            expect(issuerAck.did === holderAgent.operationalDid).toBe(true)
            expect(issuerAck.status).toBe(ACKStatus.OK)
            expect(issuerAck.messageId === unpackedResponse.id).toBe(true)
            
            
        })

    );
} )
