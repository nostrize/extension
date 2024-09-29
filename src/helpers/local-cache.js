export function getFromPageCache(key) {
  // Check if the key exists in local storage
  const cachedValue = localStorage.getItem(key);

  if (cachedValue) {
    // If it exists, return the cached value
    return JSON.parse(cachedValue);
  }

  return;
}

export function insertToPageCache(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function getOrInsertPageCache({
  key,
  insertCallback,
  insertEmpty = false,
  skipEmpty = false,
  updateCache = false,
  updatedCallback,
}) {
  // Check if the key exists in local storage
  const cachedValue = localStorage.getItem(key);

  if (cachedValue != null) {
    // update the cache in the background
    if (updateCache) {
      insertCallback().then((value) => {
        updateCacheValue({
          key,
          value,
          insertEmpty,
          skipEmpty,
        });

        if (updatedCallback) {
          updatedCallback(value);
        }
      });
    }

    // If it exists, return the cached value
    return JSON.parse(cachedValue);
  } else {
    // If it does not exist, call the fetch callback to get the value
    let value = await insertCallback();

    updateCacheValue({
      key,
      value,
      insertEmpty,
      skipEmpty,
    });

    // Return the fetched value
    return value;
  }
}

async function updateCacheValue({ key, value, insertEmpty, skipEmpty }) {
  if (value == null) {
    if (insertEmpty) {
      value = null;
    } else if (skipEmpty) {
      return;
    } else {
      throw new Error("Failed to insert value into cache");
    }
  }

  // Store the value in local storage
  localStorage.setItem(key, JSON.stringify(value));
}
