import { DIDCommMessage } from "../../models/messaging/didcom-message";

export interface IDIDCommThreadStorage<T extends DIDCommMessage<any,any>>{
    getThid(): Promise<string>
    getMessageCount(): Promise<number>
    add(message: T): Promise<boolean>
    has(message: T): Promise<boolean>
    getAll(): Promise<T[]>
    getByIndex(index: number): Promise<T|undefined>
    get(id: string): Promise<T|undefined>
    remove(id: string): Promise<boolean>
    removeByIndex(id: number): Promise<boolean>
    getThreadMessagesId() : Promise<string[]>
}