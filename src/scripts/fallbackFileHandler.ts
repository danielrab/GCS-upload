import type {FileInterface, FolderInterface, InputTemplate} from './interfaces.js'

class FallbackFile implements FileInterface {
  private file: File
  name: string
  path: string

  constructor(file: File) {
    this.file = file;
    this.name = file.name
    this.path = file.webkitRelativePath !== ""? file.webkitRelativePath: file.name
  }

  async text() {
    return this.file.text()
  }
}

class FallbackFolder implements FolderInterface {
  name: string
  _files: FallbackFile[]

  constructor(files: FallbackFile[], name?: string) {
    this._files = files
    this.name = name ?? files[0].path.split('/')[0]
  }

  async files(extensions?: string[]) {
    return extensions? this._files.filter(f => extensions.some(ext => f.name.endsWith(ext))): this._files
  }
}

export class FallbackFileHandler {
  private static async _getFileOrFolder(template: InputTemplate, mode: 'file'|'folder', extensions?: string[]): Promise<FallbackFile[]> {
    const inputElementHtml = mode === 'file'? 
    `<input id="inputFiles" type="file" accept="${extensions}" />`:
    `<input id="inputFiles" type="file" webkitdirectory mozdirectory />`
    const content = template({inputElement: inputElementHtml})
    const promise = new Promise<FallbackFile[]>((resolve, reject)=>{
      new Dialog({
        title: `Import Data`,
        content,
        buttons: {
          import: {
            icon: '<i class="fas fa-file-import"></i>',
            label: "Import",
            callback: (html: JQuery) => {
              const inputElement = html.find('#inputFiles')[0]
              if (!(inputElement instanceof HTMLInputElement)) return reject(`can't find input element`)
              if (!inputElement.files) return reject(`input element isn't file input`)
              let files: File[] = Array.from(inputElement.files);
              files = extensions? files.filter(f => extensions.some(ext => f.name.endsWith(ext))): files
              files.length !== 0? resolve(files.map(f => new FallbackFile(f))): reject('no files with the correct extensions were chosen')
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
      }).render(true);
    })
    return promise;
  }

  static async getFile(template: InputTemplate, extensions?: string[]) {
    return (await this._getFileOrFolder(template, 'file', extensions))[0]
  }
  static async getFolder(template: InputTemplate) {
    return new FallbackFolder(await this._getFileOrFolder(template, 'folder'))
  }
}