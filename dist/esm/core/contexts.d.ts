import type { Context } from 'react';
import type { Atom, Scope } from './atom';
import type { Store } from './store';
export declare type ScopeContainer = {
    s: Store;
};
export declare const createScopeContainer: (initialValues?: Iterable<readonly [Atom<unknown>, unknown]> | undefined) => ScopeContainer;
declare type ScopeContext = Context<ScopeContainer>;
export declare const getScopeContext: (scope?: Scope | undefined) => ScopeContext;
export declare const hasScopeContext: (scope?: Scope | undefined) => boolean;
export {};
