const urlPrefix =
    "https://raw.githubusercontent.com/w96-stuff/collabvm-w96/main/src";

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

let done = 0;

const shortcutPaths = [
    "c:/system/programs/Other",
    "c:/user/desktop"
];

console.group(
    "%c[ CollabVM QuickInstall ]",
    "color:#8af;font-weight:bold"
);

async function ensureDirectory(path) {
    if (!w96.FS.exists(path)) {
        await w96.FS.mkdir(path);
    }
}

async function save(value) {
    try {
        await ensureDirectory(value.savepath);

        console.log(`Fetching ${value.filename}...`);

        const content = await w96.sys.loader.loadTextAsync(
            `${urlPrefix}/${value.filename}`,
            false
        );

        if (!content) {
            throw new Error("Downloaded file is empty.");
        }

        console.log(`${value.filename} fetched. Saving...`);

        await w96.FS.writestr(
            `${value.savepath}/${value.filename}`,
            content
        );

        done++;

        console.log(
            `${value.filename} saved (${done}/${downloadList.length})`
        );
    } catch (err) {
        console.error(
            `Failed to install ${value.filename}:`,
            err
        );

        throw err;
    }
}

async function install() {
    try {
        // Download all application files
        for (const file of downloadList) {
            await save(file);
        }

        // Create shortcuts
        for (const path of shortcutPaths) {
            await ensureDirectory(path);

            w96.shell.mkShortcut(
                `${path}/CollabVM.link`,
                "image2",
                "collabvm"
            );
        }

        console.log("All files installed!");
        console.log("Creating shortcuts...");

        console.groupEnd();

        w96.ui.DialogCreator.alert(
            "CollabVM has been installed successfully!\n\n" +
            "Windows 96 will now restart.",
            {
                title: "CollabVM Setup",
                icon: "info",
                events: {
                    onclose: () => {
                        setTimeout(() => {
                            w96.sys.reboot();
                        }, 1000);
                    }
                }
            }
        );
    } catch (err) {
        console.groupEnd();

        w96.ui.DialogCreator.alert(
            `Installation failed:\n${err.message}`,
            {
                title: "Installation Error",
                icon: "error"
            }
        );
    }
}

install();
