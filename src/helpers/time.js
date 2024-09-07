export function timeAgo(timestampInSeconds) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const secondsAgo = nowInSeconds - timestampInSeconds;

  let value, unit;

  if (secondsAgo < 60) {
    value = secondsAgo;
    unit = "second";
  } else if (secondsAgo < 3600) {
    value = Math.floor(secondsAgo / 60);
    unit = "minute";
  } else if (secondsAgo < 86400) {
    value = Math.floor(secondsAgo / 3600);
    unit = "hour";
  } else {
    value = Math.floor(secondsAgo / 86400);
    unit = "day";
  }

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return rtf.format(-value, unit);
}
