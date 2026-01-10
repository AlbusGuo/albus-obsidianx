import { Plugin, Notice } from 'obsidian';
import { BlurSettings, DEFAULT_SETTINGS } from './models/types';
import { BlurManager } from './core/BlurManager';
import { CursorTrailManager } from './core/CursorTrailManager';
import { BlurManagePanel } from './ui/BlurManagePanel';
import { BlurSettingTab } from './ui/BlurSettingTab';
import { DOMUtils } from './utils/dom';
import { Logger } from './utils/logger';

export default class BlurPlugin extends Plugin {
    settings: BlurSettings;
    blurManager: BlurManager;
    cursorTrailManager: CursorTrailManager;
    blurPanel: BlurManagePanel | null = null;
    logger: Logger;

    async onload() {
        this.logger = new Logger(this);
        await this.loadSettings();
        
        // 加载 GSAP 库
        await this.loadGSAP();
        
        // 强制设置选择模式为关闭状态
        this.settings.isSelectingMode = false;
        await this.saveSettings();
        
        this.blurManager = new BlurManager(this);
        this.cursorTrailManager = new CursorTrailManager(this);

        // 添加 ribbon 图标
        const ribbonIconEl = this.addRibbonIcon('eye-off', 'Blur mode', (evt: MouseEvent) => {
            if (evt.button === 0) { // 左键点击
                this.settings.isBlurActive = !this.settings.isBlurActive;
                if (this.settings.isBlurActive) {
                    this.blurManager.applyBlurEffects();
                    if (this.settings.enableCursorTrail) {
                        this.cursorTrailManager.enable();
                    }
                } else {
                    this.blurManager.removeBlurEffects();
                    this.cursorTrailManager.disable();
                }
                this.saveSettings();
            } else if (evt.button === 2) { // 右键点击
                if (!this.blurPanel) {
                    this.blurPanel = new BlurManagePanel(this);
                    this.blurPanel.open();
                    this.settings.isSelectingMode = true;
                    this.saveSettings();
                }
            }
        });

        // 添加右键菜单
        ribbonIconEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 添加设置面板
        this.addSettingTab(new BlurSettingTab(this.app, this));

        // 添加命令
        this.addCommand({
            id: 'toggle-blur',
            name: 'Toggle   effect',
            callback: () => {
                this.settings.isBlurActive = !this.settings.isBlurActive;
                if (this.settings.isBlurActive) {
                    this.blurManager.applyBlurEffects();
                    if (this.settings.enableCursorTrail) {
                        this.cursorTrailManager.enable();
                    }
                } else {
                    this.blurManager.removeBlurEffects();
                    this.cursorTrailManager.disable();
                }
                this.saveSettings();
            }
        });

        // 添加打开管理面板命令
        this.addCommand({
            id: 'open-blur-panel',
            name: 'Open management panel',
            callback: () => {
                if (!this.blurPanel) {
                    this.blurPanel = new BlurManagePanel(this);
                    this.blurPanel.open();
                    this.settings.isSelectingMode = true;
                    this.saveSettings();
                }
            }
        });

        // 添加点击事件监听
        this.registerDomEvent(document, 'click', this.handleClick.bind(this));

        // 如果设置为激活状态，则应用模糊效果
        if (this.settings.isBlurActive) {
            this.blurManager.applyBlurEffects();
            if (this.settings.enableCursorTrail) {
                this.cursorTrailManager.enable();
            }
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private async loadGSAP() {
        // 检查 GSAP 是否已经加载
        if (typeof window !== 'undefined' && !(window as any).gsap) {
            // 动态加载 GSAP
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
            script.integrity = 'sha512-7eHRwcbYkK4d9g/6tD/mhkf++eoTHwpNM9woBxtPUBWm67zeAfFC+HrdoE2GanKeocly/VxeLvIqwvCdk7qScg==';
            script.crossOrigin = 'anonymous';
            script.referrerPolicy = 'no-referrer';
            
            return new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
    }

    private handleClick(event: MouseEvent) {
        if (!this.settings.isSelectingMode) return;

        const target = event.target as HTMLElement;
        if (!target) return;

        this.blurManager.togglePresetElement(target);
    }

    onunload() {
        // 清理所有模糊效果
        this.blurManager.removeBlurEffects();
        
        // 清理光标拖尾效果
        this.cursorTrailManager.disable();
        
        // 清理所有高亮效果
        document.querySelectorAll('.blur-plugin-preset, .blur-plugin-hover, .blur-plugin-selecting').forEach(el => {
            el.classList.remove('blur-plugin-preset', 'blur-plugin-hover', 'blur-plugin-selecting');
        });
        
        // 关闭面板
        if (this.blurPanel) {
            this.blurPanel.close();
        }
    }

    // 这些方法暂时保留在主类中，因为多个组件都需要使用
    isEditorElement(element: HTMLElement): boolean {
        return DOMUtils.isEditorElement(element);
    }

    isRibbonElement(element: HTMLElement): boolean {
        return DOMUtils.isRibbonElement(element);
    }

    isManagePanelElement(element: HTMLElement): boolean {
        return DOMUtils.isManagePanelElement(element);
    }
}
export { BlurPlugin };