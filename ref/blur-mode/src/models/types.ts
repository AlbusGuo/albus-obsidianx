import { App, Plugin } from 'obsidian';

export interface BlurSettings {
    blurAmount: string;
    isSelectingMode: boolean;
    isBlurActive: boolean;
    presets: string[];
    keywords: string[];
    isDebugMode: boolean;
    cursorTrailText: string;
    enableCursorTrail: boolean;
    trailSpeed: number;
    characterSpacing: number;
}

export const DEFAULT_SETTINGS: BlurSettings = {
    blurAmount: '0.5em',
    isSelectingMode: false,
    isBlurActive: false,
    presets: [],
    keywords: [],
    isDebugMode: false,
    cursorTrailText: 'trail',
    enableCursorTrail: true,
    trailSpeed: 0.05,
    characterSpacing: 0.6,
};

export interface BlurPluginInterface extends Plugin {
    settings: BlurSettings;
    saveSettings(): Promise<void>;
    blurManager: any;  // 或者导入具体的类型
    blurPanel: any;    // 或者导入具体的类型
    isEditorElement(element: HTMLElement): boolean;
    isRibbonElement(element: HTMLElement): boolean;
    isManagePanelElement(element: HTMLElement): boolean;
}