import { IAgentStorage } from '@quarkid/agent';
export declare class FileSystemStorage implements IAgentStorage {
    readonly filepath: string;
    constructor(params: {
        filepath: string;
    });
    update<T>(key: string, value: T): Promise<void>;
    getAll<T>(): Promise<Map<string, any>>;
    remove(key: string): Promise<void>;
    add(key: string, data: any): Promise<void>;
    get(key: string): Promise<any>;
    private getData;
    private saveData;
}
