import { createContext, useRef, createElement, useState, useEffect, useDebugValue, useContext, useCallback, useReducer } from 'react';
import 'stream-lite';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const hasInitialValue = (atom) => "init" in atom;
const IS_EQUAL_PROMISE = Symbol();
const INTERRUPT_PROMISE = Symbol();
const isInterruptablePromise = (promise) => !!promise[INTERRUPT_PROMISE];
const createInterruptablePromise = (promise) => {
  let interrupt;
  const interruptablePromise = new Promise((resolve, reject) => {
    interrupt = resolve;
    promise.then(resolve, reject);
  });
  interruptablePromise[IS_EQUAL_PROMISE] = (p) => interruptablePromise === p || promise === p || isInterruptablePromise(promise) && promise[IS_EQUAL_PROMISE](p);
  interruptablePromise[INTERRUPT_PROMISE] = interrupt;
  return interruptablePromise;
};
const READ_ATOM = "r";
const WRITE_ATOM = "w";
const COMMIT_ATOM = "c";
const SUBSCRIBE_ATOM = "s";
const RESTORE_ATOMS = "h";
const DEV_SUBSCRIBE_STATE = "n";
const DEV_GET_MOUNTED_ATOMS = "l";
const DEV_GET_ATOM_STATE = "a";
const DEV_GET_MOUNTED = "m";
const createStore = (initialValues) => {
  const atomStateMap = new WeakMap();
  const mountedMap = new WeakMap();
  const pendingMap = new Map();
  let stateListeners;
  let mountedAtoms;
  if (typeof process === "object" && process.env.NODE_ENV !== "production") {
    stateListeners = new Set();
    mountedAtoms = new Set();
  }
  if (initialValues) {
    for (const [atom, value] of initialValues) {
      const atomState = { v: value, r: 0, d: new Map() };
      if (typeof process === "object" && process.env.NODE_ENV !== "production") {
        Object.freeze(atomState);
        if (!hasInitialValue(atom)) {
          console.warn("Found initial value for derived atom which can cause unexpected behavior", atom);
        }
      }
      atomStateMap.set(atom, atomState);
    }
  }
  const getAtomState = (atom) => atomStateMap.get(atom);
  const setAtomState = (atom, atomState, prevDependencies) => {
    if (typeof process === "object" && process.env.NODE_ENV !== "production") {
      Object.freeze(atomState);
    }
    const isNewAtom = !atomStateMap.has(atom);
    atomStateMap.set(atom, atomState);
    if (!pendingMap.has(atom)) {
      pendingMap.set(atom, [prevDependencies, isNewAtom]);
    }
  };
  const prepareNextAtomState = (atom, dependencies) => {
    const atomState = getAtomState(atom);
    const nextAtomState = __spreadProps(__spreadValues({
      r: 0
    }, atomState), {
      d: dependencies ? new Map(Array.from(dependencies).map((a) => {
        var _a, _b;
        return [a, (_b = (_a = getAtomState(a)) == null ? void 0 : _a.r) != null ? _b : 0];
      })) : (atomState == null ? void 0 : atomState.d) || new Map()
    });
    return [nextAtomState, (atomState == null ? void 0 : atomState.d) || new Map()];
  };
  const setAtomValue = (atom, value, dependencies, promise) => {
    var _a, _b;
    const [atomState, prevDependencies] = prepareNextAtomState(atom, dependencies);
    if (promise && !((_a = atomState.p) == null ? void 0 : _a[IS_EQUAL_PROMISE](promise))) {
      return;
    }
    (_b = atomState.c) == null ? void 0 : _b.call(atomState);
    if ("e" in atomState || atomState.p || !("v" in atomState) || !Object.is(atomState.v, value)) {
      ++atomState.r;
      if (atomState.d.has(atom)) {
        atomState.d.set(atom, atomState.r);
      }
    }
    atomState.v = value;
    delete atomState.e;
    delete atomState.p;
    delete atomState.c;
    delete atomState.i;
    setAtomState(atom, atomState, dependencies && prevDependencies);
  };
  const setAtomReadError = (atom, error, dependencies, promise) => {
    var _a, _b;
    const [atomState, prevDependencies] = prepareNextAtomState(atom, dependencies);
    if (promise && !((_a = atomState.p) == null ? void 0 : _a[IS_EQUAL_PROMISE](promise))) {
      return;
    }
    (_b = atomState.c) == null ? void 0 : _b.call(atomState);
    delete atomState.p;
    delete atomState.c;
    delete atomState.i;
    atomState.e = error;
    setAtomState(atom, atomState, prevDependencies);
  };
  const setAtomReadPromise = (atom, promise, dependencies) => {
    var _a, _b;
    const [atomState, prevDependencies] = prepareNextAtomState(atom, dependencies);
    if ((_a = atomState.p) == null ? void 0 : _a[IS_EQUAL_PROMISE](promise)) {
      return;
    }
    (_b = atomState.c) == null ? void 0 : _b.call(atomState);
    delete atomState.e;
    const interruptablePromise = createInterruptablePromise(promise);
    atomState.p = interruptablePromise;
    atomState.c = interruptablePromise[INTERRUPT_PROMISE];
    setAtomState(atom, atomState, prevDependencies);
  };
  const setAtomInvalidated = (atom) => {
    const [atomState] = prepareNextAtomState(atom);
    atomState.i = atomState.r;
    setAtomState(atom, atomState);
  };
  const setAtomWritePromise = (atom, promise, prevPromise) => {
    const [atomState] = prepareNextAtomState(atom);
    if (promise) {
      atomState.w = promise;
    } else if (atomState.w === prevPromise) {
      delete atomState.w;
    }
    setAtomState(atom, atomState);
  };
  const scheduleReadAtomState = (atom, promise) => {
    promise.finally(() => {
      readAtomState(atom, true);
    });
  };
  const readAtomState = (atom, force) => {
    if (!force) {
      const atomState = getAtomState(atom);
      if (atomState) {
        atomState.d.forEach((_, a) => {
          if (a !== atom) {
            const aState = getAtomState(a);
            if (aState && !("e" in aState) && !aState.p && aState.r === aState.i) {
              readAtomState(a, true);
            }
          }
        });
        if (Array.from(atomState.d.entries()).every(([a, r]) => {
          const aState = getAtomState(a);
          return aState && !("e" in aState) && !aState.p && aState.r !== aState.i && aState.r === r;
        })) {
          return atomState;
        }
      }
    }
    let error;
    let promise;
    let value;
    const dependencies = new Set();
    try {
      const promiseOrValue = atom.read((a) => {
        dependencies.add(a);
        const aState = a === atom ? getAtomState(a) : readAtomState(a);
        if (aState) {
          if ("e" in aState) {
            throw aState.e;
          }
          if (aState.p) {
            throw aState.p;
          }
          return aState.v;
        }
        if (hasInitialValue(a)) {
          return a.init;
        }
        throw new Error("no atom init");
      });
      if (promiseOrValue instanceof Promise) {
        promise = promiseOrValue.then((value2) => {
          setAtomValue(atom, value2, dependencies, promise);
          flushPending();
        }).catch((e) => {
          if (e instanceof Promise) {
            scheduleReadAtomState(atom, e);
            return e;
          }
          setAtomReadError(atom, e, dependencies, promise);
          flushPending();
        });
      } else {
        value = promiseOrValue;
      }
    } catch (errorOrPromise) {
      if (errorOrPromise instanceof Promise) {
        promise = errorOrPromise;
      } else {
        error = errorOrPromise;
      }
    }
    if (error) {
      setAtomReadError(atom, error, dependencies);
    } else if (promise) {
      setAtomReadPromise(atom, promise, dependencies);
    } else {
      setAtomValue(atom, value, dependencies);
    }
    return getAtomState(atom);
  };
  const readAtom = (readingAtom) => {
    const atomState = readAtomState(readingAtom);
    return atomState;
  };
  const addAtom = (addingAtom) => {
    let mounted = mountedMap.get(addingAtom);
    if (!mounted) {
      mounted = mountAtom(addingAtom);
    }
    return mounted;
  };
  const canUnmountAtom = (atom, mounted) => !mounted.l.size && (!mounted.d.size || mounted.d.size === 1 && mounted.d.has(atom));
  const delAtom = (deletingAtom) => {
    const mounted = mountedMap.get(deletingAtom);
    if (mounted && canUnmountAtom(deletingAtom, mounted)) {
      unmountAtom(deletingAtom);
    }
  };
  const invalidateDependents = (atom) => {
    const mounted = mountedMap.get(atom);
    mounted == null ? void 0 : mounted.d.forEach((dependent) => {
      if (dependent === atom) {
        return;
      }
      setAtomInvalidated(dependent);
      invalidateDependents(dependent);
    });
  };
  const writeAtomState = (atom, update) => {
    const writeGetter = (a, unstable_promise = false) => {
      const aState = readAtomState(a);
      if ("e" in aState) {
        throw aState.e;
      }
      if (aState.p) {
        if (typeof process === "object" && process.env.NODE_ENV !== "production") {
          if (unstable_promise) {
            console.info("promise option in getter is an experimental feature.", a);
          } else {
            console.warn("Reading pending atom state in write operation. We throw a promise for now.", a);
          }
        }
        if (unstable_promise) {
          return aState.p.then(() => writeGetter(a, unstable_promise));
        }
        throw aState.p;
      }
      if ("v" in aState) {
        return aState.v;
      }
      if (typeof process === "object" && process.env.NODE_ENV !== "production") {
        console.warn("[Bug] no value found while reading atom in write operation. This is probably a bug.", a);
      }
      throw new Error("no value found");
    };
    const setter = (a, v) => {
      let promiseOrVoid2;
      if (a === atom) {
        if (!hasInitialValue(a)) {
          throw new Error("no atom init");
        }
        if (v instanceof Promise) {
          promiseOrVoid2 = v.then((resolvedValue) => {
            setAtomValue(a, resolvedValue);
            invalidateDependents(a);
            flushPending();
          }).catch((e) => {
            setAtomReadError(atom, e);
            flushPending();
          });
          setAtomReadPromise(atom, promiseOrVoid2);
        } else {
          setAtomValue(a, v);
        }
        invalidateDependents(a);
        flushPending();
      } else {
        promiseOrVoid2 = writeAtomState(a, v);
      }
      return promiseOrVoid2;
    };
    const promiseOrVoid = atom.write(writeGetter, setter, update);
    if (promiseOrVoid instanceof Promise) {
      const promise = promiseOrVoid.finally(() => {
        setAtomWritePromise(atom, null, promise);
        flushPending();
      });
      setAtomWritePromise(atom, promise);
    }
    flushPending();
    return promiseOrVoid;
  };
  const writeAtom = (writingAtom, update) => {
    const promiseOrVoid = writeAtomState(writingAtom, update);
    return promiseOrVoid;
  };
  const isActuallyWritableAtom = (atom) => !!atom.write;
  const mountAtom = (atom, initialDependent) => {
    const atomState = readAtomState(atom);
    atomState.d.forEach((_, a) => {
      if (a !== atom) {
        const aMounted = mountedMap.get(a);
        if (aMounted) {
          aMounted.d.add(atom);
        } else {
          mountAtom(a, atom);
        }
      }
    });
    const mounted = {
      d: new Set(initialDependent && [initialDependent]),
      l: new Set(),
      u: void 0
    };
    mountedMap.set(atom, mounted);
    if (typeof process === "object" && process.env.NODE_ENV !== "production") {
      mountedAtoms.add(atom);
    }
    if (isActuallyWritableAtom(atom) && atom.onMount) {
      const setAtom = (update) => writeAtom(atom, update);
      mounted.u = atom.onMount(setAtom);
    }
    return mounted;
  };
  const unmountAtom = (atom) => {
    var _a;
    const onUnmount = (_a = mountedMap.get(atom)) == null ? void 0 : _a.u;
    if (onUnmount) {
      onUnmount();
    }
    mountedMap.delete(atom);
    if (typeof process === "object" && process.env.NODE_ENV !== "production") {
      mountedAtoms.delete(atom);
    }
    const atomState = getAtomState(atom);
    if (atomState) {
      atomState.d.forEach((_, a) => {
        if (a !== atom) {
          const mounted = mountedMap.get(a);
          if (mounted) {
            mounted.d.delete(atom);
            if (canUnmountAtom(a, mounted)) {
              unmountAtom(a);
            }
          }
        }
      });
    } else if (typeof process === "object" && process.env.NODE_ENV !== "production") {
      console.warn("[Bug] could not find atom state to unmount", atom);
    }
  };
  const mountDependencies = (atom, atomState, prevDependencies) => {
    const dependencies = new Set(atomState.d.keys());
    prevDependencies.forEach((_, a) => {
      if (dependencies.has(a)) {
        dependencies.delete(a);
        return;
      }
      const mounted = mountedMap.get(a);
      if (mounted) {
        mounted.d.delete(atom);
        if (canUnmountAtom(a, mounted)) {
          unmountAtom(a);
        }
      }
    });
    dependencies.forEach((a) => {
      const mounted = mountedMap.get(a);
      if (mounted) {
        const dependents = mounted.d;
        dependents.add(atom);
      } else {
        mountAtom(a, atom);
      }
    });
  };
  const flushPending = () => {
    const pending = Array.from(pendingMap);
    pendingMap.clear();
    pending.forEach(([atom, [prevDependencies, isNewAtom]]) => {
      if (prevDependencies) {
        const atomState = getAtomState(atom);
        if (atomState) {
          mountDependencies(atom, atomState, prevDependencies);
        }
      }
      const mounted = mountedMap.get(atom);
      mounted == null ? void 0 : mounted.l.forEach((listener) => listener());
      if (typeof process === "object" && process.env.NODE_ENV !== "production") {
        stateListeners.forEach((l) => l(atom, isNewAtom));
      }
    });
  };
  const commitAtom = (_atom) => {
    flushPending();
  };
  const subscribeAtom = (atom, callback) => {
    const mounted = addAtom(atom);
    const listeners = mounted.l;
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
      delAtom(atom);
    };
  };
  const restoreAtoms = (values) => {
    for (const [atom, value] of values) {
      if (hasInitialValue(atom)) {
        setAtomValue(atom, value);
        invalidateDependents(atom);
      }
    }
    flushPending();
  };
  if (typeof process === "object" && process.env.NODE_ENV !== "production") {
    return {
      [READ_ATOM]: readAtom,
      [WRITE_ATOM]: writeAtom,
      [COMMIT_ATOM]: commitAtom,
      [SUBSCRIBE_ATOM]: subscribeAtom,
      [RESTORE_ATOMS]: restoreAtoms,
      [DEV_SUBSCRIBE_STATE]: (l) => {
        stateListeners.add(l);
        return () => {
          stateListeners.delete(l);
        };
      },
      [DEV_GET_MOUNTED_ATOMS]: () => mountedAtoms.values(),
      [DEV_GET_ATOM_STATE]: (a) => atomStateMap.get(a),
      [DEV_GET_MOUNTED]: (a) => mountedMap.get(a)
    };
  }
  return {
    [READ_ATOM]: readAtom,
    [WRITE_ATOM]: writeAtom,
    [COMMIT_ATOM]: commitAtom,
    [SUBSCRIBE_ATOM]: subscribeAtom,
    [RESTORE_ATOMS]: restoreAtoms
  };
};

const createScopeContainer = (initialValues) => {
  const store = createStore(initialValues);
  return { s: store };
};
const ScopeContextMap = new Map();
const getScopeContext = (scope) => {
  if (!ScopeContextMap.has(scope)) {
    ScopeContextMap.set(scope, createContext(createScopeContainer()));
  }
  return ScopeContextMap.get(scope);
};

const Provider = ({
  initialValues,
  scope,
  children
}) => {
  const scopeContainerRef = useRef();
  if (!scopeContainerRef.current) {
    scopeContainerRef.current = createScopeContainer(initialValues);
  }
  if (typeof process === "object" && process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    useDebugState(scopeContainerRef.current);
  }
  const ScopeContainerContext = getScopeContext(scope);
  return createElement(ScopeContainerContext.Provider, {
    value: scopeContainerRef.current
  }, children);
};
const atomToPrintable = (atom) => atom.debugLabel || atom.toString();
const stateToPrintable = ([store, atoms]) => Object.fromEntries(atoms.flatMap((atom) => {
  var _a, _b;
  const mounted = (_a = store[DEV_GET_MOUNTED]) == null ? void 0 : _a.call(store, atom);
  if (!mounted) {
    return [];
  }
  const dependents = mounted.d;
  const atomState = ((_b = store[DEV_GET_ATOM_STATE]) == null ? void 0 : _b.call(store, atom)) || {};
  return [
    [
      atomToPrintable(atom),
      {
        value: atomState.e || atomState.p || atomState.w || atomState.v,
        dependents: Array.from(dependents).map(atomToPrintable)
      }
    ]
  ];
}));
const useDebugState = (scopeContainer) => {
  const store = scopeContainer.s;
  const [atoms, setAtoms] = useState([]);
  useEffect(() => {
    var _a;
    const callback = () => {
      var _a2;
      setAtoms(Array.from(((_a2 = store[DEV_GET_MOUNTED_ATOMS]) == null ? void 0 : _a2.call(store)) || []));
    };
    const unsubscribe = (_a = store[DEV_SUBSCRIBE_STATE]) == null ? void 0 : _a.call(store, callback);
    callback();
    return unsubscribe;
  }, [store]);
  useDebugValue([store, atoms], stateToPrintable);
};

let keyCount = 0;
function atom(read, write) {
  const key = `atom${++keyCount}`;
  const config = {
    toString: () => key
  };
  if (typeof read === "function") {
    config.read = read;
  } else {
    config.init = read;
    config.read = (get) => get(config);
    config.write = (get, set, update) => {
      set(config, typeof update === "function" ? update(get(config)) : update);
    };
  }
  if (write) {
    config.write = write;
  }
  return config;
}

const isWritable = (atom) => !!atom.write;
function useAtom(atom, scope) {
  if ("scope" in atom) {
    console.warn("atom.scope is deprecated. Please do useAtom(atom, scope) instead.");
    scope = atom.scope;
  }
  const ScopeContext = getScopeContext(scope);
  const store = useContext(ScopeContext).s;
  const getAtomValue = useCallback(() => {
    const atomState = store[READ_ATOM](atom);
    if ("e" in atomState) {
      throw atomState.e;
    }
    if (atomState.p) {
      throw atomState.p;
    }
    if (atomState.w) {
      throw atomState.w;
    }
    if ("v" in atomState) {
      return atomState.v;
    }
    throw new Error("no atom value");
  }, [store, atom]);
  const [value, forceUpdate2] = useReducer(getAtomValue, void 0, getAtomValue);
  useEffect(() => {
    const unsubscribe = store[SUBSCRIBE_ATOM](atom, forceUpdate2);
    forceUpdate2();
    return unsubscribe;
  }, [store, atom]);
  useEffect(() => {
    store[COMMIT_ATOM](atom);
  });
  const setAtom = useCallback((update) => {
    if (isWritable(atom)) {
      return store[WRITE_ATOM](atom, update);
    } else {
      throw new Error("not writable atom");
    }
  }, [store, atom]);
  useDebugValue(value);
  return [value, setAtom];
}

export { Provider, getScopeContext as SECRET_INTERNAL_getScopeContext, atom, useAtom };
