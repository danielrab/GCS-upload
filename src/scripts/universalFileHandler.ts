import type {FileInterface, FolderInterface, InputTemplate} from './interfaces.js'
import {ChromiumFileHandler} from './chromeFileHandler.js'
import {FallbackFileHandler} from './fallbackFileHandler.js'

function getBrowser() {
  // the code is based on https://developer.mozilla.org/en-US/docs/Web/API/Window/navigator
  const sUsrAg = navigator.userAgent;
  // The order matters here, and this may report false positives for unlisted browsers.
  if (sUsrAg.indexOf("Firefox") > -1) {
    return "Mozilla Firefox";
  } else if (sUsrAg.indexOf("SamsungBrowser") > -1) {
    return "Samsung Internet";
  } else if (sUsrAg.indexOf("Opera") > -1 || sUsrAg.indexOf("OPR") > -1) {
    return "Opera";
  } else if (sUsrAg.indexOf("Trident") > -1) {
    return "Microsoft Internet Explorer";
  } else if (sUsrAg.indexOf("Edge") > -1) {
    return "Microsoft Edge";
  } else if (sUsrAg.indexOf("Chrome") > -1) {
    return "Chromium";
  } else if (sUsrAg.indexOf("Safari") > -1) {
    return "Apple Safari";
  } else {
    return "unknown";
  }
}
const IS_CHROMIUM = ['Chromium', 'Microsoft Edge', 'Opera'].includes(getBrowser());

export class UniversalFileHandler {
  static async getFile(template: InputTemplate, _extensions?: string|string[]): Promise<FileInterface> {
    const extensions = typeof _extensions === 'string' ? [_extensions]: _extensions
    return IS_CHROMIUM? ChromiumFileHandler.getFile(template, extensions): FallbackFileHandler.getFile(template, extensions)
  }

  static async getFolder(template: InputTemplate): Promise<FolderInterface> {
    return IS_CHROMIUM? ChromiumFileHandler.getFolder(template): FallbackFileHandler.getFolder(template)
  }
}

declare global {
  interface Window { UniversalFileHandler: typeof UniversalFileHandler; }
}
window.UniversalFileHandler = UniversalFileHandler