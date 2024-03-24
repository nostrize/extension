export function logger(debug) {
  return (...text) => {
    if (debug && debug.enabled) {
      console.log(debug.namespace, ...text);
    }
  };
}
