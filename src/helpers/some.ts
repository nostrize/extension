export type Just<T> = { type: "Just"; value: T };
export type None = { type: "None" };

interface SomeFunctions<T> {
  map: <U>(f: (value: T) => U) => Some<U>;
  getOrElse: (defaultValue: T) => T;
}

export type Some<T> = (Just<T> | None) & SomeFunctions<T>;

export const None: None = { type: "None" };

export function Just<T>(value: T): Just<T> {
  return { type: "Just", value };
}

// Implementation of Some
export function Some<T>(input: T | null | undefined): Some<T> {
  const isNone = !input;
  const isJust = !isNone;

  const map = <U>(f: (v: T) => U): Some<U> => {
    if (isJust) {
      return Some(f(input));
    }

    return Some(null as U);
  };

  const getOrElse = (defaultValue: T): T => {
    if (isJust) {
      return input;
    }

    return defaultValue;
  };

  if (isNone) {
    return {
      type: "None",
      map,
      getOrElse,
    };
  }

  return {
    type: "Just",
    value: input,
    map,
    getOrElse,
  };
}
