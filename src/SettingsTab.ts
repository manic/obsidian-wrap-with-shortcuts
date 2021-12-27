import { PluginSettingTab, Setting, Notice } from "obsidian";
import WrapWithShortcut from "../main";
import WrapperCreatorModal from "./WrapperCreatorModal"

export default class SettingsTab extends PluginSettingTab {
	plugin: WrapWithShortcut;

	constructor(plugin: WrapWithShortcut) {
		super(plugin.app, plugin);
		this.plugin = plugin;

		addEventListener("M-wrapperAdded", async (e: CustomEvent) => {
			this.plugin.settings.wrapperTags.push({
				name: e.detail.name,
				commandKey: e.detail.commandKey,
				startTag: e.detail.startTag,
				endTag: e.detail.endTag,
			});

			await this.plugin.saveSettings();
			new Notice("You will need to restart Obsidian to use it.");
			this.display();
		});
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'Wrapper Settings' });

		// Function: Add new formatting shortcut
		new Setting(containerEl)
			.setName("Add a new wrapper with a shortcut")
			.setDesc("Create a new wrapper to wrap the selected text in the custom tags.")
			.addButton(cb => {
				cb.setButtonText("+")
					.onClick(() => {
						new WrapperCreatorModal(this.plugin).open();
					})
			})

		// Function: list current toggle settings
		this.plugin.settings.wrapperTags.forEach(wrapperTag => {
			const desc = `Ctrl + ${wrapperTag.commandKey} => ${wrapperTag.startTag}{selectedText}${wrapperTag.endTag}`;
			new Setting(containerEl)
				.setName(wrapperTag.name)
				.setDesc(desc)
				.addExtraButton(bt => {
					bt.setIcon("trash");
					bt.onClick(async () => {
						this.plugin.settings.wrapperTags.remove(wrapperTag);
						this.display();
						new Notice("You will need to restart Obsidian to fully remove the Wrapper.");
						await this.plugin.saveSettings();
					})
				})

		});
	}
}