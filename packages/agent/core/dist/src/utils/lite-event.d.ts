export interface ILiteEvent<T> {
    on(handler: {
        (data?: T): void | Promise<void>;
    }): void;
    off(handler: {
        (data?: T): void | Promise<void>;
    }): void;
    once(handler: {
        (data?: T): void | Promise<void>;
    }): any;
}
export declare class LiteEvent<T> implements ILiteEvent<T> {
    private handlers;
    on(handler: {
        (data?: T): void | Promise<void>;
    }): void;
    off(handler: {
        (data?: T): void | Promise<void>;
    }): void;
    trigger(data?: T): Promise<void>;
    once(handler: {
        (data?: T): void | Promise<void>;
    }): void;
    expose(): ILiteEvent<T>;
}
