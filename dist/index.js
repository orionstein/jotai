'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var react = require('react');
require('stream-lite');

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);

  if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
    if (it) o = it;
    var i = 0;
    return function () {
      if (i >= o.length) return {
        done: true
      };
      return {
        done: false,
        value: o[i++]
      };
    };
  }

  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var hasInitialValue = function hasInitialValue(atom) {
  return 'init' in atom;
};

var IS_EQUAL_PROMISE = Symbol();
var INTERRUPT_PROMISE = Symbol();

var isInterruptablePromise = function isInterruptablePromise(promise) {
  return !!promise[INTERRUPT_PROMISE];
};

var createInterruptablePromise = function createInterruptablePromise(promise) {
  var interrupt;
  var interruptablePromise = new Promise(function (resolve, reject) {
    interrupt = resolve;
    promise.then(resolve, reject);
  });

  interruptablePromise[IS_EQUAL_PROMISE] = function (p) {
    return interruptablePromise === p || promise === p || isInterruptablePromise(promise) && promise[IS_EQUAL_PROMISE](p);
  };

  interruptablePromise[INTERRUPT_PROMISE] = interrupt;
  return interruptablePromise;
};

var READ_ATOM = 'r';
var WRITE_ATOM = 'w';
var COMMIT_ATOM = 'c';
var SUBSCRIBE_ATOM = 's';
var RESTORE_ATOMS = 'h';
var DEV_SUBSCRIBE_STATE = 'n';
var DEV_GET_MOUNTED_ATOMS = 'l';
var DEV_GET_ATOM_STATE = 'a';
var DEV_GET_MOUNTED = 'm';
var createStore = function createStore(initialValues) {
  var _ref4;

  var atomStateMap = new WeakMap();
  var mountedMap = new WeakMap();
  var pendingMap = new Map();
  var stateListeners;
  var mountedAtoms;

  if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
    stateListeners = new Set();
    mountedAtoms = new Set();
  }

  if (initialValues) {
    for (var _iterator = _createForOfIteratorHelperLoose(initialValues), _step; !(_step = _iterator()).done;) {
      var _step$value = _step.value,
          atom = _step$value[0],
          value = _step$value[1];
      var atomState = {
        v: value,
        r: 0,
        d: new Map()
      };

      if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
        Object.freeze(atomState);

        if (!hasInitialValue(atom)) {
          console.warn('Found initial value for derived atom which can cause unexpected behavior', atom);
        }
      }

      atomStateMap.set(atom, atomState);
    }
  }

  var getAtomState = function getAtomState(atom) {
    return atomStateMap.get(atom);
  };

  var setAtomState = function setAtomState(atom, atomState, prevDependencies) {
    if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
      Object.freeze(atomState);
    }

    var isNewAtom = !atomStateMap.has(atom);
    atomStateMap.set(atom, atomState);

    if (!pendingMap.has(atom)) {
      pendingMap.set(atom, [prevDependencies, isNewAtom]);
    }
  };

  var prepareNextAtomState = function prepareNextAtomState(atom, dependencies) {
    var atomState = getAtomState(atom);

    var nextAtomState = _extends({
      r: 0
    }, atomState, {
      d: dependencies ? new Map(Array.from(dependencies).map(function (a) {
        var _getAtomState$r, _getAtomState;

        return [a, (_getAtomState$r = (_getAtomState = getAtomState(a)) == null ? void 0 : _getAtomState.r) != null ? _getAtomState$r : 0];
      })) : (atomState == null ? void 0 : atomState.d) || new Map()
    });

    return [nextAtomState, (atomState == null ? void 0 : atomState.d) || new Map()];
  };

  var setAtomValue = function setAtomValue(atom, value, dependencies, promise) {
    var _atomState$p;

    var _prepareNextAtomState = prepareNextAtomState(atom, dependencies),
        atomState = _prepareNextAtomState[0],
        prevDependencies = _prepareNextAtomState[1];

    if (promise && !((_atomState$p = atomState.p) != null && _atomState$p[IS_EQUAL_PROMISE](promise))) {
      return;
    }

    atomState.c == null ? void 0 : atomState.c();

    if ('e' in atomState || atomState.p || !('v' in atomState) || !Object.is(atomState.v, value)) {
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

  var setAtomReadError = function setAtomReadError(atom, error, dependencies, promise) {
    var _atomState$p2;

    var _prepareNextAtomState2 = prepareNextAtomState(atom, dependencies),
        atomState = _prepareNextAtomState2[0],
        prevDependencies = _prepareNextAtomState2[1];

    if (promise && !((_atomState$p2 = atomState.p) != null && _atomState$p2[IS_EQUAL_PROMISE](promise))) {
      return;
    }

    atomState.c == null ? void 0 : atomState.c();
    delete atomState.p;
    delete atomState.c;
    delete atomState.i;
    atomState.e = error;
    setAtomState(atom, atomState, prevDependencies);
  };

  var setAtomReadPromise = function setAtomReadPromise(atom, promise, dependencies) {
    var _atomState$p3;

    var _prepareNextAtomState3 = prepareNextAtomState(atom, dependencies),
        atomState = _prepareNextAtomState3[0],
        prevDependencies = _prepareNextAtomState3[1];

    if ((_atomState$p3 = atomState.p) != null && _atomState$p3[IS_EQUAL_PROMISE](promise)) {
      return;
    }

    atomState.c == null ? void 0 : atomState.c();
    delete atomState.e;
    var interruptablePromise = createInterruptablePromise(promise);
    atomState.p = interruptablePromise;
    atomState.c = interruptablePromise[INTERRUPT_PROMISE];
    setAtomState(atom, atomState, prevDependencies);
  };

  var setAtomInvalidated = function setAtomInvalidated(atom) {
    var _prepareNextAtomState4 = prepareNextAtomState(atom),
        atomState = _prepareNextAtomState4[0];

    atomState.i = atomState.r;
    setAtomState(atom, atomState);
  };

  var setAtomWritePromise = function setAtomWritePromise(atom, promise, prevPromise) {
    var _prepareNextAtomState5 = prepareNextAtomState(atom),
        atomState = _prepareNextAtomState5[0];

    if (promise) {
      atomState.w = promise;
    } else if (atomState.w === prevPromise) {
      delete atomState.w;
    }

    setAtomState(atom, atomState);
  };

  var scheduleReadAtomState = function scheduleReadAtomState(atom, promise) {
    promise.finally(function () {
      readAtomState(atom, true);
    });
  };

  var readAtomState = function readAtomState(atom, force) {
    if (!force) {
      var _atomState = getAtomState(atom);

      if (_atomState) {
        _atomState.d.forEach(function (_, a) {
          if (a !== atom) {
            var aState = getAtomState(a);

            if (aState && !('e' in aState) && !aState.p && aState.r === aState.i) {
              readAtomState(a, true);
            }
          }
        });

        if (Array.from(_atomState.d.entries()).every(function (_ref) {
          var a = _ref[0],
              r = _ref[1];
          var aState = getAtomState(a);
          return aState && !('e' in aState) && !aState.p && aState.r !== aState.i && aState.r === r;
        })) {
          return _atomState;
        }
      }
    }

    var error;
    var promise;
    var value;
    var dependencies = new Set();

    try {
      var promiseOrValue = atom.read(function (a) {
        dependencies.add(a);
        var aState = a === atom ? getAtomState(a) : readAtomState(a);

        if (aState) {
          if ('e' in aState) {
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

        throw new Error('no atom init');
      });

      if (promiseOrValue instanceof Promise) {
        promise = promiseOrValue.then(function (value) {
          setAtomValue(atom, value, dependencies, promise);
          flushPending();
        }).catch(function (e) {
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

  var readAtom = function readAtom(readingAtom) {
    var atomState = readAtomState(readingAtom);
    return atomState;
  };

  var addAtom = function addAtom(addingAtom) {
    var mounted = mountedMap.get(addingAtom);

    if (!mounted) {
      mounted = mountAtom(addingAtom);
    }

    return mounted;
  };

  var canUnmountAtom = function canUnmountAtom(atom, mounted) {
    return !mounted.l.size && (!mounted.d.size || mounted.d.size === 1 && mounted.d.has(atom));
  };

  var delAtom = function delAtom(deletingAtom) {
    var mounted = mountedMap.get(deletingAtom);

    if (mounted && canUnmountAtom(deletingAtom, mounted)) {
      unmountAtom(deletingAtom);
    }
  };

  var invalidateDependents = function invalidateDependents(atom) {
    var mounted = mountedMap.get(atom);
    mounted == null ? void 0 : mounted.d.forEach(function (dependent) {
      if (dependent === atom) {
        return;
      }

      setAtomInvalidated(dependent);
      invalidateDependents(dependent);
    });
  };

  var writeAtomState = function writeAtomState(atom, update) {
    var writeGetter = function writeGetter(a, unstable_promise) {
      if (unstable_promise === void 0) {
        unstable_promise = false;
      }

      var aState = readAtomState(a);

      if ('e' in aState) {
        throw aState.e;
      }

      if (aState.p) {
        if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
          if (unstable_promise) {
            console.info('promise option in getter is an experimental feature.', a);
          } else {
            console.warn('Reading pending atom state in write operation. We throw a promise for now.', a);
          }
        }

        if (unstable_promise) {
          return aState.p.then(function () {
            return writeGetter(a, unstable_promise);
          });
        }

        throw aState.p;
      }

      if ('v' in aState) {
        return aState.v;
      }

      if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
        console.warn('[Bug] no value found while reading atom in write operation. This is probably a bug.', a);
      }

      throw new Error('no value found');
    };

    var setter = function setter(a, v) {
      var promiseOrVoid;

      if (a === atom) {
        if (!hasInitialValue(a)) {
          throw new Error('no atom init');
        }

        if (v instanceof Promise) {
          promiseOrVoid = v.then(function (resolvedValue) {
            setAtomValue(a, resolvedValue);
            invalidateDependents(a);
            flushPending();
          }).catch(function (e) {
            setAtomReadError(atom, e);
            flushPending();
          });
          setAtomReadPromise(atom, promiseOrVoid);
        } else {
          setAtomValue(a, v);
        }

        invalidateDependents(a);
        flushPending();
      } else {
        promiseOrVoid = writeAtomState(a, v);
      }

      return promiseOrVoid;
    };

    var promiseOrVoid = atom.write(writeGetter, setter, update);

    if (promiseOrVoid instanceof Promise) {
      var promise = promiseOrVoid.finally(function () {
        setAtomWritePromise(atom, null, promise);
        flushPending();
      });
      setAtomWritePromise(atom, promise);
    }

    flushPending();
    return promiseOrVoid;
  };

  var writeAtom = function writeAtom(writingAtom, update) {
    var promiseOrVoid = writeAtomState(writingAtom, update);
    return promiseOrVoid;
  };

  var isActuallyWritableAtom = function isActuallyWritableAtom(atom) {
    return !!atom.write;
  };

  var mountAtom = function mountAtom(atom, initialDependent) {
    var atomState = readAtomState(atom);
    atomState.d.forEach(function (_, a) {
      if (a !== atom) {
        var aMounted = mountedMap.get(a);

        if (aMounted) {
          aMounted.d.add(atom);
        } else {
          mountAtom(a, atom);
        }
      }
    });
    var mounted = {
      d: new Set(initialDependent && [initialDependent]),
      l: new Set(),
      u: undefined
    };
    mountedMap.set(atom, mounted);

    if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
      mountedAtoms.add(atom);
    }

    if (isActuallyWritableAtom(atom) && atom.onMount) {
      var setAtom = function setAtom(update) {
        return writeAtom(atom, update);
      };

      mounted.u = atom.onMount(setAtom);
    }

    return mounted;
  };

  var unmountAtom = function unmountAtom(atom) {
    var _mountedMap$get;

    var onUnmount = (_mountedMap$get = mountedMap.get(atom)) == null ? void 0 : _mountedMap$get.u;

    if (onUnmount) {
      onUnmount();
    }

    mountedMap.delete(atom);

    if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
      mountedAtoms.delete(atom);
    }

    var atomState = getAtomState(atom);

    if (atomState) {
      atomState.d.forEach(function (_, a) {
        if (a !== atom) {
          var mounted = mountedMap.get(a);

          if (mounted) {
            mounted.d.delete(atom);

            if (canUnmountAtom(a, mounted)) {
              unmountAtom(a);
            }
          }
        }
      });
    } else if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
      console.warn('[Bug] could not find atom state to unmount', atom);
    }
  };

  var mountDependencies = function mountDependencies(atom, atomState, prevDependencies) {
    var dependencies = new Set(atomState.d.keys());
    prevDependencies.forEach(function (_, a) {
      if (dependencies.has(a)) {
        dependencies.delete(a);
        return;
      }

      var mounted = mountedMap.get(a);

      if (mounted) {
        mounted.d.delete(atom);

        if (canUnmountAtom(a, mounted)) {
          unmountAtom(a);
        }
      }
    });
    dependencies.forEach(function (a) {
      var mounted = mountedMap.get(a);

      if (mounted) {
        var dependents = mounted.d;
        dependents.add(atom);
      } else {
        mountAtom(a, atom);
      }
    });
  };

  var flushPending = function flushPending() {
    var pending = Array.from(pendingMap);
    pendingMap.clear();
    pending.forEach(function (_ref2) {
      var atom = _ref2[0],
          _ref2$ = _ref2[1],
          prevDependencies = _ref2$[0],
          isNewAtom = _ref2$[1];

      if (prevDependencies) {
        var _atomState2 = getAtomState(atom);

        if (_atomState2) {
          mountDependencies(atom, _atomState2, prevDependencies);
        }
      }

      var mounted = mountedMap.get(atom);
      mounted == null ? void 0 : mounted.l.forEach(function (listener) {
        return listener();
      });

      if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
        stateListeners.forEach(function (l) {
          return l(atom, isNewAtom);
        });
      }
    });
  };

  var commitAtom = function commitAtom(_atom) {
    flushPending();
  };

  var subscribeAtom = function subscribeAtom(atom, callback) {
    var mounted = addAtom(atom);
    var listeners = mounted.l;
    listeners.add(callback);
    return function () {
      listeners.delete(callback);
      delAtom(atom);
    };
  };

  var restoreAtoms = function restoreAtoms(values) {
    for (var _iterator2 = _createForOfIteratorHelperLoose(values), _step2; !(_step2 = _iterator2()).done;) {
      var _step2$value = _step2.value,
          _atom2 = _step2$value[0],
          _value = _step2$value[1];

      if (hasInitialValue(_atom2)) {
        setAtomValue(_atom2, _value);
        invalidateDependents(_atom2);
      }
    }

    flushPending();
  };

  if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
    var _ref3;

    return _ref3 = {}, _ref3[READ_ATOM] = readAtom, _ref3[WRITE_ATOM] = writeAtom, _ref3[COMMIT_ATOM] = commitAtom, _ref3[SUBSCRIBE_ATOM] = subscribeAtom, _ref3[RESTORE_ATOMS] = restoreAtoms, _ref3[DEV_SUBSCRIBE_STATE] = function (l) {
      stateListeners.add(l);
      return function () {
        stateListeners.delete(l);
      };
    }, _ref3[DEV_GET_MOUNTED_ATOMS] = function () {
      return mountedAtoms.values();
    }, _ref3[DEV_GET_ATOM_STATE] = function (a) {
      return atomStateMap.get(a);
    }, _ref3[DEV_GET_MOUNTED] = function (a) {
      return mountedMap.get(a);
    }, _ref3;
  }

  return _ref4 = {}, _ref4[READ_ATOM] = readAtom, _ref4[WRITE_ATOM] = writeAtom, _ref4[COMMIT_ATOM] = commitAtom, _ref4[SUBSCRIBE_ATOM] = subscribeAtom, _ref4[RESTORE_ATOMS] = restoreAtoms, _ref4;
};

var createScopeContainer = function createScopeContainer(initialValues) {
  var store = createStore(initialValues);
  return {
    s: store
  };
};
var ScopeContextMap = new Map();
var getScopeContext = function getScopeContext(scope) {
  if (!ScopeContextMap.has(scope)) {
    ScopeContextMap.set(scope, react.createContext(createScopeContainer()));
  }

  return ScopeContextMap.get(scope);
};

var Provider = function Provider(_ref) {
  var initialValues = _ref.initialValues,
      scope = _ref.scope,
      children = _ref.children;
  var scopeContainerRef = react.useRef();

  if (!scopeContainerRef.current) {
    scopeContainerRef.current = createScopeContainer(initialValues);
  }

  if (typeof process === 'object' && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    useDebugState(scopeContainerRef.current);
  }

  var ScopeContainerContext = getScopeContext(scope);
  return react.createElement(ScopeContainerContext.Provider, {
    value: scopeContainerRef.current
  }, children);
};

var atomToPrintable = function atomToPrintable(atom) {
  return atom.debugLabel || atom.toString();
};

var stateToPrintable = function stateToPrintable(_ref2) {
  var store = _ref2[0],
      atoms = _ref2[1];
  return Object.fromEntries(atoms.flatMap(function (atom) {
    var _store$DEV_GET_MOUNTE, _store$DEV_GET_ATOM_S;

    var mounted = (_store$DEV_GET_MOUNTE = store[DEV_GET_MOUNTED]) == null ? void 0 : _store$DEV_GET_MOUNTE.call(store, atom);

    if (!mounted) {
      return [];
    }

    var dependents = mounted.d;
    var atomState = ((_store$DEV_GET_ATOM_S = store[DEV_GET_ATOM_STATE]) == null ? void 0 : _store$DEV_GET_ATOM_S.call(store, atom)) || {};
    return [[atomToPrintable(atom), {
      value: atomState.e || atomState.p || atomState.w || atomState.v,
      dependents: Array.from(dependents).map(atomToPrintable)
    }]];
  }));
};

var useDebugState = function useDebugState(scopeContainer) {
  var store = scopeContainer.s;

  var _useState = react.useState([]),
      atoms = _useState[0],
      setAtoms = _useState[1];

  react.useEffect(function () {
    var _store$DEV_SUBSCRIBE_;

    var callback = function callback() {
      var _store$DEV_GET_MOUNTE2;

      setAtoms(Array.from(((_store$DEV_GET_MOUNTE2 = store[DEV_GET_MOUNTED_ATOMS]) == null ? void 0 : _store$DEV_GET_MOUNTE2.call(store)) || []));
    };

    var unsubscribe = (_store$DEV_SUBSCRIBE_ = store[DEV_SUBSCRIBE_STATE]) == null ? void 0 : _store$DEV_SUBSCRIBE_.call(store, callback);
    callback();
    return unsubscribe;
  }, [store]);
  react.useDebugValue([store, atoms], stateToPrintable);
};

var keyCount = 0;
function atom(read, write) {
  var key = "atom" + ++keyCount;
  var config = {
    toString: function toString() {
      return key;
    }
  };

  if (typeof read === 'function') {
    config.read = read;
  } else {
    config.init = read;

    config.read = function (get) {
      return get(config);
    };

    config.write = function (get, set, update) {
      set(config, typeof update === 'function' ? update(get(config)) : update);
    };
  }

  if (write) {
    config.write = write;
  }

  return config;
}

var isWritable = function isWritable(atom) {
  return !!atom.write;
};

function useAtom(atom, scope) {
  if ('scope' in atom) {
    console.warn('atom.scope is deprecated. Please do useAtom(atom, scope) instead.');
    scope = atom.scope;
  }

  var ScopeContext = getScopeContext(scope);
  var store = react.useContext(ScopeContext).s;
  var getAtomValue = react.useCallback(function () {
    var atomState = store[READ_ATOM](atom);

    if ('e' in atomState) {
      throw atomState.e;
    }

    if (atomState.p) {
      throw atomState.p;
    }

    if (atomState.w) {
      throw atomState.w;
    }

    if ('v' in atomState) {
      return atomState.v;
    }

    throw new Error('no atom value');
  }, [store, atom]);

  var _useReducer = react.useReducer(getAtomValue, undefined, getAtomValue),
      value = _useReducer[0],
      forceUpdate = _useReducer[1];

  react.useEffect(function () {
    var unsubscribe = store[SUBSCRIBE_ATOM](atom, forceUpdate);
    forceUpdate();
    return unsubscribe;
  }, [store, atom]);
  react.useEffect(function () {
    store[COMMIT_ATOM](atom);
  });
  var setAtom = react.useCallback(function (update) {
    if (isWritable(atom)) {
      return store[WRITE_ATOM](atom, update);
    } else {
      throw new Error('not writable atom');
    }
  }, [store, atom]);
  react.useDebugValue(value);
  return [value, setAtom];
}

exports.Provider = Provider;
exports.SECRET_INTERNAL_getScopeContext = getScopeContext;
exports.atom = atom;
exports.useAtom = useAtom;
