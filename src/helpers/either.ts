export type Left<L> = { type: symbol; error: L };
export type Right<R> = { type: symbol; value: R };
export type Either<L, R> = Left<L> | Right<R>;

export const Either = {
  _leftSymbol: Symbol("nostrize either left"),
  _rightSymbol: Symbol("nostrize either right"),

  left: <L, R = never>(error: L): Either<L, R> => ({
    type: Either._leftSymbol,
    error,
  }),

  right: <R, L = never>(value: R): Either<L, R> => ({
    type: Either._rightSymbol,
    value,
  }),

  isLeft: <L, R>(either: Either<L, R>): either is Left<L> =>
    either.type === Either._leftSymbol,

  isRight: <L, R>(either: Either<L, R>): either is Right<R> =>
    either.type === Either._rightSymbol,

  toObject: <L, R>(either: Either<L, R>) => ({
    type: either.type.toString(),
    error: Either.isLeft(either) ? either.error : undefined,
    value: Either.isRight(either) ? either.value : undefined,
  }),

  fromObject: <L, R>({
    type,
    error,
    value,
  }: {
    type: string;
    error?: L;
    value?: R;
  }): Either<L, R> =>
    type === Either._leftSymbol.toString()
      ? Either.left(error as L)
      : Either.right(value as R),

  getLeft: <L, R>(either: Either<L, R>): L => {
    if (Either.isLeft(either)) {
      return either.error;
    }

    throw new Error("Tried to getLeft from a Right");
  },

  getRight: <L, R>(either: Either<L, R>): R => {
    if (Either.isRight(either)) {
      return either.value;
    }

    throw new Error("Tried to getRight from a Left");
  },

  getOrElse:
    <L, R>(elseValue: R) =>
    (either: Either<L, R>): R => {
      if (Either.isLeft(either)) {
        return elseValue;
      }

      return Either.getRight(either);
    },

  getOrElseThrow: async <L, R>({
    eitherFn,
  }: {
    eitherFn: () => Promise<Either<L, R>>;
  }): Promise<R> => {
    const either = await eitherFn();

    if (Either.isLeft(either)) {
      throw new Error(String(Either.getLeft(either)));
    }

    return Either.getRight(either);
  },

  getOrElseReject: <L, R>(either: Either<L, R>): Promise<R> => {
    return new Promise((resolve, reject) => {
      if (Either.isLeft(either)) {
        return reject(new Error(String(Either.getLeft(either))));
      }

      return resolve(Either.getRight(either));
    });
  },
};
