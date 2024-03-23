export function logger({ state }) {
  return (...text) => {
    if (state.debug) {
      console.log(...text);
    }
  }
}
