(async function () {
    const VERSION = "1.2.0";

    const URL_PREFIX =
        "https://raw.githubusercontent.com/w96-stuff/collabvm-w96/main/src";

    const DEFAULT_PATH = "c:/local/collabvm";

    const FILES = [
        {
            filename: "collabvm.js",
            savepath: "c:/system/boot/apps"
        },
        {
            filename: "collabvm.css",
            local: true
        },
        {
            filename: "wnd_main.html",
            local: true
        }
    ];

    const { Theme } = w96.ui;

    class CollabVMSetup extends WApplication {
        async main(argv) {
            super.main(argv);

            let destination = DEFAULT_PATH;
            let installing = false;

            const wnd = this.createWindow({
                title: "CollabVM Setup",
                icon: Theme.getIconUrl("network", "small"),
                initialWidth: 520,
                initialHeight: 390,
                center: true,
                taskbar: true,
                resizable: false,
                controlBoxStyle: "WS_CBX_MINCLOSE",
                body: `
                    <div class="cvm-setup">
                        <div class="cvm-header">
                            <div class="cvm-logo">C</div>
                            <div>
                                <b>CollabVM Setup</b>
                                <div>Version ${VERSION}</div>
                            </div>
                        </div>

                        <div id="welcome" class="cvm-page">
                            <h3>Welcome to CollabVM Setup</h3>
                            This wizard will install CollabVM
                            on your Windows 96 computer.
                            <p>Click Next to continue.</p>
                        </div>

                        <div id="destination-page"
                            class="cvm-page" style="display:none">
                            <h3>Choose Installation Location</h3>

                            Installation destination:

                            <input id="destination"
                                value="${DEFAULT_PATH}"
                                style="width:100%;box-sizing:border-box">

                            <p>
                                <label>
                                    <input type="checkbox"
                                        id="desktop" checked>
                                    Create Desktop shortcut
                                </label>
                            </p>

                            <p>
                                <label>
                                    <input type="checkbox"
                                        id="programs" checked>
                                    Create Programs shortcut
                                </label>
                            </p>
                        </div>

                        <div id="installing"
                            class="cvm-page" style="display:none">
                            <h3>Installing CollabVM...</h3>

                            <progress id="progress"
                                value="0" max="100"
                                style="width:100%">
                            </progress>

                            <p id="status">Preparing...</p>
                            <p id="count">0 / 3 files</p>
                        </div>

                        <div id="finished"
                            class="cvm-page" style="display:none">
                            <h3>Installation Complete!</h3>
                            CollabVM has been installed successfully.
                            <p>You can now launch CollabVM.</p>
                            <p>Restart Windows 96 if necessary.</p>
                        </div>

                        <div class="cvm-footer">
                            <button id="back">Back</button>
                            <button id="next">Next</button>
                            <button id="cancel">Cancel</button>
                        </div>
                    </div>

                    <style>
                        .cvm-setup {
                            height:100%;
                            box-sizing:border-box;
                            padding:15px;
                            background:#c0c0c0;
                            color:black;
                            font-family:Arial,sans-serif;
                            font-size:12px;
                            display:flex;
                            flex-direction:column;
                        }

                        .cvm-header {
                            display:flex;
                            align-items:center;
                            gap:14px;
                            border-bottom:1px solid #888;
                            padding-bottom:14px;
                        }

                        .cvm-header b {
                            font-size:19px;
                        }

                        .cvm-logo {
                            width:55px;
                            height:55px;
                            background:#000080;
                            color:white;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:30px;
                            font-weight:bold;
                        }

                        .cvm-page {
                            flex:1;
                            padding-top:12px;
                        }

                        .cvm-footer {
                            border-top:1px solid #888;
                            padding-top:10px;
                            display:flex;
                            justify-content:flex-end;
                            gap:5px;
                        }

                        .cvm-footer button {
                            min-width:75px;
                            height:27px;
                            background:#c0c0c0;
                            border:2px outset white;
                        }

                        .cvm-footer button:active {
                            border-style:inset;
                        }
                    </style>
                `
            }, true);

            const body = wnd.getBodyContainer();

            const pages = [
                body.querySelector("#welcome"),
                body.querySelector("#destination-page"),
                body.querySelector("#installing"),
                body.querySelector("#finished")
            ];

            const back = body.querySelector("#back");
            const next = body.querySelector("#next");
            const cancel = body.querySelector("#cancel");

            const progress = body.querySelector("#progress");
            const status = body.querySelector("#status");
            const count = body.querySelector("#count");

            let page = 0;

            function showPage(n) {
                page = n;

                pages.forEach((element, index) => {
                    element.style.display =
                        index === n ? "block" : "none";
                });

                back.style.display =
                    n === 0 || n >= 2 ? "none" : "inline-block";

                next.textContent =
                    n === 1 ? "Install" :
                    n === 3 ? "Finish" : "Next";

                next.disabled = n === 2;
                cancel.textContent =
                    n === 3 ? "Close" : "Cancel";
            }

            async function ensureDirectory(path) {
                const parts = path.split("/");
                let current = parts.shift() + "/";

                for (const part of parts) {
                    if (!part) continue;

                    current += part;

                    if (!w96.FS.exists(current)) {
                        await w96.FS.mkdir(current);
                    }

                    current += "/";
                }
            }

            async function install() {
                if (installing) return;

                installing = true;

                destination =
                    body.querySelector("#destination").value
                        .trim().replace(/\/+$/, "");

                if (
                    !/^c:\//i.test(destination) ||
                    destination.includes("..")
                ) {
                    installing = false;

                    w96.ui.DialogCreator.alert(
                        "Enter a valid C: installation directory.",
                        {
                            title: "Invalid Destination",
                            icon: "error"
                        }
                    );

                    return;
                }

                showPage(2);

                let completed = 0;

                try {
                    await ensureDirectory(destination);

                    for (const file of FILES) {
                        status.textContent =
                            "Downloading " + file.filename;

                        const content =
                            await w96.sys.loader.loadTextAsync(
                                URL_PREFIX + "/" + file.filename,
                                false
                            );

                        if (
                            typeof content !== "string" ||
                            content.length === 0
                        ) {
                            throw new Error(
                                "Download failed: " + file.filename
                            );
                        }

                        const folder = file.local
                            ? destination
                            : file.savepath;

                        await ensureDirectory(folder);

                        const path =
                            folder + "/" + file.filename;

                        status.textContent =
                            "Installing " + file.filename;

                        await w96.FS.writestr(path, content);

                        if (!w96.FS.exists(path)) {
                            throw new Error(
                                "Unable to save " + path
                            );
                        }

                        completed++;

                        progress.value =
                            completed / FILES.length * 100;

                        count.textContent =
                            completed + " / " +
                            FILES.length + " files";
                    }

                    if (body.querySelector("#desktop").checked) {
                        await ensureDirectory(
                            "c:/user/desktop"
                        );

                        w96.shell.mkShortcut(
                            "c:/user/desktop/CollabVM.link",
                            "image2",
                            "collabvm"
                        );
                    }

                    if (body.querySelector("#programs").checked) {
                        await ensureDirectory(
                            "c:/system/programs/Other"
                        );

                        w96.shell.mkShortcut(
                            "c:/system/programs/Other/CollabVM.link",
                            "image2",
                            "collabvm"
                        );
                    }

                    status.textContent =
                        "Installation completed!";

                    showPage(3);

                } catch (error) {
                    console.error(error);

                    installing = false;
                    next.disabled = false;

                    w96.ui.DialogCreator.alert(
                        "Installation failed:<br><br>" +
                        String(error.message || error),
                        {
                            title: "Setup Error",
                            icon: "error"
                        }
                    );
                }
            }

            back.addEventListener("click", () => {
                if (page === 1) showPage(0);
            });

            next.addEventListener("click", async () => {
                if (page === 0) {
                    showPage(1);
                } else if (page === 1) {
                    await install();
                } else if (page === 3) {
                    this.terminate();
                }
            });

            cancel.addEventListener("click", () => {
                if (!installing) {
                    this.terminate();
                }
            });

            showPage(0);
            wnd.show();
        }
    }

    const setup = new CollabVMSetup();
    await setup.main([]);

})();
