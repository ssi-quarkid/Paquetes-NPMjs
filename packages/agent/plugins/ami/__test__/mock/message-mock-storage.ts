import { Message , IMessageStorage , IMessageThreadStorage } from "@quarkid/ami-sdk";




export class MemoryMessageStorage implements IMessageStorage{
    private threads = new Map<string,MemoryMessageThreadStorage>();

    public async add(message: Message): Promise<boolean>{
        let thid = message.thid;
        if(!this.threads.has(thid))
            this.threads.set(thid , new MemoryMessageThreadStorage(thid))
        
        let thread =  this.threads.get(thid)
        return thread.add(message)
    }



    public async get(id: string, thid?: string): Promise<Message | undefined>{
        
        if(thid)
            return await this.getFromThread(id, thid );

        let threadArray = Array.from(this.threads.values());

        for(let index = 0 ; index < threadArray.length ; index++ ){
            let message = threadArray[index].get(id)
            if(message)
                return message;
        }
        
    }

    private async getFromThread(id:string , thid?: string) :  Promise<Message | undefined>{
        return this.threads.get(thid).get(id);
    }

    public async getByThread(thid: string): Promise<IMessageThreadStorage | undefined>{
        return this.threads.get(thid)
    }
    public async remove(message: Message) : Promise<boolean>{
        return this.threads.get(message.thid).remove(message.id)
    }

    public async removeById(id: string, thid?: string): Promise<boolean> {
        let message =  await this.get(id, thid);
        if(!message)
            return false

        return await this.remove(message)
    }

    public async removeThread(thid: string): Promise<boolean> {
        if(!this.threads.has(thid))
            return false
        return this.threads.delete(thid)
    }
}

export class MemoryMessageThreadStorage implements IMessageThreadStorage{
    private messages = new Array<Message>();
    constructor(public thid:string){}
    public async getThid() : Promise<string> { return this.thid}
    public async getMessageCount(): Promise<number> { return this.messages.length}
    public async add(message: Message): Promise<boolean> { 
        if(await this.has(message))
            return false
        return this.messages.push(message) > 0
    }
    public async has(message: Message) : Promise<boolean> {
        return this.messages.findIndex(x => x.id === message.id)  >= 0 
    }
    public async getThreadMessagesId() : Promise<string[]> {
        return this.messages.map( x => x.id);
    }

    public async getAll(): Promise<Message[]> { return this.messages}
    public async getByIndex(index: number): Promise<Message | undefined> {return this.messages[index]}
    public async get(id: string): Promise<Message | undefined> { 
        let message =  this.messages.filter( x => x.id == id).pop()
        if(message !== undefined)
            return message
    }
    public async remove(id: string): Promise<boolean> {
        let index = this.messages.findIndex( x=>  x.id === id) 
        if (index <0 )
            return false
        this.messages.splice(index, 1);
        return true
    }
    public async removeByIndex(index: number): Promise<boolean> {
        if(index <= 0 || index >= this.messages.length)
            return false;
        this.messages.splice(index, 1);
        return true
    }
}