import type { PropsWithChildren } from 'react';
import type { Atom, Scope } from './atom';
import type { ScopeContainer } from './contexts';
export declare const Provider: ({ initialValues, scope, children, }: PropsWithChildren<{
    initialValues?: Iterable<readonly [Atom<unknown>, unknown]> | undefined;
    scope?: Scope | undefined;
}>) => import("react").FunctionComponentElement<import("react").ProviderProps<ScopeContainer>>;
