import { BlurPlugin } from '../main';

export class CursorTrailManager {
    private plugin: BlurPlugin;
    private cursorContainer: HTMLElement | null = null;
    private textSpans: HTMLElement[] = [];
    private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
    private isGSAPLoaded = false;
    private gsapCheckInterval: number | null = null;

    constructor(plugin: BlurPlugin) {
        this.plugin = plugin;
        this.checkGSAP();
    }

    private checkGSAP() {
        // 检查 GSAP 是否已加载
        if (typeof window !== 'undefined' && (window as any).gsap) {
            this.isGSAPLoaded = true;
            if (this.gsapCheckInterval) {
                clearInterval(this.gsapCheckInterval);
                this.gsapCheckInterval = null;
            }
        } else {
            // 如果没有 GSAP，定期检查
            if (!this.gsapCheckInterval) {
                this.gsapCheckInterval = window.setInterval(() => {
                    this.checkGSAP();
                }, 100);
            }
        }
    }

    public enable() {
        if (this.cursorContainer) {
            return; // 已经启用
        }

        // 创建光标容器
        this.cursorContainer = document.createElement('div');
        this.cursorContainer.className = 'cursor';
        document.body.appendChild(this.cursorContainer);

        // 创建文字拖尾
        this.createTextTrail();

        // 添加鼠标移动监听
        this.mouseMoveHandler = (e: MouseEvent) => {
            this.handleMouseMove(e);
        };
        document.addEventListener('mousemove', this.mouseMoveHandler);
    }

    public disable() {
        if (!this.cursorContainer) {
            return;
        }

        // 移除鼠标监听
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }

        // 移除容器
        if (this.cursorContainer && this.cursorContainer.parentNode) {
            this.cursorContainer.parentNode.removeChild(this.cursorContainer);
        }
        this.cursorContainer = null;
        this.textSpans = [];

        // 清理 GSAP 检查
        if (this.gsapCheckInterval) {
            clearInterval(this.gsapCheckInterval);
            this.gsapCheckInterval = null;
        }
    }

    public updateTrailText() {
        if (!this.cursorContainer) {
            return;
        }

        // 清除现有文字
        this.cursorContainer.innerHTML = '';
        this.textSpans = [];

        // 重新创建文字拖尾
        this.createTextTrail();
    }

    private createTextTrail() {
        if (!this.cursorContainer) {
            return;
        }

        const textContent = this.plugin.settings.cursorTrailText || 'animate text trail effect';
        const characterSpacing = this.plugin.settings.characterSpacing || 0.6;
        
        for (let i = 0; i < textContent.length; i++) {
            const span = document.createElement('span');
            span.classList.add('text');
            span.style.setProperty('--i', String(i + 1));
            span.style.left = `${i * characterSpacing}em`;
            span.textContent = textContent[i];
            span.style.filter = `hue-rotate(${i * 10}deg)`;
            
            this.cursorContainer.appendChild(span);
            this.textSpans.push(span);
        }
    }

    private handleMouseMove(e: MouseEvent) {
        if (this.isGSAPLoaded && (window as any).gsap) {
            // 使用 GSAP 实现与 ref 相同的效果
            const gsap = (window as any).gsap;
            const trailSpeed = this.plugin.settings.trailSpeed || 0.05;
            
            gsap.to(".text", {
                x: e.clientX,
                y: e.clientY,
                stagger: trailSpeed
            });
        } else {
            // 如果 GSAP 未加载，使用简单的 CSS 变换作为后备
            this.fallbackAnimation(e.clientX, e.clientY);
        }
    }

    private fallbackAnimation(targetX: number, targetY: number) {
        // 简单的后备动画，不使用 GSAP
        for (let i = 0; i < this.textSpans.length; i++) {
            const span = this.textSpans[i];
            if (span) {
                const delay = i * (this.plugin.settings.trailSpeed || 0.05) * 1000; // 转换为毫秒
                
                setTimeout(() => {
                    span.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
                }, delay);
            }
        }
    }
}
