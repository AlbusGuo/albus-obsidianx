import {
    App,
    Notice,
    TFile,
    WorkspaceLeaf,
    OpenViewState,
} from 'obsidian';
import { around } from 'monkey-around';
import { OpenerSettings } from './types';
import ObsidianXPlugin from './main';

/**
 * Opener 功能管理器
 * 负责处理文件打开行为的自定义逻辑
 */
export class OpenerManager {
    private app: App;
    private plugin: ObsidianXPlugin;
    private settings: OpenerSettings;
    
    // Meta 键状态跟踪
    private isMetaKeyHeld: boolean | null = null;
    
    // 临时标记：下次打开在同一标签页
    private sameTabOnce: boolean = false;
    
    // Monkey patch 清理函数
    private uninstallMonkeyPatchOpenFile: (() => void) | null = null;

    constructor(app: App, plugin: ObsidianXPlugin, settings: OpenerSettings) {
        this.app = app;
        this.plugin = plugin;
        this.settings = settings;
    }

    /**
     * 初始化 Opener 功能
     */
    initialize(): void {
        this.updateMetaKeyListeners();
        this.monkeyPatchOpenFile();
        this.registerCommands();
        this.registerFileMenu();
    }

    /**
     * 清理 Opener 功能
     */
    cleanup(): void {
        if (this.uninstallMonkeyPatchOpenFile) {
            this.uninstallMonkeyPatchOpenFile();
            this.uninstallMonkeyPatchOpenFile = null;
        }
        this.removeMetaKeyListeners();
    }

    /**
     * 更新设置
     */
    updateSettings(settings: OpenerSettings): void {
        this.settings = settings;
        this.updateMetaKeyListeners();
    }

    /**
     * 注册命令
     */
    private registerCommands(): void {
        // 下次在同一标签页打开
        this.plugin.addCommand({
            id: "opener-same-tab-once",
            name: "下次在同一标签页打开文件（Obsidian默认行为）",
            checkCallback: (checking: boolean) => {
                if (checking) {
                    return this.settings.newTab;
                }
                this.sameTabOnce = true;
                new Notice("下次打开文件将在同一标签页");
                return true;
            }
        });

        // 启用新标签页
        this.plugin.addCommand({
            id: "opener-enable-new-tab",
            name: "启用所有文件在新标签页打开",
            checkCallback: (checking: boolean) => {
                if (checking) {
                    return !this.settings.newTab;
                }
                this.settings.newTab = true;
                this.plugin.saveSettings();
                new Notice("已启用：所有文件在新标签页打开");
                return true;
            },
        });

        // 禁用新标签页
        this.plugin.addCommand({
            id: "opener-disable-new-tab",
            name: "禁用所有文件在新标签页打开",
            checkCallback: (checking: boolean) => {
                if (checking) {
                    return this.settings.newTab;
                }
                this.settings.newTab = false;
                this.plugin.saveSettings();
                new Notice("已禁用：所有文件在新标签页打开");
                return true;
            }
        });

        // 启用 PDF 外部应用
        this.plugin.addCommand({
            id: "opener-enable-pdf",
            name: "启用所有 PDF 使用系统默认应用打开",
            checkCallback: (checking: boolean) => {
                if (checking) {
                    return !this.settings.PDFApp;
                }
                this.settings.PDFApp = true;
                this.plugin.saveSettings();
                new Notice("已启用：PDF 使用系统默认应用打开");
                return true;
            }
        });

        // 禁用 PDF 外部应用
        this.plugin.addCommand({
            id: "opener-disable-pdf",
            name: "禁用所有 PDF 使用系统默认应用打开",
            checkCallback: (checking: boolean) => {
                if (checking) {
                    return this.settings.PDFApp;
                }
                this.settings.PDFApp = false;
                this.plugin.saveSettings();
                new Notice("已禁用：PDF 使用系统默认应用打开");
                return true;
            }
        });

        // 在新标签页打开图谱视图
        this.plugin.addCommand({
            id: "opener-open-graph-view-in-new-tab",
            name: "在新标签页打开图谱视图",
            callback: () => {
                // @ts-ignore
                this.app.commands.executeCommandById("workspace:new-tab");
                // @ts-ignore
                this.app.commands.executeCommandById("graph:open");
            },
        });
    }

    /**
     * 注册文件右键菜单
     */
    private registerFileMenu(): void {
        this.plugin.registerEvent(
            this.app.workspace.on("file-menu", (menu, file, source, leaf) => {
                if (file instanceof TFile) {
                    menu.addItem((item) => {
                        item.setSection("open");
                        item.setTitle("在同一标签页打开")
                            .onClick(() => {
                                this.sameTabOnce = true;
                                this.app.workspace.getLeaf().openFile(file);
                            });
                    });
                }
            })
        );
    }

    /**
     * Meta 键按下处理
     */
    private keyDownHandler = (e: KeyboardEvent) => {
        if (e.key === 'Meta' || e.key === 'Control') {
            this.isMetaKeyHeld = true;
        }
    }

    /**
     * Meta 键抬起处理
     */
    private keyUpHandler = (e: KeyboardEvent) => {
        if (e.key === 'Meta' || e.key === 'Control') {
            this.isMetaKeyHeld = false;
        }
    }

    /**
     * 鼠标按下处理
     * 当应用失去焦点时键盘事件不会触发，因此需要鼠标事件
     */
    private mouseDownHandler = (e: MouseEvent) => {
        if (e.metaKey || e.ctrlKey) {
            this.isMetaKeyHeld = true;
        } else {
            this.isMetaKeyHeld = false;
        }
    }

    /**
     * 添加 Meta 键监听器
     */
    private addMetaKeyListeners(): void {
        if (this.isMetaKeyHeld !== null) return; // 已添加
        this.isMetaKeyHeld = false;
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        document.addEventListener('mousedown', this.mouseDownHandler, { capture: true });
    }

    /**
     * 移除 Meta 键监听器
     */
    private removeMetaKeyListeners(): void {
        if (this.isMetaKeyHeld === null) return; // 未添加
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
        document.removeEventListener('mousedown', this.mouseDownHandler, { capture: true });
        this.isMetaKeyHeld = null;
    }

    /**
     * 根据设置更新 Meta 键监听器
     */
    private updateMetaKeyListeners(): void {
        if (this.settings.extOnlyWhenMetaKey) {
            this.addMetaKeyListeners();
        } else {
            this.removeMetaKeyListeners();
        }
    }

    /**
     * Monkey patch WorkspaceLeaf.openFile 方法
     */
    private monkeyPatchOpenFile(): void {
        const parentThis = this;
        
        this.uninstallMonkeyPatchOpenFile = around(WorkspaceLeaf.prototype, {
            openFile(oldOpenFile) {
                return async function (this: WorkspaceLeaf, file: TFile, openState?: OpenViewState) {
                    const defaultBehavior = () => {
                        return oldOpenFile.apply(this, [file, openState]);
                    }
                    
                    const preparedEmptyLeave = this.getViewState()?.type == 'empty';

                    // 嵌入的 iframe
                    if (openState?.state?.mode && preparedEmptyLeave) {
                        // mode 是 preview 或 source（例如 hover editor, excalidraw, embeddings 等）
                        return defaultBehavior();
                    }

                    // 相同文件
                    if (file.path == parentThis.app.workspace.getActiveFile()?.path && openState?.eState?.subpath) {
                        // 点击与当前视图相同路径的链接（例如标题、块等）
                        return defaultBehavior();
                    }

                    // 临时标记：在同一标签页打开
                    if (parentThis.sameTabOnce) {
                        parentThis.sameTabOnce = false;
                        return defaultBehavior();
                    }

                    // 外部文件处理
                    const ALLEXT = ['png', 'webp', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'mp3', 'webm', 'wav', 'm4a', 'ogg', '3gp', 'flac', 'mp4', 'ogv', 'mov', 'mkv'];
                    const OBSID_OPENABLE = ALLEXT.concat(['md', 'canvas', 'pdf']);
                    
                    if (
                        (parentThis.settings.PDFApp && file.extension == 'pdf')
                        || (parentThis.settings.allExt && ALLEXT.includes(file.extension))
                        || (parentThis.settings.custExt && parentThis.settings.custExtList.includes(file.extension))
                    ) {
                        if (!parentThis.settings.extOnlyWhenMetaKey || parentThis.isMetaKeyHeld) {
                            new Notice('使用系统默认应用打开外部文件（Opener）');
                            if (preparedEmptyLeave) {
                                // 关闭准备好的空标签页
                                this.detach();
                            }
                            // @ts-ignore
                            parentThis.app.openWithDefaultApp(file.path);
                            return;
                        } else {
                            new Notice('提示：按住 Cmd/Ctrl 键使用系统默认应用打开');
                        }
                    }

                    // 不使用新标签页
                    if (!parentThis.settings.newTab) {
                        return defaultBehavior();
                    }

                    // 链接的标签页
                    if ((this as WorkspaceLeaf & { group?: unknown }).group) {
                        // 标签页链接到另一个标签页（group）
                        new Notice('这是一个链接标签页！将在同一标签页打开。');
                        return defaultBehavior();
                    }

                    // 如果文件已在另一个标签页中打开，切换到该标签页
                    const matchingLeaves: WorkspaceLeaf[] = [];
                    const pushLeaveIfMatching = (leaf: WorkspaceLeaf) => {
                        if (leaf.getViewState().state?.file == (file.path)) {
                            matchingLeaves.push(leaf);
                        }
                    }
                    parentThis.app.workspace.iterateRootLeaves(pushLeaveIfMatching);
                    
                    // 检查浮动窗口
                    // @ts-ignore - 浮动窗口 API
                    parentThis.app.workspace.getLayout()?.floating?.children?.forEach((win: any) => {
                        if (win?.type !== "window") return console.log("Opener: 发现奇怪的浮动对象（非窗口）", win)
                        win.children?.forEach((tabs: any) => {
                            if (tabs?.type !== "tabs") return console.log("Opener: 发现奇怪的浮动对象（非标签组）", tabs)
                            tabs.children?.forEach((leaf: any) => {
                                if (leaf?.type !== "leaf") return console.log("Opener: 发现奇怪的浮动对象（非叶子）", leaf)
                                const foundLeaf = parentThis.app.workspace.getLeafById(leaf.id);
                                if (foundLeaf) {
                                    pushLeaveIfMatching(foundLeaf);
                                }
                            })
                        })
                    })
                    
                    if (matchingLeaves.length) {
                        if (preparedEmptyLeave) {
                            // 如果已准备空标签页，使用它（当使用"在新标签页打开"命令时会发生）
                            new Notice(`文件现在在 ${matchingLeaves.length + 1} 个标签页中打开`);
                            return defaultBehavior()
                        } else {
                            // 切换到第一个匹配的标签页
                            const firstLeaf = matchingLeaves[0];
                            if (firstLeaf) {
                                parentThis.app.workspace.setActiveLeaf(firstLeaf, { focus: true });
                                return oldOpenFile.apply(firstLeaf, [file, openState]);
                            }
                        }
                    }

                    // 如果已准备空标签页，使用它
                    if (preparedEmptyLeave) {
                        return defaultBehavior()
                    }

                    // 如果文件类型无法在 Obsidian 中打开，不打开新空标签页
                    // @ts-ignore
                    if (!parentThis.app.viewRegistry?.getTypeByExtension(file.extension)) {
                        return defaultBehavior();
                    }

                    // 创建新标签页
                    const newLeaf = parentThis.app.workspace.getLeaf('tab');

                    // 将临时状态重定向到新标签页（用于 Templater）
                    const setEphemeralState = this.setEphemeralState;
                    this.setEphemeralState = (state) => {
                        console.log("Opener: 重定向临时状态到新标签页", state);
                        newLeaf.setEphemeralState.apply(newLeaf, [state]);
                    };
                    setTimeout(() => {
                        this.setEphemeralState = setEphemeralState;
                    }, 1500);

                    return oldOpenFile.apply(newLeaf, [
                        file,
                        openState,
                    ]);
                }
            },
        });
    }
}
