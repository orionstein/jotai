declare type Options = {
    sync?: boolean;
};
export declare function atomWithProxy<Value extends object>(proxyObject: Value, options?: Options): import("jotai").WritableAtom<Value, Value | ((prev: Value) => Value)>;
export {};
