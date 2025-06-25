import { AgentSecureStorage, IAgentStorage } from "@quarkid/agent";
export declare class MemoryStorage implements IAgentStorage {
    mapper: Map<string, any>;
    add(key: string, value: any): Promise<void>;
    get<T>(key: string): Promise<T>;
    update<T>(key: string, value: T): Promise<void>;
    getAll<T>(): Promise<Map<string, T>>;
    remove(key: string): Promise<void>;
}
export declare class MemorySecureStorage implements AgentSecureStorage {
    mapper: Map<string, any>;
    add(key: string, value: any): Promise<void>;
    get<T>(key: string): Promise<T>;
    getAll(): Promise<Map<string, any>>;
    update<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
}
