/*
 * CollabVM for Windows 96
 * QuickInstall
 *
 * Compatibility target:
 * Windows 96 v3.x - v4.x
 */

const VERSION = "1.0.1";

const urlPrefix =
    "https://raw.githubusercontent.com/YOUR_USERNAME/collabvm-w96/main/src";

const downloadList = [
    {
        filename: "collabvm.js",
        savepath: "c:/system/boot/apps"
    },
    {
        filename: "collabvm.css",
        savepath: "c:/local/collabvm"
    },
    {
        filename: "wnd_main.html",
        savepath: "c:/local/collabvm"
    }
];

const shortcutPaths = [
    "c:/system/programs/Other",
    "c:/user/desktop"
];

let done = 0;
let failed = false;

const FS = w96.FS;

console.group(
    `%c[ CollabVM QuickInstall ${VERSION} ]`,
    "color:#8af;font-weight:bold"
);

// Create directories recursively
async function ensureDirectory(path) {
    const parts = path.split("/");
    let current = parts.shift() + "/";

    for (const part of parts) {
        if (!part) continue;

        current += part;

        if (!FS.exists(current)) {
            await FS.mkdir(current);
        }

        current += "/";
    }
}

// Download and install an individual file
async function installFile(file) {
    const url = `${urlPrefix}/${file.filename}`;
    const destination = `${file.savepath}/${file.filename}`;

    console.log(`Fetching ${file.filename}...`);

    const content = await w96.sys.loader.loadTextAsync(
        url,
        false
    );

    if (
        typeof content !== "string" ||
        content.length === 0
    ) {
        throw new Error(
            `Could not download ${file.filename}`
        );
    }

    await ensureDirectory(file.savepath);

    console.log(`Saving ${file.filename}...`);

    await FS.writestr(destination, content);

    if (!FS.exists(destination)) {
        throw new Error(
            `Failed to save ${destination}`
        );
    }

    done++;

    console.log(
        `${file.filename} installed (${done}/${downloadList.length})`
    );
}

// Create desktop and programs shortcuts
async function installShortcuts() {
    console.log("Creating shortcuts...");

    for (const path of shortcutPaths) {
        await ensureDirectory(path);

        w96.shell.mkShortcut(
            `${path}/CollabVM.link`,
            "image2",
            "collabvm"
        );

        console.log(`Shortcut created: ${path}`);
    }
}

// Main installer
async function main() {
    try {
        console.log("Starting installation...");

        // Install files sequentially
        for (const file of downloadList) {
            await installFile(file);
        }

        // Install shortcuts after successful downloads
        await installShortcuts();

        console.log("Installation completed!");
        console.log(
            "Installed " + done + " of " +
            downloadList.length + " files."
        );

        console.groupEnd();

        w96.ui.DialogCreator.alert(
            `
            <b>CollabVM installed successfully!</b>
            <br><br>
            Version: ${VERSION}
            <br>
            Files installed: ${done}/${downloadList.length}
            <br><br>
            Desktop shortcuts have been created.
            <br><br>
            Restart Windows 96 to finish loading
            the new application.
            `,
            {
                title: "CollabVM Setup",
                icon: "info"
            }
        );

    } catch (error) {
        failed = true;

        console.error("Installation failed:", error);

        console.groupEnd();

        w96.ui.DialogCreator.alert(
            `
            <b>Installation failed!</b>
            <br><br>
            ${String(error.message || error)}
            <br><br>
            Successfully installed:
            ${done}/${downloadList.length}
            <br><br>
            Check the console for details.
            `,
            {
                title: "CollabVM Setup",
                icon: "error"
            }
        );
    }
}

main();
