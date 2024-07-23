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

export const Either = {
  left: (error) => ({ type: "left", error }),
  right: (value) => ({ type: "right", value }),

  isLeft: (either) => either.type === "left",
  isRight: (either) => either.type === "right",

  getLeft: (either) => {
    if (Either.isLeft(either)) {
      return either.error;
    }

    throw new Error("Tried to getLeft from a Right");
  },

  getRight: (either) => {
    if (Either.isRight(either)) {
      return either.value;
    }

    throw new Error("Tried to getRight from a Left");
  },

  getOrElseThrow: async (asyncFn) => {
    const either = await asyncFn();

    if (Either.isLeft(either)) {
      throw new Error(Either.getLeft(either));
    }

    return Either.getRight(either);
  },
};

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
