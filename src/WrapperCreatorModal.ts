import { Modal, Setting } from "obsidian";

import WrapWithShortcut from "../main";

export default class WrapperCreatorModal extends Modal {
	plugin: WrapWithShortcut;
	name: string;
	commandKey: string;
	startTag: string;
	endTag: string;

	constructor(plugin: WrapWithShortcut) {
		super(plugin.app);
	}

	onOpen() {
		super.onOpen();
		this.display();
	}

	display() {
		const { contentEl: el } = this;
		el.empty();
		this.titleEl.setText("Add a new wrapper")

		new Setting(el)
			.setName('Name')
			.setDesc("Specify the Name of your wrapper.")
			.addText(cb => {
				cb.setValue(this.name ?? "")
					.onChange(value => {
						this.name = value.trim();
					})
			})

		new Setting(el)
			.setName('Command Key')
			.setDesc("Specify the shortcut key(You can re-map it in OPTIONS -> Hotkeys).")
			.addText(cb => {
				cb.setValue(this.commandKey ?? "")
					.onChange(value => {
						this.commandKey = value.trim().toLowerCase()[0] ?? "";
					})
			})

		new Setting(el)
			.setName('Start Tag')
			.setDesc("Specify the start tag")
			.addText(cb => {
				cb.setValue(this.startTag ?? "")
					.onChange(value => {
						this.startTag = value.trim();
					})
			})

		new Setting(el)
			.setName('End Tag')
			.setDesc("Specify the end tag")
			.addText(cb => {
				cb.setValue(this.endTag ?? "")
					.onChange(value => {
						this.endTag = value.trim();
					})
			})

		const btnDiv = el.createDiv({ cls: "M-flex-center" })
		const btn = createEl("button", { text: "Finish" })
		btnDiv.appendChild(btn);
		btn.addEventListener("click", () => {
			dispatchEvent(new CustomEvent("M-wrapperAdded", {
				detail: {
					name: this.name,
					commandKey: this.commandKey,
					startTag: this.startTag,
					endTag: this.endTag,
				}
			}));
			this.close();
		});

	}
}