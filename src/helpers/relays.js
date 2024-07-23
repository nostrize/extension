export async function fetchOneEvent({ relayFactory, filter }) {
  const relay = await relayFactory.getOrCreate();

  return new Promise((resolve) => {
    const sub = relay.subscribe([filter], {
      onevent(e) {
        sub.close();

        resolve(e);
      },
    });
  });
}
