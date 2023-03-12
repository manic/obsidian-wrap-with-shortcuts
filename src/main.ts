import { Plugin, EditorPosition, Command, Editor } from "obsidian";
import SettingsTab from './SettingsTab'

export interface WrapperTag {
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
      name: 'Underline',
      startTag: '<u>',
      endTag: '</u>'
    },
  ]
}

export default class WrapWithShortcut extends Plugin {
  settings: WrapperTagSettings;

  async onload() {
    await this.loadSettings();

    this.settings.wrapperTags.forEach((wrapperTag, index) => {
      const command: Command = {
        id: `wrap-with-shortcut-${index}`,
        name: `Toggle ${wrapperTag.name}`,
        editorCallback: (editor:Editor) => this.wrapSelectedTextIn(editor, wrapperTag.startTag, wrapperTag.endTag),
      };
      this.addCommand(command);
	  this.addSettingTab(new SettingsTab(this.app,this));
    });

  }

  wrapSelectedTextIn(editor:Editor, startTag = '<u>', endTag = '</u>'): void {
    if (startTag === '' && endTag === '') { //allow monotag
      return;
    }
    const selectedText = editor.getSelection();

    function toPos(pos: number): EditorPosition {
      return editor.offsetToPos(pos);
    }

    function getRange(editor:Editor,from: number, to: number): string {
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

    const beforeText = getRange(editor,fos - startTag.length, tos - len);
    const afterText = getRange(editor,fos + len, tos + endTag.length);
    const startText = getRange(editor,fos, fos + startTag.length);
    const endText = getRange(editor,tos - endTag.length, tos);

    if (beforeText === startTag && afterText === endTag) {
      //=> undo (inside selection)
      editor.setSelection(toPos(fos - startTag.length), toPos(tos + endTag.length));
      editor.replaceSelection(selectedText);
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
}