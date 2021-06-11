export interface FileInterface {
  text(): Promise<string>
  name: string
  path: string
}
export interface FolderInterface {
  files(extensions?: string|string[]): Promise<FileInterface[]>
  name: string
}
export type InputTemplate = HandlebarsTemplateDelegate<{inputElement: string}>