class ChromiumFile {
    constructor(handle, path) {
        this.handle = handle;
        this.name = handle.name;
        this.path = path !== "" ? path : handle.name;
    }
    async text() {
        return (await this.handle.getFile()).text();
    }
}
class ChromiumFolder {
    constructor(handle) {
        this.handle = handle;
        this.name = handle.name;
    }
    async files(extensions) {
        const allFiles = await this._getFiles();
        return extensions ? allFiles.filter(f => extensions.some(ext => f.name.endsWith(ext))) : allFiles;
    }
    async _getFiles(handle, path) {
        path = path ?? this.name;
        handle = handle ?? this.handle;
        const files = [];
        for await (let [name, child] of handle.entries()) {
            if (child instanceof FileSystemDirectoryHandle) {
                files.push(...await this._getFiles(child, `${path}/${name}`));
            }
            else {
                files.push(new ChromiumFile(child, `${path}/${child.name}`));
            }
        }
        return files;
    }
}
export class ChromiumFileHandler {
    static async _getFileOrFolder(template, mode, extensions) {
        const promise = new Promise((resolve, reject) => {
            let handle;
            const dialog = new Dialog({
                title: `Import Data`,
                content: template({ inputElement: `<button id="importButton" style="width: fit-content; height: fit-content">choose file</button>
        <div id="selectedFile" style="display: inline-block;">no file chosen</div>` }),
                buttons: {
                    import: {
                        icon: '<i class="fas fa-file-import"></i>',
                        label: "Import",
                        callback: () => {
                            handle ? resolve(handle) : reject('no file were chosen');
                        }
                    },
                    no: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => reject('aborted by the user')
                    }
                },
                default: "import",
                close: () => reject('aborted by the user')
            }, {
                width: 400
            });
            Hooks.once('renderDialog', (dialog) => {
                const fileChosenDiv = dialog.element.find('#selectedFile');
                dialog.element.find('#importButton').on('click', async () => {
                    const pickerOpts = {
                        types: [
                            {
                                description: 'Allowed',
                                accept: {
                                    'custom/custom': extensions ?? []
                                }
                            },
                        ],
                        excludeAcceptAllOption: true,
                        multiple: false
                    };
                    if (mode === 'file') {
                        handle = (await (extensions ? showOpenFilePicker(pickerOpts) : showOpenFilePicker()))[0];
                    }
                    else {
                        handle = await showDirectoryPicker();
                    }
                    fileChosenDiv[0].innerText = handle.name;
                });
            });
            dialog.render(true);
        });
        return promise;
    }
    static async getFile(template, extensions) {
        return new ChromiumFile(await this._getFileOrFolder(template, 'file', extensions), "");
    }
    static async getFolder(template) {
        return new ChromiumFolder(await this._getFileOrFolder(template, 'folder'));
    }
}
