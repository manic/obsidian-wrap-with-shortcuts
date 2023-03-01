import { MarkdownView, Plugin, EditorPosition } from "obsidian";
import SettingsTab from './src/SettingsTab'

export interface WrapperTag {
  id?: string; // 20220904: compitable with older version, mark as optional
  name: string;
  startTag: string;
  endTag: string;
}

interface WrapperTagSettings {
  wrapperTags: WrapperTag[];
}

const DEFAULT_SETTINGS: WrapperTagSettings = {
  wrapperTags: [
    {
      id: 'underline',
      name: 'Underline',
      startTag: '<u>',
      endTag: '</u>'
    },
  ]
}

export default class WrapWithShortcut extends Plugin {
  settings: WrapperTagSettings;
  
  async editCommandsList(oldTag: WrapperTag | undefined, newTag: WrapperTag | undefined) {
    if (oldTag !== undefined) {
      //@ts-ignore
      this.app.commands.removeCommand(`wrap-with-shortcut-${oldTag.id}`); //doesn't work in some condition
    }
    if (newTag !== undefined) {
      this.addCommand({
        id: `wrap-with-shortcut-${newTag.id}`,
        name: `Toggle ${newTag.name}`,
        callback: () =>
          this.wrapSelectedTextIn(newTag.startTag, newTag.endTag
          )
      });
    }
  }
  
  async removeAllDeletedWrapCommand() {
    //@ts-ignore
    const pluginCommands = Object.keys(this.app.commands.commands).filter(key => key.startsWith('obsidian-wrap-with-shortcuts'));
    for (const cmd of pluginCommands) {
      //remove commands if the tag is deleted
      if (!this.settings.wrapperTags.some((tag) => tag.id === cmd.replace('obsidian-wrap-with-shortcuts:wrap-with-shortcut-', ''))) {
        //@ts-ignore
        this.app.commands.removeCommand(cmd);
      }
    }
  }

  async onload() {
    console.log("loading plugin wrap-with-shortcut");
    await this.loadSettings();
    if (this.settings.wrapperTags.length > 0 && !this.settings.wrapperTags[0].id) {
      await this.applyWrapperTagID();
    }

    this.settings.wrapperTags.forEach((wrapperTag) => {
      this.editCommandsList(undefined, wrapperTag);
    });

    this.addSettingTab(new SettingsTab(this));
  }

  wrapSelectedTextIn(startTag = '<u>', endTag = '</u>'): void {
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!markdownView) {
      return;
    }
    if (startTag === '' || endTag === '') {
      return;
    }
    const editor = markdownView.editor;

    const selectedText = editor.somethingSelected() ? editor.getSelection() : "";

    function toPos(pos: number): EditorPosition {
      return editor.offsetToPos(pos);
    }

    function getRange(from: number, to: number): string {
      try {
        return editor.getRange(toPos(from), toPos(to));
      } catch (_) {
        return '';
      }
    }

    /* Detect whether the selected text is packed by <u></u>.
       If true, unpack it, else pack with <u></u>. */

    const fos = editor.posToOffset(editor.getCursor("from")); // from offset
    const tos = editor.posToOffset(editor.getCursor("to")); // to offset
    const len = selectedText.length;

    const beforeText = getRange(fos - startTag.length, tos - len);
    const afterText = getRange(fos + len, tos + endTag.length);
    const startText = getRange(fos, fos + startTag.length);
    const endText = getRange(tos - endTag.length, tos);

    if (beforeText === startTag && afterText === endTag) {
      //=> undo (inside selection)
      editor.setSelection(toPos(fos - startTag.length), toPos(tos + endTag.length));
      editor.replaceSelection(`${selectedText}`);
      // re-select
      editor.setSelection(toPos(fos - startTag.length), toPos(tos - startTag.length));
    } else if (startText === startTag && endText === endTag) {
      //=> undo (outside selection)
      editor.replaceSelection(editor.getRange(toPos(fos + startTag.length), toPos(tos - endTag.length)));
      // re-select
      editor.setSelection(toPos(fos), toPos(tos - (startTag.length + endTag.length)));
    } else {
      //=> do wrap
      if (selectedText) {
        editor.replaceSelection(`${startTag}${selectedText}${endTag}`);
        editor.setSelection(toPos(fos + startTag.length), toPos(tos + startTag.length));
      } else {
        editor.replaceSelection(`${startTag}${endTag}`);
        const cursor = editor.getCursor();
        cursor.ch -= endTag.length;
        editor.setCursor(cursor);
      }
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async applyWrapperTagID() {
    this.settings.wrapperTags.forEach((wrapperTag, index) => {
      wrapperTag.id ||= `${index}`;
    });
    await this.saveSettings();
  }
  
  onunload() {
    console.log("Unload plugin wrap-with-shortcut")
  }
}
