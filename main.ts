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

  wrapSelectedTextIn(editor: Editor, startTag = '<u>', endTag = '</u>'): void {
    if (startTag === '' && endTag === '') {
      return;
    }

    const selectedText = editor.getSelection();

    function toPos(editor: Editor, pos: number): EditorPosition {
      return editor.offsetToPos(pos);
    }

    function getRange(editor: Editor, from: number, to: number): string {
      try {
        return editor.getRange(toPos(editor, from), toPos(editor, to));
      } catch (_) {
        return '';
      }
    }

    /* Detect whether the selected text is packed by <u></u>.
       If true, unpack it, else pack with <u></u>. */

    const fos = editor.posToOffset(editor.getCursor("from")); // from offset
    const tos = editor.posToOffset(editor.getCursor("to")); // to offset
    const len = selectedText.length;

    const beforeText = getRange(editor, fos - startTag.length, tos - len);
    const afterText = getRange(editor, fos + len, tos + endTag.length);
    const startText = getRange(editor, fos, fos + startTag.length);
    const endText = getRange(editor, tos - endTag.length, tos);

    if (beforeText === startTag && afterText === endTag) {
      //=> undo (inside selection)
      editor.setSelection(toPos(editor, fos - startTag.length), toPos(editor, tos + endTag.length));
      editor.replaceSelection(selectedText);
      // re-select
      editor.setSelection(toPos(editor, fos - startTag.length), toPos(editor, tos - startTag.length));
    } else if (startText === startTag && endText === endTag) {
      //=> undo (outside selection)
      editor.replaceSelection(editor.getRange(toPos(editor, fos + startTag.length), toPos(editor, tos - endTag.length)));
      // re-select
      editor.setSelection(toPos(editor, fos), toPos(editor, tos - (startTag.length + endTag.length)));
    } else {
      editor.replaceSelection(`${startTag}${selectedText}${endTag}`);
      editor.setSelection(toPos(editor, fos + startTag.length), toPos(editor, tos + startTag.length));
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
