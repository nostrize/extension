export async function fetchOneEvent({ relayFactory, filter, log }) {
  const relay = await relayFactory.getOrCreate();

  return new Promise((resolve, reject) => {
    try {
      const sub = relay.subscribe([filter], {
        onevent(e) {
          log(e);

          sub.close();

          resolve(e);
        },
        onerror(e) {
          sub.close();

          reject(e);
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}
