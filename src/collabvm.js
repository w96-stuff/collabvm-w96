const { register } = w96.app;
const { Theme, MenuBar, DialogCreator } = w96.ui;

const releaseInfo = {
    version: "1.0",
    date: "10/30/2026",
    repo: "https://github.com/w96-stuff/collabvm-w96",
    path: "c:/local/collabvm"
};

const COLLABVM_URL = "https://computernewb.com/collab-vm/";

class CollabVMApplication extends WApplication {
    constructor() {
        super();
    }

    async main(argv) {
        super.main(argv);

        const wnd_main = this.createWindow({
            title: "CollabVM",
            icon: Theme.getIconUrl("network", "small"),
            initialWidth: 950,
            initialHeight: 650,
            body: await FS.readstr(
                `${releaseInfo.path}/wnd_main.html`
            ),
            bodyClass: "collabvm-app",
            center: true,
            taskbar: true,
            resizable: true,
            controlBoxStyle: "WS_CBX_MINMAXCLOSE"
        }, true);

        const body = wnd_main.getBodyContainer();

        let currentUrl = COLLABVM_URL;

        const appBar = new MenuBar();

        appBar.addRoot("File", [
            {
                type: "normal",
                label: "Home",
                onclick: () => navigate(COLLABVM_URL)
            },
            {
                type: "normal",
                label: "Reload",
                onclick: () => reload()
            },
            {
                type: "separator"
            },
            {
                type: "normal",
                label: "Open in browser",
                onclick: () => openExternal()
            },
            {
                type: "separator"
            },
            {
                type: "normal",
                label: "Exit",
                onclick: () => this.terminate()
            }
        ]);

        appBar.addRoot("Navigate", [
            {
                type: "normal",
                label: "Back to CollabVM",
                onclick: () => navigate(COLLABVM_URL)
            },
            {
                type: "normal",
                label: "Refresh",
                onclick: () => reload()
            }
        ]);

        appBar.addRoot("Help", [
            {
                type: "normal",
                label: "CollabVM Website",
                onclick: () => openExternal()
            },
            {
                type: "normal",
                label: "GitHub Repository",
                onclick: () => w96.urlopen(releaseInfo.repo)
            },
            {
                type: "separator"
            },
            {
                type: "normal",
                label: "About CollabVM",
                onclick: () => DialogCreator.create({
                    title: "About CollabVM",
                    body: `
                        <b>CollabVM for Windows 96</b><br>
                        Version ${releaseInfo.version}<br><br>
                        An unofficial Windows 96 client for CollabVM.<br><br>
                        Website:
                        <a href="${COLLABVM_URL}" target="_blank">
                            computernewb.com
                        </a>
                    `,
                    icon: "info"
                })
            }
        ]);

        body.querySelector(".appbar").replaceWith(
            appBar.getMenuDiv()
        );

        const frame = body.querySelector("#collabvm-frame");
        const address = body.querySelector("#address");
        const status = body.querySelector("#status");

        function setStatus(message) {
            status.textContent = message;
        }

        function navigate(url) {
            try {
                const parsed = new URL(url);

                if (
                    parsed.protocol !== "https:" &&
                    parsed.protocol !== "http:"
                ) {
                    throw new Error("Unsupported URL protocol");
                }

                currentUrl = parsed.href;
                address.value = currentUrl;
                frame.src = currentUrl;

                setStatus("Loading CollabVM...");
            } catch (err) {
                DialogCreator.alert(
                    "Please enter a valid HTTP or HTTPS address.",
                    {
                        title: "Invalid address",
                        icon: "error"
                    }
                );
            }
        }

        function reload() {
            frame.src = currentUrl;
            setStatus("Refreshing...");
        }

        function openExternal() {
            w96.urlopen(currentUrl);
        }

        body.querySelector("#go-button").addEventListener(
            "click",
            () => navigate(address.value)
        );

        address.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                navigate(address.value);
            }
        });

        body.querySelector("#home-button").addEventListener(
            "click",
            () => navigate(COLLABVM_URL)
        );

        body.querySelector("#reload-button").addEventListener(
            "click",
            reload
        );

        body.querySelector("#external-button").addEventListener(
            "click",
            openExternal
        );

        frame.addEventListener("load", () => {
            setStatus("Page loaded. Enjoy CollabVM!");
        });

        frame.addEventListener("error", () => {
            setStatus(
                "Unable to display page. Try opening it externally."
            );
        });

        // Initial page
        navigate(COLLABVM_URL);

        wnd_main.show();
    }
}

// Load application stylesheet
const appStyle = URL.createObjectURL(
    await FS.toBlob(
        `${releaseInfo.path}/collabvm.css`
    )
);

await w96.sys.loader.loadStyleAsync(appStyle);
URL.revokeObjectURL(appStyle);

// Register application
register({
    command: "collabvm",
    type: "gui",
    cls: CollabVMApplication,
    meta: {
        icon: Theme.getIconUrl("network"),
        friendlyName: "CollabVM"
    }
});
