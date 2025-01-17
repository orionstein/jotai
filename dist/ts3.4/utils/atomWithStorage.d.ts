import { PrimitiveAtom } from 'jotai';
declare type Unsubscribe = () => void;
declare type Storage<Value> = {
    getItem: (key: string) => Value | Promise<Value>;
    setItem: (key: string, newValue: Value) => void | Promise<void>;
    delayInit?: boolean;
    subscribe?: (key: string, callback: (value: Value) => void) => Unsubscribe;
};
declare type StringStorage = {
    getItem: (key: string) => string | null | Promise<string | null>;
    setItem: (key: string, newValue: string) => void | Promise<void>;
};
export declare const createJSONStorage: (getStringStorage: () => StringStorage) => Storage<unknown>;
export declare function atomWithStorage<Value>(key: string, initialValue: Value, storage?: Storage<Value>): PrimitiveAtom<Value>;
export declare function atomWithHash<Value>(key: string, initialValue: Value, options?: {
    serialize?: (val: Value) => string;
    deserialize?: (str: string) => Value;
    delayInit?: boolean;
    replaceState?: boolean;
    subscribe?: (callback: () => void) => () => void;
}): PrimitiveAtom<Value>;
/**
 * @deprecated Use options
 */
export declare function atomWithHash<Value>(key: string, initialValue: Value, deprecatedSerialize?: (val: Value) => string, deprecatedDeserialize?: (str: string) => Value): PrimitiveAtom<Value>;
export {};
