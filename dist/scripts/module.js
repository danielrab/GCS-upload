import { UniversalFileHandler } from './fileHandlers/UniversalFileHandler.js';
class SmartImporter {
    static getTemplateForActor(actor) {
        return Handlebars.compile(`<p class="notes">Select a file exported from GCS or GCA.</p>
    <div>
        <label for="data">Source Data</label>
        {{{inputElement}}}
    </div>
   <p class="notes"><br>The import will overwrite the data for ${actor.name}.</p>
 		<br><span class="fas fa-exclamation-triangle">NOTE: This cannot be un-done.</span>`);
    }
    static async getFileForActor(actor) {
        const file = this.actorToFileMap.get(actor);
        const template = this.getTemplateForActor(actor);
        return file ?? await UniversalFileHandler.getFile(template, '.xml');
    }
    static setFileForActor(actor, file) {
        this.actorToFileMap.set(actor, file);
    }
}
SmartImporter.actorToFileMap = new Map();
async function newImport() {
    try {
        const file = await SmartImporter.getFileForActor(this);
        const res = await this.importFromGCSv1(await file.text(), file.name);
        if (res)
            SmartImporter.setFileForActor(this, file);
    }
    catch (e) {
        ui.notifications.error(e);
    }
}
Hooks.on('ready', () => {
    CONFIG.Actor.documentClass.prototype._openImportDialog = newImport;
});
window.UniversalFileHandler = UniversalFileHandler;
window.SmartImporter = SmartImporter;
