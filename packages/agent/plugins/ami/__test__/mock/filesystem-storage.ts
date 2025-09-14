import { accessSync, readFileSync, writeFileSync, existsSync , constants} from 'fs';
import { IStorage } from '@quarkid/ami-sdk';

export class FileSystemStorage implements IStorage {
    public readonly filepath: string;

    constructor(params: {
        filepath: string
    }) {
        this.filepath = params.filepath;
        this.ensureFileExists();

    }


    private ensureFileExists() {
        try {
            accessSync(this.filepath, constants.F_OK);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, create it
                writeFileSync(this.filepath, '{}');
            }
        }
    }
    async update(key: string, value: any): Promise<void> {
        const map = this.getData();
        map.set(key, value);
        this.saveData(map);
    }

    async getAll<T>(): Promise<Map<string, any>> {
        return this.getData();
    }

    async remove(key: string): Promise<void> {
        const map = this.getData();
        map.delete(key);
        this.saveData(map);
    }

    async add(key: string, data: any): Promise<void> {
        const map = this.getData();
        
        map.set(key, data);
        this.saveData(map);
    }

    async get<T=any>(key: string): Promise<T> {
        return this.getData().get(key);
    }

    private getData(): Map<string, any> {
        if (!existsSync(this.filepath)) {
            return new Map();
        }

        const file = readFileSync(this.filepath, {
            encoding: "utf-8",
        });

        if (!file) {
            return new Map();
        }

        try{
            return new Map(Object.entries(JSON.parse(file)));
        }catch(error){
            return new Map();
        }
    }

    private saveData(data: Map<string, any>) {
        writeFileSync(this.filepath, JSON.stringify(Object.fromEntries(data)), {
            encoding: "utf-8",
        });
    }
}