export async function getOrInsertCache(key, insertCallback) {
  // Check if the key exists in local storage
  const cachedValue = localStorage.getItem(key);

  if (cachedValue) {
    // If it exists, return the cached value
    return JSON.parse(cachedValue);
  } else {
    // If it does not exist, call the fetch callback to get the value
    const value = await insertCallback();

    if (!value) {
      return;
    }

    // Store the value in local storage
    localStorage.setItem(key, JSON.stringify(value));

    // Return the fetched value
    return value;
  }
}
