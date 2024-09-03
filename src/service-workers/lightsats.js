export function createTip(message, sender, sendResponse) {
  if (message.action !== "create-tip") {
    return false;
  }

  fetch(message.url, {
    method: message.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${message.apiKey}`,
    },
    body: JSON.stringify(message.payload),
  })
    .then(async (response) => {
      console.log("Response from API:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();

        sendResponse({ success: true, data });
      } else {
        const error = await response.text();

        sendResponse({ success: false, error });
      }
    })
    .catch((error) => {
      console.error("Error in createTip:", error);

      sendResponse({ success: false, error: error.message });
    });

  return true; // Indicates that the response is sent asynchronously
}

export function getTip(message, sender, sendResponse) {
  if (message.action !== "get-tip") {
    return false;
  }

  fetch(message.url, {
    method: message.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${message.apiKey}`,
    },
  })
    .then(async (response) => {
      console.log("Response from API:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();

        sendResponse({ success: true, data });
      } else {
        const error = await response.text();

        sendResponse({ success: false, error });
      }
    })
    .catch((error) => {
      console.error("Error in getTip:", error);

      sendResponse({ success: false, error: error.message });
    });

  return true; // Indicates that the response is sent asynchronously
}
