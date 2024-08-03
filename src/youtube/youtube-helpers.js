export function parseDescription({ content }) {
  const lines = content.trim().split("\n");

  let npub, nip05;

  for (const line of lines) {
    if (line.startsWith("nip05:")) {
      nip05 = line.replace("nip05:", "").trim();
    } else if (line.startsWith("npub:")) {
      npub = line.replace("npub:", "").trim();
    }
  }

  return { npub, nip05 };
}
