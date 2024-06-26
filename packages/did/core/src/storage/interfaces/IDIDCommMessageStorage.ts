import { DIDCommMessage } from "../../models/messaging/didcom-message";
import { IDIDCommThreadStorage } from "./IDIDCommThreadStorage";

export interface IDIDCommMessageStorage<T extends DIDCommMessage<any,any>>{
    add(message: T): Promise<boolean>;
    get(id: string, thid?: string): Promise<T|undefined>;
    getByThread(thid: string): Promise<IDIDCommThreadStorage<T>>
    remove(message: T): Promise<boolean>;
    removeById(id: string , thid?: string): Promise<boolean>;
    removeThread(thid:string ) : Promise<boolean>
}
