import { App, PluginSettingTab, Setting } from 'obsidian';
import { BlurPlugin } from '../main';
import { BlurManagePanel } from './BlurManagePanel';

export class BlurSettingTab extends PluginSettingTab {
    plugin: BlurPlugin;

    constructor(app: App, plugin: BlurPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Blur amount setting
        new Setting(containerEl)
            .setName('Blur amount')
            .setDesc('Set the amount of blur (in em)')
            .addText(text => text
                .setPlaceholder('0.5em')
                .setValue(this.plugin.settings.blurAmount)
                .onChange(async (value) => {
                    this.plugin.settings.blurAmount = value;
                    await this.plugin.saveSettings();
                    if (this.plugin.settings.isBlurActive) {
                        this.plugin.blurManager.applyBlurEffects();
                    }
                }));

        // Cursor trail settings heading
        new Setting(containerEl).setName('Cursor trail settings').setHeading();

        // Enable cursor trail
        new Setting(containerEl)
            .setName('Enable cursor trail')
            .setDesc('Show text trail effect when cursor moves (only active when blur mode is enabled)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableCursorTrail)
                .onChange(async (value) => {
                    this.plugin.settings.enableCursorTrail = value;
                    await this.plugin.saveSettings();
                    
                    // 如果 blur mode 已启用，则立即应用或移除拖尾效果
                    if (this.plugin.settings.isBlurActive) {
                        if (value) {
                            this.plugin.cursorTrailManager.enable();
                        } else {
                            this.plugin.cursorTrailManager.disable();
                        }
                    }
                }));

        // Cursor trail text
        new Setting(containerEl)
            .setName('Cursor trail text')
            .setDesc('The text to display as cursor trail')
            .addText(text => text
                .setPlaceholder('trail')
                .setValue(this.plugin.settings.cursorTrailText)
                .onChange(async (value) => {
                    this.plugin.settings.cursorTrailText = value || 'trail';
                    await this.plugin.saveSettings();
                    
                    // 更新拖尾文字
                    if (this.plugin.settings.isBlurActive && this.plugin.settings.enableCursorTrail) {
                        this.plugin.cursorTrailManager.updateTrailText();
                    }
                }));

        // Trail speed setting
        new Setting(containerEl)
            .setName('Trail speed')
            .setDesc('Animation delay between characters (lower = faster, higher = slower)')
            .addSlider(slider => slider
                .setLimits(0.01, 0.2, 0.01)
                .setValue(this.plugin.settings.trailSpeed)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.trailSpeed = value;
                    await this.plugin.saveSettings();
                }));

        // Character spacing setting
        new Setting(containerEl)
            .setName('Character spacing')
            .setDesc('Spacing between characters in the trail (in em)')
            .addSlider(slider => slider
                .setLimits(0.3, 2.0, 0.1)
                .setValue(this.plugin.settings.characterSpacing)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.characterSpacing = value;
                    await this.plugin.saveSettings();
                    
                    // 更新拖尾文字以应用新的间距
                    if (this.plugin.settings.isBlurActive && this.plugin.settings.enableCursorTrail) {
                        this.plugin.cursorTrailManager.updateTrailText();
                    }
                }));

        // Manage presets setting
        new Setting(containerEl)
            .setName('Manage presets')
            .setDesc('Open the preset management panel')
            .addButton(button => button
                .setButtonText('Open panel')
                .onClick(() => {
                    if (!this.plugin.blurPanel) {
                        this.plugin.blurPanel = new BlurManagePanel(this.plugin);
                        this.plugin.blurPanel?.open();
                    }
                }));

        // Keywords list
        new Setting(containerEl).setName('Current keywords').setHeading();
        const keywordList = containerEl.createEl('ul');
        this.plugin.settings.keywords.forEach((keyword: string) => {
            keywordList.createEl('li', { text: keyword });
        });

        // Debug mode setting (moved to bottom)
        new Setting(containerEl)
            .setName('Debug mode')
            .setDesc('Enable debug mode to show console logs')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.isDebugMode)
                .onChange(async (value) => {
                    this.plugin.settings.isDebugMode = value;
                    await this.plugin.saveSettings();
                }));
    }
}