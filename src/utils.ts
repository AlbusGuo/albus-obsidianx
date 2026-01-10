import { PluginInfo, FilterType } from './types';

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 过滤插件列表
 */
export function filterPlugins(
    plugins: PluginInfo[],
    searchTerm: string,
    filterEnabled: FilterType,
    selectedGroup: string
): PluginInfo[] {
    return plugins.filter((plugin) => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        
        // 支持搜索插件名称、描述和作者
        const matchesSearch = lowerSearchTerm === "" ||
            plugin.name.toLowerCase().includes(lowerSearchTerm) ||
            plugin.remark.toLowerCase().includes(lowerSearchTerm) ||
            (plugin.author && plugin.author.toLowerCase().includes(lowerSearchTerm));

        const matchesFilter =
            filterEnabled === "all" ||
            (filterEnabled === "enabled" && plugin.enabled) ||
            (filterEnabled === "disabled" && !plugin.enabled);

        const matchesGroup = selectedGroup === "all" || plugin.group === selectedGroup;

        return matchesSearch && matchesFilter && matchesGroup;
    });
}

/**
 * 排序插件列表（按名称）
 */
export function sortPlugins(plugins: PluginInfo[]): PluginInfo[] {
    return [...plugins].sort((a, b) => {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
}

/**
 * 创建元素
 */
export function createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options?: {
        cls?: string | string[];
        text?: string;
        attr?: Record<string, string>;
        parent?: HTMLElement;
    }
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    
    if (options?.cls) {
        if (Array.isArray(options.cls)) {
            el.classList.add(...options.cls);
        } else {
            el.classList.add(options.cls);
        }
    }
    
    if (options?.text) {
        el.textContent = options.text;
    }
    
    if (options?.attr) {
        Object.entries(options.attr).forEach(([key, value]) => {
            el.setAttribute(key, value);
        });
    }
    
    if (options?.parent) {
        options.parent.appendChild(el);
    }
    
    return el;
}

/**
 * 设置图标
 */
export function setIcon(el: HTMLElement, iconName: string): void {
    // Obsidian 提供的 setIcon 函数
    // @ts-ignore
    if (window.setIcon) {
        // @ts-ignore
        window.setIcon(el, iconName);
    }
}
