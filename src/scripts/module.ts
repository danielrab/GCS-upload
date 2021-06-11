
import type {FileInterface, InputTemplate} from './interfaces.js'
import {UniversalFileHandler} from './universalFileHandler.js'

declare global {
  interface File {
    webkitRelativePath: string // the types module I am using is unaware of this property
  }
  interface Window { SmartImporter: typeof SmartImporter; }
}

class SmartImporter{
  static actorToFileMap = new Map<GurpsActor, FileInterface>()

  static getTemplateForActor(actor: GurpsActor): InputTemplate {
    return Handlebars.compile(`<p class="notes">Select a file exported from GCS or GCA.</p>
    <div>
        <label for="data">Source Data</label>
        {{{inputElement}}}
    </div>
   <p class="notes"><br>The import will overwrite the data for ${actor.name}.</p>
 		<br><span class="fas fa-exclamation-triangle">NOTE: This cannot be un-done.</span>`)
  }

  static async getFileForActor(actor: GurpsActor) {
    const file = this.actorToFileMap.get(actor);
    const template: InputTemplate = this.getTemplateForActor(actor);
    return file ?? await UniversalFileHandler.getFile(template, '.xml');
  }

  static setFileForActor(actor: GurpsActor, file: FileInterface) {
    this.actorToFileMap.set(actor, file);
  }
}

async function newImport(this: GurpsActor) {
  try {
    const file = await SmartImporter.getFileForActor(this);
    const res = await this.importFromGCSv1(await file.text(), file.name);
    if (res) SmartImporter.setFileForActor(this, file);
  }
  catch (e) {
    ui.notifications.error(e);
  }
}

Hooks.on('ready', ()=>{
  CONFIG.Actor.documentClass.prototype._openImportDialog = newImport
})

declare class GurpsActor extends Actor {
  importFromGCSv1(xml: string, importname: string, importpath?: string): Promise<boolean>
}

window.SmartImporter = SmartImporter
