// import { VerifiableCredential } from "@quarkid/vc-core";
import { AMISDK } from "../src";
import { MockAgent } from "./mock/mock-agent";
import { MessageStorage } from "../src";
import { ContentType , PlsACKOnValues , Message} from "@quarkid/ami-core";
import { FileSystemStorage } from "./mock/filesystem-storage";
// function areObjectsEqualDeep(obj1: any, obj2: any): boolean {
//     if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
//       return obj1 === obj2;
//     }
  
//     const keys1 = Object.keys(obj1);
//     const keys2 = Object.keys(obj2);
  
//     if (keys1.length !== keys2.length) {
//       return false;
//     }
  
//     for (const key of keys1) {
//       if (!areObjectsEqualDeep(obj1[key], obj2[key])) {
//         return false;
//       }
//     }
  
//     return true;
//   }
  
function generateRandomNumberString(length) {
    let result = '';
    const characters = '0123456789';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
  
    return result;
  }

function generateRandomDid(prefix: string, count:number){
    return prefix + generateRandomNumberString(count)
}
  
// const credentialToSign = require("./mock/vc.json");

jest.setTimeout(1000000);

async function clearStorage( storage: FileSystemStorage){
    let all = await storage.getAll()
    let keys = Array.from(all.keys())
    Promise.all(
        keys.map(x => storage.remove(x))
    )
}

describe("Storage tests",  () => {
  describe("MessageStorage with IStorage 2", () =>
    it("Flow test", async () => {
        //Step 1: preparation:
        //setting agent and mock storages
        const issuerAgent = new MockAgent('did:test:issuer')
        
        const issuerIStorageMessages = new FileSystemStorage({ filepath:'./__test__/data/storage-tests/issuer-message-storage.json'})
        const issuerIStorageThreads = new FileSystemStorage({filepath:'./__test__/data/storage-tests/issuer-thread-storage.json'})
        const issuerIStorageChat = new FileSystemStorage({filepath:'./__test__/data/storage-tests/issuer-chat-storage.json'})

        await clearStorage(issuerIStorageMessages)
        await clearStorage(issuerIStorageThreads)
        let messages = Array.from((await issuerIStorageMessages.getAll<Message|undefined>()).values()).length;
        let thread = Array.from((await issuerIStorageThreads.getAll<string[]|undefined>()).values()).length;
        expect(messages).toBe(0)
        expect(thread).toBe(0)
        const issuerAgentStorage = new MessageStorage(issuerIStorageMessages,issuerIStorageThreads)
        //setting sdk
        const issuerAMISDK = new AMISDK(issuerAgent.operationalDid ,  issuerAgent.didCommPack , issuerAgent.didCommUnpack,
          issuerAgentStorage, issuerIStorageChat);
        
        //setting event handlers
        let issuerMessages = []
        let issuerAcks = []
        let issuerProblems = []
        issuerAMISDK.standardMessage.on( (data) => issuerMessages.push(data))
        issuerAMISDK.problemReport.on( (data) => issuerProblems.push(data))
        issuerAMISDK.messageAck.on( (data) => issuerAcks.push(data))
        let unpackedMessages = []
        for(let i = 0 ; i< 10 ; i++ ){
            let body = { contentType: ContentType.TEXT , data: "Hello holder!" }
            let ackResponseOn = [PlsACKOnValues.RECEIPT] 
            let to = [ generateRandomDid('did:test' , 10) ]
            let thid = undefined
            const unpackedStandardMessage = await issuerAMISDK.createStandardMessage(body, to , thid, ackResponseOn );
            thid = unpackedStandardMessage.thid;
            expect(await issuerAMISDK.isMessageUnpacked(unpackedStandardMessage)).toBe(true)
            unpackedMessages.push(unpackedStandardMessage)
            to = [ generateRandomDid('did:test' , 10) ]
            body = { contentType: ContentType.TEXT , data: "Hello holder2!" }
            ackResponseOn = [PlsACKOnValues.OUTCOME] 
            const unpackedStandardMessage2 = await issuerAMISDK.createStandardMessage(body, to , thid, ackResponseOn );
            expect(await issuerAMISDK.isMessageUnpacked(unpackedStandardMessage2)).toBe(true)
            unpackedMessages.push(unpackedStandardMessage2)
        }
       
        messages = Array.from((await issuerIStorageMessages.getAll<Message|undefined>()).values()).length;
        thread = Array.from((await issuerIStorageThreads.getAll<string[]|undefined>()).values()).length;
        expect(messages).toBe(20)
        expect(thread).toBe(10)
        for(let i = 0 ; i<10 ; i ++){
          let ids = await (await (issuerAgentStorage.getByThread(unpackedMessages[i*2].thid))).getThreadMessagesId()
          let messagesInThread = unpackedMessages.slice(2*i , 2*i+2).map(x => x.id)
          expect(ids[0] === messagesInThread[0]).toBe(true)
          expect(ids[1] === messagesInThread[1]).toBe(true)
        }
      

    })

  );
  describe("MessageStorage with IStorage", () =>
    it("Flow test", async () => {
        //Step 1: preparation:
        //setting agent and mock storages
        const issuerAgent = new MockAgent('did:test:issuer')
        
        const issuerIStorageMessages = new FileSystemStorage({ filepath:'./__test__/data/storage-tests/issuer-message-storage.json'})
        const issuerIStorageThreads = new FileSystemStorage({filepath:'./__test__/data/storage-tests/issuer-thread-storage.json'})
        const issuerIStorageChat = new FileSystemStorage({filepath:'./__test__/data/storage-tests/issuer-chat-storage.json'})
      
        await clearStorage(issuerIStorageMessages)
        await clearStorage(issuerIStorageThreads)
        let messages = Array.from((await issuerIStorageMessages.getAll<Message|undefined>()).values()).length;
        let thread = Array.from((await issuerIStorageThreads.getAll<string[]|undefined>()).values()).length;
        expect(messages).toBe(0)
        expect(thread).toBe(0)
        const issuerAgentStorage = new MessageStorage(issuerIStorageMessages,issuerIStorageThreads)
        //setting sdk
        const issuerAMISDK = new AMISDK(issuerAgent.operationalDid ,  issuerAgent.didCommPack , issuerAgent.didCommUnpack,issuerAgentStorage, issuerIStorageChat);
         
        //setting event handlers
        let issuerMessages = []
        let issuerAcks = []
        let issuerProblems = []
        issuerAMISDK.standardMessage.on( (data) => issuerMessages.push(data))
        issuerAMISDK.problemReport.on( (data) => issuerProblems.push(data))
        issuerAMISDK.messageAck.on( (data) => issuerAcks.push(data))
        let unpackedMessages = []
        for(let i = 0 ; i< 10 ; i++ ){
            let body = { contentType: ContentType.TEXT , data: "Hello holder!" }
            let ackResponseOn = [PlsACKOnValues.RECEIPT] 
            let to = [ generateRandomDid('did:test' , 10) ]
            let thid = undefined
            const unpackedStandardMessage = await issuerAMISDK.createStandardMessage(body, to , thid, ackResponseOn );
            expect(await issuerAMISDK.isMessageUnpacked(unpackedStandardMessage)).toBe(true)
            unpackedMessages.push(unpackedStandardMessage)
        }
       
        messages = Array.from((await issuerIStorageMessages.getAll<Message|undefined>()).values()).length;
        thread = Array.from((await issuerIStorageThreads.getAll<string[]|undefined>()).values()).length;
        expect(messages).toBe(10)
        expect(thread).toBe(10)
        for(let i = 0 ; i<10 ; i ++){
            const message = unpackedMessages[i]
            const storedMessage =  await issuerIStorageMessages.get<Message|undefined>(message.id);
            expect(storedMessage).toBeDefined();
            const storedThread = await issuerIStorageThreads.get<string[]|undefined>(message.thid);
            expect(storedThread).toBeDefined();
            expect(storedThread.length).toBeGreaterThan(0);
        }
      

    })

  );
  describe("MessageStorageThread test", () =>
      it("Flow test", async () => {
          //Step 1: preparation:
          //setting agent and mock storages
          const issuerAgent = new MockAgent('did:test:issuer')
          const holderAgent = new MockAgent('did:test:holder')

          const issuerIStorageMessages = new FileSystemStorage({ filepath:'./__test__/data/storage-tests/issuer-message-storage.json'})
          const issuerIStorageThreads = new FileSystemStorage({filepath:'./__test__/data/storage-tests/issuer-thread-storage.json'})
          const issuerIStorageChat = new FileSystemStorage({filepath:'./__test__/data/storage-tests/issuer-chat-storage.json'})


          const holderIStorageMessages = new FileSystemStorage({ filepath:'./__test__/data/storage-tests/holder-message-storage.json'})
          const holderIStorageThreads = new FileSystemStorage({filepath:'./__test__/data/storage-tests/holder-thread-storage.json'})
          const holderIStorageChat = new FileSystemStorage({filepath:'./__test__/data/storage-tests/holder-chat-storage.json'})

          await clearStorage(issuerIStorageMessages)
          await clearStorage(issuerIStorageThreads)

          await clearStorage(holderIStorageMessages)
          await clearStorage(holderIStorageThreads)

          let messages = Array.from((await issuerIStorageMessages.getAll<Message|undefined>()).values()).length;
          let thread = Array.from((await issuerIStorageThreads.getAll<string[]|undefined>()).values()).length;
          let messages2 = Array.from((await holderIStorageMessages.getAll<Message|undefined>()).values()).length;
          let thread2 = Array.from((await holderIStorageThreads.getAll<string[]|undefined>()).values()).length;
          expect(messages).toBe(0)
          expect(thread).toBe(0)
          expect(messages2).toBe(0)
          expect(thread2).toBe(0)
          //   )
          // const issuerAgentStorage = new MessageStorage(issuerIStorageMessages,issuerIStorageThreads)
          // const holderAgentStorage = new MessageStorage(holderIStorageMessages,holderIStorageThreads)
          //setting sdk
          const issuerAgentStorage = new MessageStorage(issuerIStorageMessages,issuerIStorageThreads)
          const issuerAMISDK = new AMISDK(issuerAgent.operationalDid ,  issuerAgent.didCommPack , issuerAgent.didCommUnpack,
            issuerAgentStorage , issuerIStorageChat);
          const holderAgentStorage = new MessageStorage(holderIStorageMessages,holderIStorageThreads)

          const holderAMISDK = new AMISDK(holderAgent.operationalDid , holderAgent.didCommPack , holderAgent.didCommUnpack , 
            holderAgentStorage,holderIStorageChat);
        
          let unpackedMessages = []
          let thid;
          
          

          for(let i = 0 ; i< 20 ; i++ ){
            let body = { contentType: ContentType.TEXT , data: `Hello holder! ${i}` }
            let to = [ holderAgent.operationalDid]
            const unpackedStandardMessage = await issuerAMISDK.createStandardMessage(body, to , thid, undefined );
            if(!thid)
              thid = unpackedStandardMessage.thid;
            expect(await issuerAMISDK.isMessageUnpacked(unpackedStandardMessage)).toBe(true)
            unpackedMessages.push(unpackedStandardMessage)
            const packedMessage = await issuerAgent.didCommPack(holderAgent.operationalDid , unpackedStandardMessage);
            const response = await holderAMISDK.processMessage(packedMessage.packedMessage);
            // console.log(response);
            expect(response === null).toBe(true);
          }
        
          messages = Array.from((await issuerIStorageMessages.getAll<Message|undefined>()).values()).length;
          thread = Array.from((await issuerIStorageThreads.getAll<string[]|undefined>()).values()).length;
          messages2 = Array.from((await holderIStorageMessages.getAll<Message|undefined>()).values()).length;
          thread2 = Array.from((await holderIStorageThreads.getAll<string[]|undefined>()).values()).length;
          expect(messages).toBe(20)
          expect(thread).toBe(1)
          expect(messages2).toBe(20)
          expect(thread2).toBe(1)
          for(let i = 0 ; i<10 ; i ++){
              const message = unpackedMessages[i]
              let storedMessage =  await issuerIStorageMessages.get<Message|undefined>(message.id);
              expect(storedMessage).toBeDefined();
              let storedThread = await issuerIStorageThreads.get<string[]|undefined>(message.thid);
              expect(storedThread).toBeDefined();
              expect(storedThread.length).toBeGreaterThan(0);
              storedMessage =  await holderIStorageMessages.get<Message|undefined>(message.id);
              expect(storedMessage).toBeDefined();
              storedThread = await issuerIStorageThreads.get<string[]|undefined>(message.thid);
              expect(storedThread).toBeDefined();
              expect(storedThread.length).toBeGreaterThan(0);
          }
        

      })

  );
})
