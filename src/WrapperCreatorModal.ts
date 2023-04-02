import { Modal, Setting } from "obsidian";

import WrapWithShortcut, { WrapperTag } from "../main";

export default class WrapperCreatorModal extends Modal {
	plugin: WrapWithShortcut;
	wrapper: WrapperTag;
	editMode: boolean;
	onSubmit: (wrapper: WrapperTag) => void;

	constructor(plugin: WrapWithShortcut, onSubmit: (wrapper: WrapperTag) => void, wrapper?: WrapperTag) {
		super(plugin.app);
		if (wrapper) {
			this.wrapper = wrapper;
			this.editMode = true;
		} else {
			this.wrapper = { id: `w${new Date().getTime()}`, name: '', startTag: '', endTag: '' };
			this.editMode = false;
		}
		this.onSubmit = onSubmit;
	}

	onOpen() {
		super.onOpen();
		this.display();
	}

	display() {
		const { contentEl: el } = this;
		el.empty();
		this.titleEl.setText(this.editMode ? "Edit wrapper" : "Add a new wrapper")

		new Setting(el)
			.setName('Name')
			.setDesc("Specify the Name of your wrapper.")
			.addText((cb) => {
				cb.setValue(this.wrapper.name ?? "")
					.onChange(value => {
						this.wrapper.name = value.trim();
					})
			})

		new Setting(el)
			.setName('Start Tag')
			.setDesc("Specify the start tag")
			.addTextArea((cb) => {
				cb.setValue(this.wrapper.startTag ?? "")
					.onChange(value => {
						this.wrapper.startTag = value;
					})
			})

		new Setting(el)
			.setName('End Tag')
			.setDesc("Specify the end tag")
			.addTextArea((cb) => {
				cb.setValue(this.wrapper.endTag ?? "")
					.onChange(value => {
						this.wrapper.endTag = value;
					})
			})

		new Setting(el).addButton((btn) =>
		btn
			.setButtonText("Submit")
			.setCta()
			.onClick(() => {
				this.onSubmit(this.wrapper);
				this.close();
			})
		);

	}
}