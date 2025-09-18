import { MockAgent } from "./mock/mock-agent";
import { ChatMessage, ChunkedEncoder, IStorage, MessageStorage, getFileExtention } from "../src";
import { ContentType , PlsACKOnValues , ACKStatus, MessageTypes} from "@quarkid/ami-core";
import { AMISDK } from "../src";
import { FileSystemStorage } from "./mock/filesystem-storage";
import { IncomingChatMessageStatus, OutgoingChatMessageStatus , StandardMessageEvent , ACKMessageEvent , ProblemReportMessageEvent } from "../src";
import * as fs from 'fs';
import * as path from 'path';

function readFileAsUint8Array(filePath) {
    const fileContent = fs.readFileSync(filePath, 'binary');
    const uint8Array = new Uint8Array(fileContent.length);
    
    for (let i = 0; i < fileContent.length; i++) {
      uint8Array[i] = fileContent.charCodeAt(i) & 0xff;
    }
  
    return uint8Array;
  }
  
jest.setTimeout(1000000);

async function fileExists(filePath) {
    return new Promise(resolve => {
      fs.access(filePath, fs.constants.F_OK, err => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
  
async function printChats(agent: AMISDK , did:string) {
    // console.log("printing chats for: " , did)
    let chats = await agent.getChats()
    let messagesPromises = chats.map( x=> x.getChatMessages());
    let messages = await Promise.all(messagesPromises);
    // messages.map ( x => x.map(x=> {
    //     return { "message":x.message.toString() , "status": x.status}
    // })
    // console.log(messages.length)
    messages.forEach(x => console.log(x.map(y => {
        return { 
            "body": (<any>y.message.body).data, 
            "to": y.message.to[0] , 
            "from": y.message.from , 
            "status": y.status , 
            "time": y.message.create_time
        }})))
}
async function deleteFilesInFolder(folderPath: string): Promise<void> {
    try {
    
      const files = await fs.promises.readdir(folderPath);
  
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        await fs.promises.unlink(filePath);
        // console.log(`Deleted: ${filePath}`);
      }
  
    //   console.log('All files deleted successfully.');
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  }
async function clearStorage( storage: IStorage){
    let all = await storage.getAll()
    let keys = Array.from(all.keys())
    Promise.all(
        keys.map(x => storage.remove(x))
    )
}


describe("Chat tests",   () => {
    let issuerAMISDK : AMISDK, holderAMISDK : AMISDK , issuerAgent : MockAgent , holderAgent : MockAgent;
    let issuerIStorageMessages : IStorage , issuerIStorageThreads : IStorage ,issuerIStorageChat : IStorage, issuerAgentStorage;
    let holderIStorageMessages: IStorage,holderIStorageThreads: IStorage,holderIStorageChat : IStorage, holderAgentStorage 
    
    let issuerMessages : StandardMessageEvent[] = [] 
    let issuerAcks : ACKMessageEvent[] = [] 
    let issuerProblems : ProblemReportMessageEvent[] = []
    
    let holderMessages : StandardMessageEvent[] = []
    let holderAcks : ACKMessageEvent[] = []
    let holderProblems  : ProblemReportMessageEvent[] = []

    beforeAll( () => {
        issuerAgent = new MockAgent('did:test:issuer')
        holderAgent = new MockAgent('did:test:holder')
        issuerIStorageMessages = new FileSystemStorage({ filepath:'./__test__/data/chat-tests/issuer-message-storage.json'})
        issuerIStorageThreads = new FileSystemStorage({filepath:'./__test__/data/chat-tests/issuer-thread-storage.json'})
        issuerIStorageChat = new FileSystemStorage({filepath:'./__test__/data/chat-tests/issuer-chat-storage.json'})
        holderIStorageMessages = new FileSystemStorage({filepath:'./__test__/data/chat-tests/holder-message-storage.json'})
        holderIStorageThreads = new FileSystemStorage({filepath:'./__test__/data/chat-tests/holder-thread-storage.json'})
        holderIStorageChat = new FileSystemStorage({filepath:'./__test__/data/chat-tests/holder-chat-storage.json'})
        issuerAgentStorage = new MessageStorage(issuerIStorageMessages,issuerIStorageThreads)
        holderAgentStorage = new MessageStorage(holderIStorageMessages,holderIStorageThreads)
        //setting sdk
        issuerAMISDK = new AMISDK(issuerAgent.operationalDid ,  issuerAgent.didCommPack , issuerAgent.didCommUnpack,issuerAgentStorage,issuerIStorageChat , new ChunkedEncoder(1024*64));
        holderAMISDK = new AMISDK(holderAgent.operationalDid , holderAgent.didCommPack , holderAgent.didCommUnpack, holderAgentStorage,holderIStorageChat , new ChunkedEncoder(1024*64));
    
        
        issuerAMISDK.standardMessage.on( (data) => issuerMessages.push(data))
        issuerAMISDK.problemReport.on( (data) => issuerProblems.push(data))
        issuerAMISDK.messageAck.on( (data) => issuerAcks.push(data))

        holderAMISDK.standardMessage.on( (data) => holderMessages.push(data))
        holderAMISDK.problemReport.on( (data) => holderProblems.push(data))
        holderAMISDK.messageAck.on( (data) => holderAcks.push(data))

    })

    beforeEach(async () => {
        issuerMessages = [] 
        issuerAcks = []
        issuerProblems = []
        
        holderMessages = []
        holderAcks = []
        holderProblems = []
        // Clear the storages for both agents
        await clearStorage(issuerIStorageMessages);
        await clearStorage(issuerIStorageThreads);
        await clearStorage(issuerIStorageChat);
        await clearStorage(holderIStorageMessages);
        await clearStorage(holderIStorageThreads);
        await clearStorage(holderIStorageChat);
    });

    describe("Conversation, issuer sends notification", () =>
    
    it("Notifications", async () => {
        
        let messages = [ "hello holder!" , "Something is going on" ]
        
        for(let i = 0 ; i < messages.length ; i++){
            //Step 1: send messages 
            let body = { contentType: ContentType.TEXT , data: messages[i] }
            let ackResponseOn = [] 
            let to = [ holderAgent.operationalDid ]
            let thid = undefined
            let unpackedStandardMessage = await issuerAMISDK.createStandardMessage(body, to , thid, ackResponseOn );
            
            //check if message is correctly formed
            expect(await issuerAMISDK.isMessageUnpacked(unpackedStandardMessage)).toBe(true)

            thid = unpackedStandardMessage.thid;
            //Step 3: pack the message and simulate transport
            let packed = await issuerAgent.didCommPack(holderAgent.operationalDid,unpackedStandardMessage);
            
            
            let issuerChat = await( await issuerAMISDK.getChatByDid(holderAgent.operationalDid)).getChatMessages()
            expect(issuerChat.length).toBe(i + 1)
            expect(issuerChat[i].status === OutgoingChatMessageStatus.NOTIFICATION).toBe(true)
            
            // packed ---> dwn holder ---> holder sdk
            let response = await holderAMISDK.processMessage(packed.packedMessage);
            expect(response === null ).toBe(true)
            
//            await new Promise<void>((resolve) => setTimeout(() => resolve() , 1000))
        }    

        let holderChats = await holderAMISDK.getChats()
        let holderMessagesPromises = holderChats.map( x=> x.getChatMessages());
        let holderChatMessages : ChatMessage[][] = await Promise.all(holderMessagesPromises);
        
        // console.log(holderChatMessages)
        expect(holderChatMessages.length).toBe(1)
        holderChatMessages[0].forEach( x => { expect(x.status === IncomingChatMessageStatus.NOTIFICATION).toBe(true)})
        
        let issuerChats = await issuerAMISDK.getChats()
        let issuerMessagesPromises = issuerChats.map( x=> x.getChatMessages());
        let issuerChatMessages : ChatMessage[][] = await Promise.all(issuerMessagesPromises);
        expect(issuerChatMessages.length).toBe(1)
        issuerChatMessages[0].forEach( x => { expect(x.status === OutgoingChatMessageStatus.NOTIFICATION).toBe(true)})
})
    );

    

    describe("Conversation without confirmation, issuer sends to holder:", () =>
    
        it("Message received", async () => {
            
            let messages = [ "hello holder!" , "I have something to tell you"  , "thank you, bye" ]
            
            for(let i = 0 ; i < messages.length ; i++){
                //Step 1: send messages 
                let body = { contentType: ContentType.TEXT , data: messages[i] }
                let ackResponseOn = [PlsACKOnValues.RECEIPT ] 
                let to = [ holderAgent.operationalDid ]
                let thid = undefined
                let unpackedStandardMessage = await issuerAMISDK.createStandardMessage(body, to , thid, ackResponseOn );
                
                //check if message is correctly formed
                expect(await issuerAMISDK.isMessageUnpacked(unpackedStandardMessage)).toBe(true)

                thid = unpackedStandardMessage.thid;
                //Step 3: pack the message and simulate transport
                let packed = await issuerAgent.didCommPack(holderAgent.operationalDid,unpackedStandardMessage);
                
                
                let issuerChat = await( await issuerAMISDK.getChatByDid(holderAgent.operationalDid)).getChatMessages()
                expect(issuerChat.length).toBe(i + 1)
                expect(issuerChat[i].status === OutgoingChatMessageStatus.AWAITING_RECEIVED).toBe(true)
                
                // packed ---> dwn holder ---> holder sdk
                let response = await holderAMISDK.processMessage(packed.packedMessage);
                expect(response === null ).toBe(false)
                
                let responseMessage = response.packedMessage

                //Step 5: Send the ack back || holder ---> dwn issuer ---> issuer sdk
                expect(await issuerAMISDK.isMessage(responseMessage)).toBe(true)

                let unpackedResponse = issuerAgent.didCommUnpack(responseMessage);
                expect(unpackedResponse.type).toBe(MessageTypes.ACK)
                expect(unpackedResponse.body.status === ACKStatus.OK).toBe( true)

                let response2 = await issuerAMISDK.processMessage(response.packedMessage);
                expect(response2?.packedMessage).toBeUndefined()
             //   await new Promise<void>((resolve) => setTimeout(() => resolve() , 1000))
            }    

            let holderChats = await holderAMISDK.getChats()
            let holderMessagesPromises = holderChats.map( x=> x.getChatMessages());
            let holderChatMessages : ChatMessage[][] = await Promise.all(holderMessagesPromises);
            
            // console.log(holderChatMessages)
            expect(holderChatMessages.length).toBe(1)
            holderChatMessages[0].forEach( x => { expect(x.status === IncomingChatMessageStatus.RECEIVED).toBe(true)})
            
            let issuerChats = await issuerAMISDK.getChats()
            let issuerMessagesPromises = issuerChats.map( x=> x.getChatMessages());
            let issuerChatMessages : ChatMessage[][] = await Promise.all(issuerMessagesPromises);
            expect(issuerChatMessages.length).toBe(1)
            issuerChatMessages[0].forEach( x => { expect(x.status === OutgoingChatMessageStatus.RECEIVED).toBe(true)})
                    })
    );


    describe("Conversation with confirmation, issuer sends to holder:", () =>
    
    it("Message recieved  confirmed", async () => {
        
        let messages = [ "hello holder!" , "I have something to tell you"  , "thank you, bye" ]
        
        for(let i = 0 ; i < messages.length ; i++){
            //Step 1: send messages 
            let body = { contentType: ContentType.TEXT , data: messages[i] }
            let ackResponseOn = [PlsACKOnValues.RECEIPT , PlsACKOnValues.OUTCOME] 
            let to = [ holderAgent.operationalDid ]
            let thid = undefined
            let unpackedStandardMessage = await issuerAMISDK.createStandardMessage(body, to , thid, ackResponseOn );
            
            //check if message is correctly formed
            expect(await issuerAMISDK.isMessageUnpacked(unpackedStandardMessage)).toBe(true)

            thid = unpackedStandardMessage.thid;
            //Step 3: pack the message and simulate transport
            let packed = await issuerAgent.didCommPack(holderAgent.operationalDid,unpackedStandardMessage);

            let issuerChat = await( await issuerAMISDK.getChatByDid(holderAgent.operationalDid)).getChatMessages()
            expect(issuerChat.length).toBe(i + 1)
            expect(issuerChat[i].status === OutgoingChatMessageStatus.AWAITING_RECEIVED).toBe(true)
            
            // packed ---> dwn holder ---> holder sdk
            let response = await holderAMISDK.processMessage(packed.packedMessage);
            expect(response === null ).toBe(false)
        
            let responseMessage = response.packedMessage

            //Step 5: Send the ack back || holder ---> dwn issuer ---> issuer sdk
            expect(await issuerAMISDK.isMessage(responseMessage)).toBe(true)

            let unpackedResponse = issuerAgent.didCommUnpack(responseMessage);
            expect(unpackedResponse.type).toBe(MessageTypes.ACK)
            expect(unpackedResponse.body.status === ACKStatus.PENDING).toBe( true)

            let response2 = await issuerAMISDK.processMessage(response.packedMessage);
            expect(response2?.packedMessage).toBeUndefined()
        //    await new Promise<void>((resolve) => setTimeout(() => resolve() , 1000))
        }    

        let holderChats = await holderAMISDK.getChats()
        let holderMessagesPromises = holderChats.map( x=> x.getChatMessages());
        let holderChatMessages : ChatMessage[][] = await Promise.all(holderMessagesPromises);
        
        // console.log(holderChatMessages)
        expect(holderChatMessages.length).toBe(1)
        holderChatMessages[0].forEach( x => { expect(x.status === IncomingChatMessageStatus.MUST_CONFIRM).toBe(true)})
        
        let issuerChats = await issuerAMISDK.getChats()
        let issuerMessagesPromises = issuerChats.map( x=> x.getChatMessages());
        let issuerChatMessages : ChatMessage[][] = await Promise.all(issuerMessagesPromises);
        expect(issuerChatMessages.length).toBe(1)
        issuerChatMessages[0].forEach( x => { expect(x.status === OutgoingChatMessageStatus.RECEIVED_AWAITING_CONFIRMATION).toBe(true)})
        
        // console.log("holder messages" , holderMessages)
        for(let i =0 ;  i < holderMessages.length; i++ ){
            let x = holderMessages[i]
            if(x.onComplitionACK){
                let to = x.did
                let id = x.messageId
                let unpackedMessage = await holderAMISDK.createAckMessage(to ,id);
                // console.log("unpacked message",unpackedMessage)
                let packedMessage = await holderAgent.didCommPack(issuerAgent.operationalDid,unpackedMessage);
                // console.log("packed message" , packedMessage)

                let response = await issuerAMISDK.processMessage(packedMessage.packedMessage)
                expect(response === null).toBe(true)
            }
        }

        issuerChats = await issuerAMISDK.getChats()
        issuerMessagesPromises = issuerChats.map( x=> x.getChatMessages());
        issuerChatMessages  = await Promise.all(issuerMessagesPromises);
        // console.log(issuerChatMessages)
        expect(issuerChatMessages.length).toBe(1)
        issuerChatMessages[0].forEach( x => { expect(x.status === OutgoingChatMessageStatus.CONFIRMED).toBe(true)})
        


        holderChats = await holderAMISDK.getChats();
        holderMessagesPromises = holderChats.map( x=> x.getChatMessages());
        holderChatMessages = await Promise.all(holderMessagesPromises);  
        // console.log(holderChatMessages)
        expect(holderChatMessages.length).toBe(1)
        holderChatMessages[0].forEach( x => { expect(x.status === IncomingChatMessageStatus.CONFIRMED).toBe(true)})
        

    })
);

describe("Conversation with confirmation, both ways:", () =>
    
    it("Message recieved  confirmed", async () => {
        
        let messages = [ "hello holder!" , "hello issuer!"  , "how you doing?" , "fine you?" , "im terrific" , "see you" , "bye holder!" , "bye issuer!"]
        
        for(let i = 0 ; i < messages.length ; i++){

            let aAgent :MockAgent;
            let aSDK : AMISDK;

            let bAgent :MockAgent;
            let bSDK : AMISDK
            
            if(i%2 == 0){
                aAgent = issuerAgent
                aSDK = issuerAMISDK 
                
                bAgent = holderAgent
                bSDK = holderAMISDK
            }else{
                aAgent = holderAgent
                aSDK = holderAMISDK 
                
                bAgent = issuerAgent
                bSDK = issuerAMISDK
            }
            //Step 1: send messages 
            let body = { contentType: ContentType.TEXT , data: messages[i] }
            let ackResponseOn = [PlsACKOnValues.RECEIPT , PlsACKOnValues.OUTCOME] 
            let to = [ bAgent.operationalDid ]
            let thid = undefined
            let unpackedStandardMessage = await aSDK.createStandardMessage(body, to , thid, ackResponseOn );
            
            //check if message is correctly formed
            expect(await aSDK.isMessageUnpacked(unpackedStandardMessage)).toBe(true)

            thid = unpackedStandardMessage.thid;
            //Step 3: pack the message and simulate transport
            let packed = await aAgent.didCommPack(bAgent.operationalDid,unpackedStandardMessage);

            let aChat = await( await aSDK.getChatByDid(bAgent.operationalDid)).getChatMessages()
            expect(aChat.length).toBe(i + 1)
            expect(aChat[i].status === OutgoingChatMessageStatus.AWAITING_RECEIVED).toBe(true)
            
            // packed ---> dwn holder ---> holder sdk
            let response = await bSDK.processMessage(packed.packedMessage);
            expect(response === null ).toBe(false)
        
            let responseMessage = response.packedMessage

            //Step 5: Send the ack back || holder ---> dwn issuer ---> issuer sdk
            expect(await aSDK.isMessage(responseMessage)).toBe(true)

            let unpackedResponse = aAgent.didCommUnpack(responseMessage);
            expect(unpackedResponse.type).toBe(MessageTypes.ACK)
            expect(unpackedResponse.body.status === ACKStatus.PENDING).toBe( true)

            let response2 = await aSDK.processMessage(response.packedMessage);
            expect(response2?.packedMessage).toBeUndefined()
           await new Promise<void>((resolve) => setTimeout(() => resolve() , 1000))
        }    

        // == PART 2: CHECK THE CHATS ==
        let holderChats = await holderAMISDK.getChats()
        let holderMessagesPromises = holderChats.map( x=> x.getChatMessages());
        let holderChatMessages : ChatMessage[][] = await Promise.all(holderMessagesPromises);
        
        expect(holderChatMessages.length).toBe(1)
        
        holderChatMessages[0].forEach( x => {
            // console.log(x)
            if(x.message.from === holderAgent.operationalDid)
                expect(x.status === OutgoingChatMessageStatus.RECEIVED_AWAITING_CONFIRMATION).toBe(true)
            else
                expect(x.status === IncomingChatMessageStatus.MUST_CONFIRM).toBe(true)
        })
        
        let issuerChats = await issuerAMISDK.getChats()
        let issuerMessagesPromises = issuerChats.map( x=> x.getChatMessages());
        let issuerChatMessages : ChatMessage[][] = await Promise.all(issuerMessagesPromises);
        
        expect(issuerChatMessages.length).toBe(1)
        
        issuerChatMessages[0].forEach( x => {
            if(x.message.from === issuerAgent.operationalDid)
                expect(x.status === OutgoingChatMessageStatus.RECEIVED_AWAITING_CONFIRMATION).toBe(true)
            else
                expect(x.status === IncomingChatMessageStatus.MUST_CONFIRM).toBe(true)
        })


        //
        for(let i =0 ;  i < holderMessages.length; i++ ){
            let x = holderMessages[i]
            if(x.onComplitionACK){
                let to = x.did
                let id = x.messageId
                let unpackedMessage = await holderAMISDK.createAckMessage(to ,id);
                // console.log("unpacked message",unpackedMessage)
                let packedMessage = await holderAgent.didCommPack(issuerAgent.operationalDid,unpackedMessage);
                // console.log("packed message" , packedMessage)

                let response = await issuerAMISDK.processMessage(packedMessage.packedMessage)
                expect(response === null).toBe(true)
            }
        }
        for(let i =0 ;  i < issuerMessages.length; i++ ){
            let x = issuerMessages[i]
            if(x.onComplitionACK){
                let to = x.did
                let id = x.messageId
                let unpackedMessage = await issuerAMISDK.createAckMessage(to ,id);
                // console.log("unpacked message",unpackedMessage)
                let packedMessage = await issuerAgent.didCommPack(holderAgent.operationalDid,unpackedMessage);
                // console.log("packed message" , packedMessage)

                let response = await holderAMISDK.processMessage(packedMessage.packedMessage)
                expect(response === null).toBe(true)
            }
        }

        issuerChats = await issuerAMISDK.getChats()
        issuerMessagesPromises = issuerChats.map( x=> x.getChatMessages());
        issuerChatMessages  = await Promise.all(issuerMessagesPromises);
        // console.log(issuerChatMessages)
        expect(issuerChatMessages.length).toBe(1)
        issuerChatMessages[0].forEach( x => {
            if(x.message.from === issuerAgent.operationalDid)
                expect(x.status === OutgoingChatMessageStatus.CONFIRMED).toBe(true)
            else
                expect(x.status === IncomingChatMessageStatus.CONFIRMED).toBe(true)
        })        


        holderChats = await holderAMISDK.getChats();
        holderMessagesPromises = holderChats.map( x=> x.getChatMessages());
        holderChatMessages = await Promise.all(holderMessagesPromises);  
        // console.log(holderChatMessages)
        expect(holderChatMessages.length).toBe(1)
        holderChatMessages[0].forEach( x => {
            if(x.message.from === holderAgent.operationalDid)
                expect(x.status === OutgoingChatMessageStatus.CONFIRMED).toBe(true)
            else
                expect(x.status === IncomingChatMessageStatus.CONFIRMED).toBe(true)
        })        

    })
);

describe("Conversation with confirmation, issuer sends pdf to holder:", () =>
    
    it("Message with pdf, and filed saved in the other side", async () => {

        await deleteFilesInFolder('./__test__/pdf/holder/received')
        const filePath = './__test__/pdf/issuer/sent/test2.pdf'
        const file = await readFileAsUint8Array(filePath);
        console.log("file size: " , calculateSizeInKB(file))
        // const file = await fs.readFileSync(filePath, 'binary')
        const body = await issuerAMISDK.createFileMessageBody(ContentType.PDF , file);
        
        let ackResponseOn = [PlsACKOnValues.RECEIPT , PlsACKOnValues.OUTCOME] 
        let to = [ holderAgent.operationalDid ]
        let thid = undefined
        let unpackedStandardMessage = await issuerAMISDK.createStandardMessage(body, to , thid, ackResponseOn );
        // expect(true).toBe(true)
        // //check if message is correctly formed
        expect(await issuerAMISDK.isMessageUnpacked(unpackedStandardMessage)).toBe(true)

        thid = unpackedStandardMessage.thid;
        //Step 3: pack the message and simulate transport
        let packed = await issuerAgent.didCommPack(holderAgent.operationalDid,unpackedStandardMessage);
         
        // packed ---> dwn holder ---> holder sdk
        let response = await holderAMISDK.processMessage(packed.packedMessage);
    
        let responseMessage = response.packedMessage

        //Step 5: Send the ack back || holder ---> dwn issuer ---> issuer sdk
        expect(await issuerAMISDK.isMessage(responseMessage)).toBe(true)

        let unpackedResponse = issuerAgent.didCommUnpack(responseMessage);
        expect(unpackedResponse.type).toBe(MessageTypes.ACK)
        expect(unpackedResponse.body.status === ACKStatus.PENDING).toBe( true)

        let response2 = await issuerAMISDK.processMessage(response.packedMessage);
        expect(response2?.packedMessage).toBeUndefined()
        //    await new Promise<void>((resolve) => setTimeout(() => resolve() , 1000))
        
        let pathReceived;
        for(let i =0 ;  i < holderMessages.length; i++ ){
            let x = holderMessages[i]
            
            if(x.body.contentType !== ContentType.TEXT){
                let name = x.messageId
                let extension = getFileExtention(x.body.contentType)
                pathReceived = `./__test__/pdf/holder/received/${name}.${extension}`
                await fs.promises.writeFile(pathReceived,  await issuerAMISDK.decodeFileMessageBody(x.body), 'binary');
                const exists = await fileExists(pathReceived);
                expect(exists).toBe(true);
            }

            if(x.onComplitionACK){
                let to = x.did
                let id = x.messageId
                let unpackedMessage = await holderAMISDK.createAckMessage(to ,id);
                // console.log("unpacked message",unpackedMessage)
                let packedMessage = await holderAgent.didCommPack(issuerAgent.operationalDid,unpackedMessage);
                // console.log("packed message" , packedMessage)

                let response = await issuerAMISDK.processMessage(packedMessage.packedMessage)
                expect(response === null).toBe(true)
            }
        }
        expect(pathReceived).toBeDefined()

        // expect(fs.readFileSync(pathReceived)).toEqual(fs.readFileSync(filePath));

    })
);

} )


function calculateSizeInKB(uint8Array) {
    const bytes = uint8Array.length;
    const megabytes = bytes / (1024); // Convert bytes to megabytes
    return megabytes;
  }

