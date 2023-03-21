import { Command, Editor, EditorPosition, Plugin} from "obsidian";
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

  async onload() {
    await this.loadSettings();
    if (this.settings.wrapperTags.length > 0 && !this.settings.wrapperTags[0].id) {
      await this.applyWrapperTagID();
    }

    this.settings.wrapperTags.forEach((wrapperTag, index) => {
      const command: Command = {
        id: `wrap-with-shortcut-${wrapperTag.id}`,
        name: `Toggle ${wrapperTag.name}`,
        editorCallback: (editor: Editor) => this.wrapSelectedTextIn(editor, wrapperTag.startTag, wrapperTag.endTag),
      };
      this.addCommand(command);
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
}
