
import {  AMISDK, StandardMessageEvent , ContentType} from "@quarkid/ami-sdk";
import {DID , Agent} from "@quarkid/agent";
import * as fs from "fs";
export async function onStandardMessageHandler(agent: Agent , sdk: AMISDK , data?: StandardMessageEvent){
    if(!data)
        return
    
    if(data.body.contentType !== ContentType.TEXT){
            let name = data.messageId
            let pathReceived = `./__test__/pdf/holder/received/${name}.pdf`
            await fs.promises.writeFile(pathReceived,  await sdk.decodeFileMessageBody(data.body), 'binary');
    }

    if(data.onComplitionACK){
        const message = await sdk.createAckMessage(data.did , data.messageId)
        await agent.messaging.sendMessage({
            to: DID.from(data.did),
            message
        })
    }
}

