# Nostrize Browser Extension (Work In Progress)

Welcome to Nostrize - the browser extension that empowers any website with the [Nostr](https://github.com/nostr-protocol/nostr) experience. Nostrize seamlessly integrates tipping and crowdsourcing capabilities through Bitcoin, making every interaction permissionless. Join us in a world where supporting content and collaborative projects is effortless. Elevate your browsing with the power of Nostr and Bitcoin, and become part of the [Value4Value](https://value4value.info/) movement today.

# How to build

## Dependencies

* We depend on [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#about) for nodejs versioning. 
* You can manually install the required nodejs version by looking our [.nvmrc](https://github.com/nostrize/extension/blob/main/.nvmrc) file

## Build Nostrize Browser Extension 

1. Create a directory: `mkdir nostrize`
1. Clone the repo ex: `git clone https://github.com/nostrize/extension.git`
1. Go to the directory: `cd extension`
1. `nvm install` if you have nvm to install the required nodejs instance.
1. `npm install` to install nodejs dependencies
1. `npm run build` to run the build.sh script

Note for Windows Users: The build.sh script is a bash script and may require additional tools like Git Bash, Cygwin, or WSL (Windows Subsystem for Linux) to run on Windows. Alternatively, consider translating the bash script logic into an equivalent build.bat script or using npm scripts directly for cross-platform compatibility.

After build, a **dist** directory should be created in the root.

## Installing Nostrize as an Unpacked Extension in Chrome

To test or use your build locally in Chrome, follow these steps to install it as an unpacked extension:

1. Navigate to [chrome://extensions/](chrome://extensions/) in the address bar.
1. Enable "Developer mode" by toggling the switch in the top-right corner.
1. Load the Unpacked Extension:

Click the "Load unpacked" button that appears after enabling Developer mode.
In the file dialog, navigate to the **dist** directory within your Nostrize project directory.
Select the build directory and click "Open" or "Select Folder" (depending on your OS).
Verify Installation:

Ensure Nostrize appears in your list of extensions and is enabled.
You might see an icon for Nostrize in your Chrome toolbar, indicating the extension is active.

## Testing and Usage

Visit a supported website or one of the test pages to see Nostrize in action.
If you make changes to the extension, return to [chrome://extensions/](chrome://extensions/), find Nostrize, and click the "Reload" button to apply your updates.

# Projects

## GitHub

The first platform that you can use Nostrize is GitHub. It was chosen as the initial focus because we wanted to fund future Nostrize development using Nostrize itself!

With Nostrize on GitHub, you can:

* Seamlessly connect your Nostr and GitHub accounts with a [simple step](https://github.com/nostrize/github-connect) – no waiting list required.
* Support any user or organization through donations.
  * Receive tips directly without any commission or fees.
* Fund issues to incentivize solutions.
  * Earn payments for your pull requests that address and resolve issues.
* And more features are coming...