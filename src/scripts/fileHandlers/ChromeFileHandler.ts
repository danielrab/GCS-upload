import type {FileInterface, FolderInterface, InputTemplate} from './interfaces.js'

class ChromiumFile implements FileInterface {
  handle: FileSystemFileHandle
  name: string
  path: string

  constructor(handle: FileSystemFileHandle, path: string) {
    this.handle = handle;
    this.name = handle.name;
    this.path = path !== ""? path: handle.name;
  }

  async text() {
    return (await this.handle.getFile()).text();
  }
}

class ChromiumFolder implements FolderInterface {
  name: string
  handle: FileSystemDirectoryHandle

  constructor(handle: FileSystemDirectoryHandle) {
    this.handle = handle
    this.name = handle.name
  }

  async files(extensions?: string[]) {
    const allFiles = await this._getFiles()
    return extensions? allFiles.filter(f => extensions.some(ext => f.name.endsWith(ext))): allFiles
  }

  async _getFiles(handle?: FileSystemDirectoryHandle, path?: string): Promise<ChromiumFile[]> {
    path = path ?? this.name
    handle = handle ?? this.handle
    const files: ChromiumFile[] = []
    for await (let [name, child] of handle.entries()) {
      if (child instanceof FileSystemDirectoryHandle){
        files.push(...await this._getFiles(child, `${path}/${name}`));
      }
      else {
        files.push(new ChromiumFile(child,  `${path}/${child.name}`));
      }
    }
    return files;
  }
}

type FileOrFolderHandle<T> = T extends 'file'? FileSystemFileHandle: FileSystemDirectoryHandle
export class ChromiumFileHandler {
  private static async _getFileOrFolder<T extends 'file'|'folder'>
  (template: InputTemplate, mode: T, extensions?: string[]): Promise<FileOrFolderHandle<T>>{
    const promise = new Promise<FileOrFolderHandle<T>>((resolve, reject) => {
      let handle: FileSystemHandle;
      const dialog = new Dialog({
        title: `Import Data`,
        content: template({inputElement: `<button id="importButton" style="width: fit-content; height: fit-content">choose file</button>
        <div id="selectedFile" style="display: inline-block;">no file chosen</div>`}),
        buttons: {
          import: {
            icon: '<i class="fas fa-file-import"></i>',
            label: "Import",
            callback: () => {
              handle? resolve(handle as FileOrFolderHandle<T>): reject('no file were chosen');
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
      Hooks.once('renderDialog', (dialog: Dialog)=>{
        const fileChosenDiv = (dialog.element as JQuery).find('#selectedFile');
        (dialog.element as JQuery).find('#importButton').on('click', async ()=>{
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
          if (mode === 'file'){
            handle = (await (extensions? showOpenFilePicker(pickerOpts): showOpenFilePicker()))[0]
          }
          else {
            handle = await showDirectoryPicker();
          }
          fileChosenDiv[0].innerText = handle.name;
        });
      });
      dialog.render(true);
    })
    return promise
  }

  static async getFile(template: InputTemplate, extensions?: string[]): Promise<ChromiumFile> {
    return new ChromiumFile(await this._getFileOrFolder(template, 'file', extensions), "")
  }
  static async getFolder(template: InputTemplate): Promise<ChromiumFolder> {
    return new ChromiumFolder(await this._getFileOrFolder(template, 'folder'));
  }
}