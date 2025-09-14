import { ChatMessage } from "../chat-message/chat-message";
import { IChat, IChatStorage } from "./IChatStorage";
import { AMICore, IMessageThreadStorage, Message, MessageTypes } from "@quarkid/ami-core";
import { IStorage } from "./storage";
import { parseChatMessage } from "../chat-message/utils";

export class Chat implements IChat {
    
    constructor(private storage: IStorage , private core: AMICore, private ownerDid: string, private otherDid:string){

    }

    async getChatMessages(): Promise<ChatMessage[]> {
        let messages : string[] = await this.storage.get(this.otherDid) || [];
        let threadsPromises = messages.map( x => this.core.getThread(x))
        let threads: IMessageThreadStorage[] = await Promise.all(threadsPromises);
        let chatMessagesPromises = threads.map(x => parseChatMessage(x , this.ownerDid));
        let chatMessages = await Promise.all(chatMessagesPromises)
        return chatMessages.filter(x => x !== null && x);
    }

    private async getChatMessagesIds(): Promise<string[]> {
        return await this.storage.get(this.otherDid);
    }

    async getByIndex(index: number): Promise<ChatMessage> {
        let messages : string[] = await this.storage.get(this.otherDid) || [];
        if(index < 0 || index >= messages.length)
            return null;

        let thread = await this.core.getThread(messages[index])
        return await parseChatMessage(thread , this.ownerDid);
    }

    async remove(){
        try{
            await this.storage.remove(this.otherDid)
        }catch(e){}
    }
    async removeMessage(chatMessage: ChatMessage): Promise<boolean> {
        let id = chatMessage.message.id
        let messageIds : string[] = await this.getChatMessagesIds();
        if(messageIds.length === 0)
            return true
        let filteredMessages = messageIds.filter(x => x !== id)
        if(filteredMessages.length === messageIds.length)
            return true
        await this.storage.update(this.otherDid , filteredMessages)
        return true;
    }

    async addMessage(newMessage: Message) : Promise<boolean> {
        if(newMessage.type != MessageTypes.STANDARD_MESSAGE)
            return false;
        //console.log("adding a message:" , newMessage)
        let chatMessages = await this.getChatMessages();
        
        let messageThread = await this.core.getThread(newMessage.id);
     
        let newChatMessage = await parseChatMessage(messageThread, this.ownerDid);
        if(newChatMessage == null)
            return
        chatMessages.push(newChatMessage);
        let newMessages = chatMessages.sort( (a , b) => a.message.create_time - b.message.create_time).map(x=> x.message.id);
        await this.storage.update(this.otherDid , newMessages );        
    }

    getOther() : string {
        return this.otherDid
    }



}
export class ChatStorage implements IChatStorage{

    constructor(private storage: IStorage , private core : AMICore , private ownerDid : string ){

    }

    async getChatById(otherDid:string) : Promise<IChat>{
        return new Chat(this.storage , this.core , this.ownerDid , otherDid);
    }

 

    async getAll(): Promise<IChat[]>{
        let chatIds = Array.from((await this.storage.getAll()).keys())
        return chatIds.map(x => new Chat(this.storage , this.core, this.ownerDid ,x))
    }

    async addMessage(message: Message): Promise<boolean> {
        let ownerIsSender = message.from === this.ownerDid;
        let other = message.to[0]
        if(!ownerIsSender)
            other = message.from
        let chat = new Chat(this.storage , this.core , this.ownerDid , other);
        return await chat.addMessage(message);
    }
    
    async removeChat(otherDid: string): Promise<boolean> {
        let chat =  new Chat(this.storage , this.core , this.ownerDid , otherDid);
        await chat.remove();
        let messages = await chat.getChatMessages();
        let promises = messages.filter( x => x !== undefined).map( x=> this.removeChatMessage(x))
        let response = await Promise.all(promises);
        return response.reduce( (a,b) => a &&b);
    }

    async removeChatMessage(chatMessage: ChatMessage): Promise<boolean> {
        let message = chatMessage.message
        let ownerIsSender = message.from === this.ownerDid;
        let other = message.to[0]
        if(!ownerIsSender)
            other = message.from
        let chat = await this.getChatById(other)
        let response = await chat.removeMessage(chatMessage);
        return await this.core.removeThread(message) && response;  
    }

}
