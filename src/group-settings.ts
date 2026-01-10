import { App, PluginSettingTab, Setting, Notice, Modal, setIcon } from 'obsidian';
import ObsidianXPlugin from './main';
import { DataStorage } from './data-storage';

/**
 * 分组管理设置标签
 */
export class GroupManagementSettingTab extends PluginSettingTab {
    plugin: ObsidianXPlugin;
    private dataStorage: DataStorage;
    private editingGroup: { key: string; name: string } | null = null;

    constructor(app: App, plugin: ObsidianXPlugin, dataStorage: DataStorage) {
        super(app, plugin);
        this.plugin = plugin;
        this.dataStorage = dataStorage;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // 插件分组
        new Setting(containerEl)
            .setName('插件分组')
            .setHeading();
        this.displayGroupList(containerEl, 'plugin');
        this.displayAddGroup(containerEl, 'plugin');

        // CSS片段分组
        new Setting(containerEl)
            .setName('CSS片段分组')
            .setHeading();
        this.displayGroupList(containerEl, 'css');
        this.displayAddGroup(containerEl, 'css');
    }

    /**
     * 显示分组列表
     */
    private displayGroupList(containerEl: HTMLElement, type: 'plugin' | 'css'): void {
        const groups = type === 'plugin' 
            ? this.dataStorage.getSettings().groups 
            : this.dataStorage.getSettings().cssGroups;
        const editableGroups = Object.keys(groups).filter(key => key !== 'all' && key !== 'other');

        if (editableGroups.length === 0) {
            // 空状态下不显示任何内容，避免多余分割线
            return;
        }

        editableGroups.forEach(groupKey => {
            const groupName = groups[groupKey] || '';
            this.displayGroupItem(containerEl, groupKey, groupName, type);
        });
    }

    /**
     * 显示分组项
     */
    private displayGroupItem(parent: HTMLElement, groupKey: string, groupName: string, type: 'plugin' | 'css'): void {
        const item = parent.createDiv('albus-obsidianx-group-item');

        // 内容区域
        const content = item.createDiv('albus-obsidianx-group-item-content');

        if (this.editingGroup?.key === groupKey) {
            // 编辑模式
            const editInput = content.createDiv('albus-obsidianx-group-edit-input');
            const input = editInput.createEl('input', {
                type: 'text',
                cls: 'albus-obsidianx-group-name-input',
                value: this.editingGroup.name
            });

            input.addEventListener('input', (e) => {
                if (this.editingGroup) {
                    this.editingGroup.name = (e.target as HTMLInputElement).value;
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.updateGroup(groupKey, type);
                } else if (e.key === 'Escape') {
                    this.editingGroup = null;
                    this.display();
                }
            });

            input.addEventListener('blur', () => {
                this.updateGroup(groupKey, type);
            });

            // 自动聚焦
            setTimeout(() => input.focus(), 0);
        } else {
            // 显示模式
            const display = content.createDiv('albus-obsidianx-group-name-display');
            display.textContent = groupName;
            display.addEventListener('click', () => {
                this.editingGroup = { key: groupKey, name: groupName };
                this.display();
            });
        }

        // 操作按钮
        const actions = item.createDiv('albus-obsidianx-group-item-actions');
        const deleteBtn = actions.createEl('button', {
            cls: 'albus-obsidianx-group-delete-button',
            title: '删除分组'
        });
        setIcon(deleteBtn, 'trash-2');
        
        deleteBtn.addEventListener('click', () => {
            this.deleteGroup(groupKey, type);
        });
    }

    /**
     * 显示添加分组按钮
     */
    private displayAddGroup(containerEl: HTMLElement, type: 'plugin' | 'css'): void {
        new Setting(containerEl)
            .addButton(button => {
                button
                    .setButtonText(type === 'plugin' ? '添加插件分组' : '添加CSS片段分组')
                    .setCta()
                    .onClick(() => {
                        this.showAddGroupDialog(type);
                    });
            });
    }

    /**
     * 显示添加分组对话框
     */
    private showAddGroupDialog(type: 'plugin' | 'css'): void {
        const modal = new AddGroupModal(this.app, type, async (groupName) => {
            await this.addGroup(groupName, type);
            this.display();
        });
        modal.open();
    }

    /**
     * 添加分组
     */
    private async addGroup(groupName: string, type: 'plugin' | 'css'): Promise<void> {
        if (!groupName.trim()) {
            new Notice('请输入分组名称');
            return;
        }

        const groupKey = groupName.toLowerCase().replace(/\s+/g, '_');
        const groups = type === 'plugin' 
            ? this.dataStorage.getSettings().groups 
            : this.dataStorage.getSettings().cssGroups;

        // 检查是否已存在
        if (groups[groupKey]) {
            new Notice('分组已存在');
            return;
        }

        const updatedGroups = {
            ...groups,
            [groupKey]: groupName.trim()
        };

        if (type === 'plugin') {
            await this.dataStorage.updateGroups(updatedGroups);
        } else {
            await this.dataStorage.updateCSSGroups(updatedGroups);
        }
        new Notice(`分组"${groupName}"添加成功`);
        this.display();
    }

    /**
     * 更新分组
     */
    private async updateGroup(groupKey: string, type: 'plugin' | 'css'): Promise<void> {
        if (!this.editingGroup) return;

        const newName = this.editingGroup.name.trim();
        
        if (!newName) {
            new Notice('分组名称不能为空');
            this.editingGroup = null;
            this.display();
            return;
        }

        const groups = type === 'plugin' 
            ? this.dataStorage.getSettings().groups 
            : this.dataStorage.getSettings().cssGroups;
        const updatedGroups = { ...groups };
        updatedGroups[groupKey] = newName;

        if (type === 'plugin') {
            await this.dataStorage.updateGroups(updatedGroups);
        } else {
            await this.dataStorage.updateCSSGroups(updatedGroups);
        }
        new Notice('分组更新成功');
        this.editingGroup = null;
        this.display();
    }

    /**
     * 删除分组
     */
    private async deleteGroup(groupKey: string, type: 'plugin' | 'css'): Promise<void> {
        if (groupKey === 'all' || groupKey === 'other') {
            new Notice('系统分组不能被删除');
            return;
        }

        const settings = this.dataStorage.getSettings();
        const groups = type === 'plugin' ? settings.groups : settings.cssGroups;
        const updatedGroups = { ...groups };
        delete updatedGroups[groupKey];

        if (type === 'plugin') {
            await this.dataStorage.updateGroups(updatedGroups);
            
            // 将该分组的插件移动到"其他"分组
            const metadata = settings.metadata;
            let updated = false;

            for (const pluginId in metadata) {
                if (metadata[pluginId] && metadata[pluginId].group === groupKey) {
                    metadata[pluginId].group = 'other';
                    updated = true;
                }
            }

            if (updated) {
                await this.dataStorage.saveSettings();
            }
        } else {
            await this.dataStorage.updateCSSGroups(updatedGroups);
            
            // 将该分组的CSS片段移动到"其他"分组
            const cssSnippetMetadata = settings.cssSnippetMetadata;
            let updated = false;

            for (const snippetName in cssSnippetMetadata) {
                if (cssSnippetMetadata[snippetName] && cssSnippetMetadata[snippetName].group === groupKey) {
                    cssSnippetMetadata[snippetName].group = 'other';
                    updated = true;
                }
            }

            if (updated) {
                await this.dataStorage.saveSettings();
            }
        }

        new Notice('分组删除成功');
        this.display();
    }
}

/**
 * 添加分组对话框
 */
class AddGroupModal extends Modal {
    private type: 'plugin' | 'css';
    private onSubmit: (groupName: string) => void;

    constructor(app: App, type: 'plugin' | 'css', onSubmit: (groupName: string) => void) {
        super(app);
        this.type = type;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        contentEl.createEl('h2', { text: this.type === 'plugin' ? '添加插件分组' : '添加CSS片段分组' });

        const inputContainer = contentEl.createDiv();
        const input = inputContainer.createEl('input', {
            type: 'text',
            placeholder: '输入分组名称',
            cls: 'albus-obsidianx-modal-input'
        });
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.marginTop = '12px';
        input.style.marginBottom = '16px';

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit(input.value);
            } else if (e.key === 'Escape') {
                this.close();
            }
        });

        const buttonContainer = contentEl.createDiv();
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '8px';

        const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
        cancelBtn.addEventListener('click', () => this.close());

        const submitBtn = buttonContainer.createEl('button', { text: '添加', cls: 'mod-cta' });
        submitBtn.addEventListener('click', () => this.submit(input.value));

        setTimeout(() => input.focus(), 10);
    }

    private submit(value: string) {
        if (value.trim()) {
            this.onSubmit(value.trim());
            this.close();
        } else {
            new Notice('请输入分组名称');
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
