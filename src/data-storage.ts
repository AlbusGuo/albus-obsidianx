import { Plugin } from 'obsidian';
import { ObsidianXSettings, PluginMetadata, CSSSnippetMetadata } from './types';

/**
 * 默认插件分组配置
 */
export const DEFAULT_GROUPS = {
    "all": "全部插件",
    "other": "其他插件"
};

/**
 * 默认CSS片段分组配置
 */
export const DEFAULT_CSS_GROUPS = {
    "all": "全部片段",
    "other": "其他片段"
};

/**
 * 默认设置
 */
export const DEFAULT_SETTINGS: ObsidianXSettings = {
    groups: DEFAULT_GROUPS,
    cssGroups: DEFAULT_CSS_GROUPS,
    metadata: {},
    cssSnippetMetadata: {}
};

/**
 * 数据存储管理类
 * 负责插件数据的加载、保存和管理
 */
export class DataStorage {
    private plugin: Plugin;
    private settings: ObsidianXSettings;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.settings = DEFAULT_SETTINGS;
    }

    /**
     * 加载设置数据
     */
    async loadSettings(): Promise<void> {
        const data = await this.plugin.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
        
        // 确保默认分组存在
        if (!this.settings.groups) {
            this.settings.groups = DEFAULT_GROUPS;
        }
        if (!this.settings.cssGroups) {
            this.settings.cssGroups = DEFAULT_CSS_GROUPS;
        }
        if (!this.settings.metadata) {
            this.settings.metadata = {};
        }
        if (!this.settings.cssSnippetMetadata) {
            this.settings.cssSnippetMetadata = {};
        }
    }

    /**
     * 保存设置数据
     */
    async saveSettings(): Promise<void> {
        await this.plugin.saveData(this.settings);
    }

    /**
     * 获取当前设置
     */
    getSettings(): ObsidianXSettings {
        return this.settings;
    }

    /**
     * 更新插件分组配置
     */
    async updateGroups(groups: Record<string, string>): Promise<void> {
        this.settings.groups = groups;
        await this.saveSettings();
    }

    /**
     * 更新CSS片段分组配置
     */
    async updateCSSGroups(cssGroups: Record<string, string>): Promise<void> {
        this.settings.cssGroups = cssGroups;
        await this.saveSettings();
    }

    /**
     * 获取插件元数据
     */
    getPluginMetadata(pluginId: string): PluginMetadata {
        return this.settings.metadata[pluginId] || {
            remark: '',
            group: 'other',
            lastModified: new Date().toISOString()
        };
    }

    /**
     * 保存插件元数据
     */
    async savePluginMetadata(pluginId: string, metadata: Partial<PluginMetadata>): Promise<void> {
        const current = this.getPluginMetadata(pluginId);
        this.settings.metadata[pluginId] = {
            ...current,
            ...metadata,
            lastModified: new Date().toISOString()
        };
        await this.saveSettings();
    }

    /**
     * 删除插件元数据
     */
    async deletePluginMetadata(pluginId: string): Promise<void> {
        delete this.settings.metadata[pluginId];
        await this.saveSettings();
    }

    /**
     * 获取CSS片段元数据
     */
    getCSSSnippetMetadata(snippetName: string): CSSSnippetMetadata {
        return this.settings.cssSnippetMetadata[snippetName] || {
            description: '',
            group: 'other',
            lastModified: new Date().toISOString()
        };
    }

    /**
     * 保存CSS片段元数据
     */
    async saveCSSSnippetMetadata(snippetName: string, metadata: Partial<CSSSnippetMetadata>): Promise<void> {
        const current = this.getCSSSnippetMetadata(snippetName);
        this.settings.cssSnippetMetadata[snippetName] = {
            ...current,
            ...metadata,
            lastModified: new Date().toISOString()
        };
        await this.saveSettings();
    }

    /**
     * 删除CSS片段元数据
     */
    async deleteCSSSnippetMetadata(snippetName: string): Promise<void> {
        delete this.settings.cssSnippetMetadata[snippetName];
        await this.saveSettings();
    }
}
