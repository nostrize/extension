export function logger(debug) {
  return (...text) => {
    if (debug && debug.log) {
      console.trace(
        "%c" +
          debug.namespace +
          "%c " +
          text.map((t) => JSON.stringify(t)).join(" "),
        "color: white;background-color: rgb(130, 80, 223)",
        "color: auto",
      );
    }
  };
}

export function tapper(debug) {
  let tapCount = 1;

  return (object) => {
    if (debug && debug.log) {
      console.log(debug.namespace, `tap no: ${tapCount++}`, object);
    }

    return object;
  };
}
