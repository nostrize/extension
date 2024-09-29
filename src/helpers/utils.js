export function singletonFactory({ buildFn }) {
  let obj;

  return {
    getOrCreate: async () => {
      if (obj) {
        return obj;
      }

      obj = await buildFn();

      return obj;
    },
  };
}

export function generateRandomHexString(length) {
  const byteLength = Math.ceil(length / 2);
  const randomBytes = new Uint8Array(byteLength);
  crypto.getRandomValues(randomBytes);

  return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

export function satsToMilliSats({ sats }) {
  return sats * 1000;
}

export function milliSatsToSats({ milliSats, floor = true }) {
  const sats = milliSats / 1000;

  if (floor) {
    return Math.floor(sats);
  }

  return sats;
}

export async function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

export function mergeSettings(target, source) {
  const output = { ...target };

  Object.keys(source).forEach((key) => {
    if (isObject(source[key])) {
      // Recursively merge if both target and source have an object at the same key
      if (key in target && isObject(target[key])) {
        output[key] = mergeSettings(target[key], source[key]);
      } else {
        // Copy the entire source object if it's new or not in target
        output[key] = { ...source[key] };
      }
    } else {
      // Only copy if the target does not already have a value for this key
      if (!(key in target) || target[key] == undefined) {
        output[key] = source[key];
      }
    }
  });

  return output;
}

export function uniqueArrays(...arrays) {
  return [...new Set(arrays.flat())];
}
