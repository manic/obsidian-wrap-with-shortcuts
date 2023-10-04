import { PluginSettingTab, Setting } from "obsidian";
import WrapWithShortcut from "./main";
import WrapperCreatorModal from "./WrapperCreatorModal"

export default class SettingsTab extends PluginSettingTab {
	plugin: WrapWithShortcut;

	constructor(plugin: WrapWithShortcut) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	sortSettings(): void {
		this.plugin.settings.wrapperTags.sort(function (a, b) {
			return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
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
						new WrapperCreatorModal(this.plugin, async (result) => {
							this.plugin.settings.wrapperTags.push(result);
							this.display();
							await this.plugin.saveSettings();
							const index = this.plugin.settings.wrapperTags.length;
							this.plugin.getCommand(result, index);
						}).open();
					})
			})

		// Function: list current toggle settings
		this.plugin.settings.wrapperTags.forEach(wrapperTag => {
			const desc = `Press Hotkey => ${wrapperTag.startTag}{selectedText}${wrapperTag.endTag}`;
			new Setting(containerEl)
				.setName(wrapperTag.name)
				.setDesc(desc)
				.addExtraButton(bt => {
					bt.setIcon("pencil");
					bt.onClick(async () => {
						new WrapperCreatorModal(this.plugin,
							async (result) => {
								const tags = this.plugin.settings.wrapperTags;
								const index = tags.findIndex(
									(tag) => tag.name === result.name
								);
								if (index === -1) {
									this.plugin.settings.wrapperTags.push(
										result
									);
								} else {
									this.plugin.settings.wrapperTags = [
										...tags.slice(0, index),
										result,
										...tags.slice(index + 1),
									];
								}
								this.sortSettings();
								this.display();
								await this.plugin.saveSettings();
							},
							wrapperTag).open();
					})
				})
				.addExtraButton(bt => {
					bt.setIcon("trash");
					bt.onClick(async () => {
						const cmd = `${this.plugin.manifest.id}:wrap-with-shortcut-${wrapperTag.id}`
						// @ts-ignore
						await this.app.commands.removeCommand(cmd);
						this.plugin.settings.wrapperTags.remove(wrapperTag);
						this.display();
						await this.plugin.saveSettings();
					})
				})

		});
	}
}