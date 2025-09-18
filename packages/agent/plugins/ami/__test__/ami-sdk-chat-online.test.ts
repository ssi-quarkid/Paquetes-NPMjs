import {  ChunkedEncoder, IStorage} from "@quarkid/ami-sdk";
import { Agent, AgentModenaRegistry, AgentModenaResolver, AgentModenaUniversalRegistry, DID, DWNTransport, WACIProtocol} from "@quarkid/agent"
import { ContentType , PlsACKOnValues } from "@quarkid/ami-core";
import { AMISDK } from "@quarkid/ami-sdk";
import { FileSystemStorage } from "./mock/filesystem-storage";
import { StandardMessageEvent , ACKMessageEvent , ProblemReportMessageEvent } from "@quarkid/ami-sdk";
import { MemoryStorage } from "./mock/memory-storage";
import { FileSystemAgentSecureStorage } from "./mock/filesystem-secure-storage";
import {AMISDKPlugin} from "../src";
import {readFileAsUint8Array , calculateSizeInKB ,fileExists, deleteFilesInFolder } from "./utils"
import * as handlers from "./mock/message-handlers";
import * as fs from "fs";
import * as path from "path"; 
import { OneClickPlugin } from "@quarkid/one-click-agent-plugin";
async function clearStorage( storage: IStorage){
    let all = await storage.getAll()
    let keys = Array.from(all.keys())
    Promise.all(
        keys.map(x => storage.remove(x))
    )
}
function awaitForSdkReady(variable: AMISDKPlugin): Promise<void> {
    return new Promise<void>((resolve) => {
      if (variable.amisdk !== undefined) {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (variable.amisdk !== undefined) {
            clearInterval(interval);
            resolve();
          }
        }, 500); // Adjust the interval as needed
      }
    });
  }

  function waitForAgentReady(variable: Agent): Promise<void> {
    return new Promise<void>((resolve) => {
      if (variable.identity.getOperationalDID()?.value !== undefined) {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (variable.identity.getOperationalDID()?.value !== undefined) {
            clearInterval(interval);
            resolve();
          }
        }, 500); // Adjust the interval as needed
      }
    });
  }
jest.setTimeout(1000000);

describe("End to end message test",   () => {

    let issuerAMISDK : AMISDK, holderAMISDK : AMISDK , issuerAgent : Agent , holderAgent : Agent;
    let issuerPlugin: AMISDKPlugin , holderPlugin: AMISDKPlugin;
    let issuerIStorageMessages : IStorage , issuerIStorageThreads : IStorage ,issuerIStorageChat : IStorage, issuerAgentStorage :IStorage , issuerAgentSecureStorage :IStorage;
    let holderIStorageMessages: IStorage,holderIStorageThreads: IStorage,holderIStorageChat : IStorage, holderAgentStorage  : IStorage , holderAgentSecureStorage :IStorage;

    let issuerMessages : StandardMessageEvent[] = [] 
    let issuerAcks : ACKMessageEvent[] = [] 
    let issuerProblems : ProblemReportMessageEvent[] = []

    let holderMessages : StandardMessageEvent[] = []
    let holderAcks : ACKMessageEvent[] = []
    let holderProblems  : ProblemReportMessageEvent[] = []
    
    beforeAll( async () => {

        const waciProtocol = new WACIProtocol({
            storage: new MemoryStorage(),
        });

            // issuerAgent = new MockAgent('did:test:issuer')
        // holderAgent = new MockAgent('did:test:holder')
        issuerIStorageMessages = new FileSystemStorage({ filepath:'./__test__/data/issuer-message-storage.json'})
        issuerIStorageThreads = new FileSystemStorage({filepath:'./__test__/data/issuer-thread-storage.json'})
        issuerIStorageChat = new FileSystemStorage({filepath:'./__test__/data/issuer-chat-storage.json'})
        holderIStorageMessages = new FileSystemStorage({filepath:'./__test__/data/holder-message-storage.json'})
        holderIStorageThreads = new FileSystemStorage({filepath:'./__test__/data/holder-thread-storage.json'})
        holderIStorageChat = new FileSystemStorage({filepath:'./__test__/data/holder-chat-storage.json'})
        issuerAgentStorage =  new FileSystemStorage({
            filepath: "./__test__/data/agent-issuer-storage.json"
        }),
        issuerAgentSecureStorage = new FileSystemAgentSecureStorage({
            filepath: "./__test__/data/agent-issuer-secure-storage.json"
        }),

        holderAgentStorage =  new FileSystemStorage({
            filepath: "./__test__/data/agent-holder-storage.json"
        }),
        holderAgentSecureStorage = new FileSystemAgentSecureStorage({
            filepath: "./__test__/data/agent-holder-secure-storage.json"
        }),

        issuerPlugin = new AMISDKPlugin({ messageIStorage: issuerIStorageMessages,
            messageThreadIStorage: issuerIStorageThreads,
            chatIStorage: issuerIStorageChat,
            encoder: new ChunkedEncoder(1024*64)
        })
        
        //Crear una nueva instancia del agente, se deben pasar los protocolos a usar para la generación de VC (WACIProtocol)

        // new AgentModenaUniversalRegistry("https://demo-proxy.extrimian.com/zksyncv2/" , "did:quarkid:zksync"),
        issuerAgent = new Agent({
            didDocumentRegistry: new AgentModenaRegistry("https://demo2.extrimian.com/zksyncv2/" , "quarkid:zksync"),
            didDocumentResolver: new AgentModenaResolver("https://demo2.extrimian.com/zksyncv2/"),
            agentStorage: issuerAgentStorage,
            secureStorage: issuerAgentSecureStorage,
            vcStorage: new MemoryStorage(),
            vcProtocols: [waciProtocol],
            supportedTransports: [new DWNTransport()],
            agentPlugins: [ issuerPlugin]   
        });



        const waciProtocol2 = new WACIProtocol({
            storage: new MemoryStorage(),
        });

        holderPlugin = new AMISDKPlugin({ messageIStorage: holderIStorageMessages,
            messageThreadIStorage: holderIStorageThreads,
            chatIStorage: holderIStorageChat,
            encoder: new ChunkedEncoder(1024*64)
        });
        //Crear una nueva instancia del agente, se deben pasar los protocolos a usar para la generación de VC (WACIProtocol)
        
        // const oneClick = new OneClickPlugin();
        // oneClick.loginStarted.on((data) => console.log("login started" , data))
        // oneClick.userLoggedIn.on((data) => console.log("login finished", data))
        // oneClick.problemReport.on((data)=> console.log("Problem reported" , data))
        holderAgent = new Agent({
            didDocumentRegistry: new AgentModenaRegistry("https://demo2.extrimian.com/zksyncv2/" , "quarkid:zksync"),
            didDocumentResolver: new AgentModenaResolver("https://demo2.extrimian.com/zksyncv2/"),
            agentStorage: holderAgentStorage,
            secureStorage: holderAgentSecureStorage,
            vcStorage: new MemoryStorage(),
            vcProtocols: [waciProtocol2],
            supportedTransports: [new DWNTransport()],
            agentPlugins: [holderPlugin]   
        });

        await holderAgent.initialize();
        // await holderAgent.identity.createNewDID({dwnUrl:"https://demo.extrimian.com/dwn/"});
       
        await issuerAgent.initialize();

        // await issuerAgent.identity.createNewDID({dwnUrl:"https://demo.extrimian.com/dwn/"});

        await waitForAgentReady(issuerAgent);
        console.log("issuer ready:" , issuerAgent.identity.getOperationalDID())
        await waitForAgentReady(holderAgent);
        console.log("holder ready:" , holderAgent.identity.getOperationalDID())

        await awaitForSdkReady(issuerPlugin)
        
        await awaitForSdkReady(holderPlugin)
        console.log("sdk ready!")

        issuerAMISDK = issuerPlugin.amisdk;
        holderAMISDK = holderPlugin.amisdk;
        
        
        issuerAMISDK.standardMessage.on( (data) => issuerMessages.push(data) )
        issuerAMISDK.problemReport.on( (data) => issuerProblems.push(data))
        issuerAMISDK.messageAck.on( (data) => issuerAcks.push(data))

        holderAMISDK.standardMessage.on( (data) => holderMessages.push(data))
        holderAMISDK.standardMessage.on( (data) => handlers.onStandardMessageHandler(holderAgent , holderAMISDK , data).then(()=>console.log("message processed")))
        holderAMISDK.problemReport.on( (data) => holderProblems.push(data))
        holderAMISDK.messageAck.on( (data) => holderAcks.push(data))
        
        await new Promise<void>((resolve) => setTimeout(resolve , 10*1000))
    })

    beforeEach(async () => {
        issuerMessages = [] 
        issuerAcks = []
        issuerProblems = []
        
        holderMessages = []
        holderAcks = []
        holderProblems = []
        //Clear the storages for both agents
        await clearStorage(issuerIStorageMessages);
        await clearStorage(issuerIStorageThreads);
        await clearStorage(issuerIStorageChat);
        await clearStorage(holderIStorageMessages);
        await clearStorage(holderIStorageThreads);
        await clearStorage(holderIStorageChat);
    });
    // describe("Conversation with ack, issuer sends to holder:",  () =>
            
    // it("Message recieved", async () => {
        

    //     let body = { contentType: ContentType.TEXT , data: "hello holder!" }
    //     let ackResponseOn = [PlsACKOnValues.RECEIPT ] 
    //     let to = [ holderAgent.identity.getOperationalDID().value ]
    //     let thid = undefined
    //     let unpackedStandardMessage = await issuerAMISDK.createStandardMessage(body, to , thid, ackResponseOn );
    //     // let packedMessage = await didcommPackIssuer(to[0] , unpackedStandardMessage)
    //     await issuerAgent.messaging.sendMessage(
    //         {
    //             to: DID.from(to[0]),
    //             message: unpackedStandardMessage
    //         }
    //     )

    //     console.log("awaiting holder to receive message")
    //     do{
    //         await new Promise<void>( (resolve) => setTimeout(resolve , 3000))
    //     }while(holderMessages.length === 0 );
    //     console.log(holderMessages[0])
    //     console.log("awaiting issuer to receive ack")

    //     do{
    //         await new Promise<void>( (resolve) => setTimeout(resolve , 1000))
    //     }while(issuerAcks.length === 0 );

    //     console.log(issuerAcks[0])

    // })
    // );

    // describe("Conversation with ack, issuer sends to holder, holder must confirm outcome:",  () =>
        
    //     it("Message recieved  confirmed", async () => {
            
    //         let body = { contentType: ContentType.TEXT , data: "hello holder, please confirmed that you have read this!" }
    //         let ackResponseOn = [PlsACKOnValues.RECEIPT , PlsACKOnValues.OUTCOME] 
    //         let to = [ holderAgent.identity.getOperationalDID().value ]
    //         let thid = undefined
    //         let unpackedStandardMessage = await issuerAMISDK.createStandardMessage(body, to , thid, ackResponseOn );
    //         // let packedMessage = await didcommPackIssuer(to[0] , unpackedStandardMessage)
    //         await issuerAgent.messaging.sendMessage(
    //             {
    //                 to: DID.from(to[0]),
    //                 message: unpackedStandardMessage
    //             }
    //         )

    //         console.log("awaiting holder to receive message")
    //         do{
    //             await new Promise<void>( (resolve) => setTimeout(resolve , 3000))
    //         }while(holderMessages.length === 0 );
    //         console.log(holderMessages[0])

    //         console.log("awaiting issuer to receive ack")

    //         do{
    //             await new Promise<void>( (resolve) => setTimeout(resolve , 1000))
    //         }while(issuerAcks.length === 0 );

    //         console.log(issuerAcks[0])

    //         console.log("awaiting issuer to receive confirmation ack");

    //         do{
    //             await new Promise<void>( (resolve) => setTimeout(resolve , 1000))
    //         }while(issuerAcks.length === 1 );
            
    //         console.log(issuerAcks[1]);


    //     })
    // )

   describe( "Message with pdf" , () => {
        it("Pdf must be received accordingly" , async () => {
          console.log("sending pdf")
          await deleteFilesInFolder('./__test__/pdf/holder/received')
          const filePath = './__test__/pdf/issuer/sent/test.pdf'
          const file = await readFileAsUint8Array(filePath);
          console.log("file size: " , calculateSizeInKB(file))
          // const file = await fs.readFileSync(filePath, 'binary')
          const body = await issuerAMISDK.createFileMessageBody(ContentType.PDF , file);
          
          let ackResponseOn = [PlsACKOnValues.RECEIPT , PlsACKOnValues.OUTCOME] 
          let to = [ holderAgent.identity.getOperationalDID().value ]
          let thid = undefined



          let unpackedStandardMessage = await issuerAMISDK.createStandardMessage(body, to , thid, ackResponseOn );
          
          await issuerAgent.messaging.sendMessage(
            { 
              to: DID.from(to[0]),
              message: unpackedStandardMessage
            }
          );

        

          console.log("awaiting holder to receive message")
          do{
              await new Promise<void>( (resolve) => setTimeout(resolve , 3000))
          }while(holderMessages.length === 0 );
          console.log(holderMessages[0])

          console.log("awaiting issuer to receive ack")

          do{
              await new Promise<void>( (resolve) => setTimeout(resolve , 1000))
          }while(issuerAcks.length === 0 );

          console.log(issuerAcks[0])

          console.log("awaiting issuer to receive confirmation ack");

          do{
              await new Promise<void>( (resolve) => setTimeout(resolve , 1000))
          }while(issuerAcks.length === 1 );
          
          console.log(issuerAcks[1]);
            // expect(true).toBe(true)
            // //check if message is correctly formed
          
            })
    
  })
});

