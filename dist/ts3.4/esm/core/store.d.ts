import { Atom, WritableAtom } from './atom';
declare type AnyAtom = Atom<unknown>;
declare type OnUnmount = () => void;
declare type NonPromise<T> = T extends Promise<infer V> ? V : T;
declare const IS_EQUAL_PROMISE: unique symbol;
declare const INTERRUPT_PROMISE: unique symbol;
declare type InterruptablePromise = Promise<void> & {
    [IS_EQUAL_PROMISE]: (p: Promise<void>) => boolean;
    [INTERRUPT_PROMISE]: () => void;
};
declare type Revision = number;
declare type InvalidatedRevision = number;
declare type ReadDependencies = Map<AnyAtom, Revision>;
export declare type AtomState<Value = unknown> = {
    e?: unknown;
    p?: InterruptablePromise;
    c?: () => void;
    w?: Promise<void>;
    v?: NonPromise<Value>;
    r: Revision;
    i?: InvalidatedRevision;
    d: ReadDependencies;
};
declare type Listeners = Set<() => void>;
declare type Dependents = Set<AnyAtom>;
declare type Mounted = {
    l: Listeners;
    d: Dependents;
    u: OnUnmount | void;
};
declare type StateListener = (updatedAtom: AnyAtom, isNewAtom: boolean) => void;
export declare const READ_ATOM = "r";
export declare const WRITE_ATOM = "w";
export declare const COMMIT_ATOM = "c";
export declare const SUBSCRIBE_ATOM = "s";
export declare const RESTORE_ATOMS = "h";
export declare const DEV_SUBSCRIBE_STATE = "n";
export declare const DEV_GET_MOUNTED_ATOMS = "l";
export declare const DEV_GET_ATOM_STATE = "a";
export declare const DEV_GET_MOUNTED = "m";
export declare const createStore: (initialValues?: Iterable<readonly [
    AnyAtom,
    unknown
]> | undefined) => {
    r: <Value>(readingAtom: Atom<Value>) => AtomState<Value>;
    w: <Value_1, Update>(writingAtom: WritableAtom<Value_1, Update>, update: Update) => void | Promise<void>;
    c: (_atom: AnyAtom) => void;
    s: (atom: AnyAtom, callback: () => void) => () => void;
    h: (values: Iterable<readonly [
        AnyAtom,
        unknown
    ]>) => void;
    n: (l: StateListener) => () => void;
    l: () => IterableIterator<AnyAtom>;
    a: (a: AnyAtom) => AtomState<unknown> | undefined;
    m: (a: AnyAtom) => Mounted | undefined;
} | {
    r: <Value>(readingAtom: Atom<Value>) => AtomState<Value>;
    w: <Value_1, Update>(writingAtom: WritableAtom<Value_1, Update>, update: Update) => void | Promise<void>;
    c: (_atom: AnyAtom) => void;
    s: (atom: AnyAtom, callback: () => void) => () => void;
    h: (values: Iterable<readonly [
        AnyAtom,
        unknown
    ]>) => void;
    n?: undefined;
    l?: undefined;
    a?: undefined;
    m?: undefined;
};
export declare type Store = ReturnType<typeof createStore>;
export {};
