import { AgentSecureStorage, IAgentStorage } from "@quarkid/agent";

export class MemoryStorage implements IAgentStorage {
    mapper: Map<string, any> = new Map();

    async add(key: string, value: any): Promise<void> {
        this.mapper.set(key, value);
    }

    async get<T>(key: string): Promise<T> {
        return this.mapper.get(key);
    }

    async update<T>(key: string, value: T): Promise<void> {
        this.mapper.set(key, value);
    }

    async getAll<T>(): Promise<Map<string, T>> {
        return this.mapper;
    }

    async remove(key: string): Promise<void> {
        this.mapper.delete(key);
    }
}

export class MemorySecureStorage implements AgentSecureStorage {
    mapper: Map<string, any> = new Map();

    async add(key: string, value: any): Promise<void> {
        this.mapper.set(key, value);
    }

    async get<T>(key: string): Promise<T> {
        return this.mapper.get(key);
    }

    async getAll(): Promise<Map<string, any>> {
        return this.mapper;
    }

    async update<T>(key: string, value: T): Promise<void> {
        this.mapper.set(key, value);
    }


    async remove(key: string): Promise<void> {
        this.mapper.delete(key);
    }
}