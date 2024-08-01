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
  _leftSymbol: Symbol("nostrize either left"),
  _rightSymbol: Symbol("nostrize either right"),

  left: (error) => ({ type: Either._leftSymbol, error }),
  right: (value) => ({ type: Either._rightSymbol, value }),

  isLeft: (either) => either.type === Either._leftSymbol,
  isRight: (either) => either.type === Either._rightSymbol,

  toObject: (either) => ({
    type: either.type.toString(),
    error: Either.isLeft(either) ? either.error : undefined,
    value: Either.isRight(either) ? either.value : undefined,
  }),

  fromObject: ({ type, error, value }) =>
    type === Either._leftSymbol.toString()
      ? Either.left(error)
      : Either.right(value),

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

  getOrElseThrow: async ({ eitherFn }) => {
    const either = await eitherFn();

    if (Either.isLeft(either)) {
      throw new Error(Either.getLeft(either));
    }

    return Either.getRight(either);
  },

  getOrElseReject: (either) => {
    return new Promise((resolve, reject) => {
      if (Either.isLeft(either)) {
        return reject(Either.getLeft(either));
      }

      return resolve(Either.getRight(either));
    });
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
