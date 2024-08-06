window.nostrize = {
  hello: () => console.log("mello"),
  hasNostr: () => console.log(window.nostr),
};

window.addEventListener("message", (message) => {
  if (
    !message.data ||
    message.data.response === null ||
    message.data.response === undefined ||
    message.data.ext !== "nostrize"
  ) {
    return;
  }

  console.log(
    "%c[nostrize:%c" +
      message.data.id +
      "%c]%c result: %c" +
      JSON.stringify(
        message?.data?.response ||
          message?.data?.response?.error?.message ||
          {},
      ),
    "background-color:#f1b912;font-weight:bold;color:white",
    "background-color:#f1b912;font-weight:bold;color:#a92727",
    "background-color:#f1b912;color:white;font-weight:bold",
    "color:auto",
    "font-weight:bold;color:#08589d",
  );
});
