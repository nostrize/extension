export function logger(debug) {
  return (...text) => {
    if (debug && debug.enabled) {
      console.log(debug.namespace, ...text);
    }
  };
}

export function tapper(debug) {
  let tapCount = 1;

  return (object) => {
    if (debug && debug.enabled) {
      console.log(debug.namespace, `tap no: ${tapCount++}`, object);
    }

    return object;
  };
}
