import { ChatMessage } from "../chat-message/chat-message"
import { Message } from "@quarkid/ami-core"


export interface IChatStorage {
    getChatById(otherDid:string): Promise<IChat>
    getAll(): Promise<IChat[]>
    removeChat(id: string): Promise<boolean>
    removeChatMessage(message: ChatMessage): Promise<boolean>
    addMessage(message: Message): Promise<boolean>
}

export interface IChat {
    removeMessage(message: ChatMessage): Promise<boolean>
    getByIndex(index: number): Promise<ChatMessage>
    getChatMessages(): Promise<ChatMessage[]>
    getOther(): string
}

