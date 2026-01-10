# ObsidianX

一个功能强大的 Obsidian 插件管理器，提供增强的插件管理功能。

## 功能特性

- 📦 **插件列表管理** - 查看和管理所有已安装的插件
- 🔍 **强大的搜索** - 按名称、作者或描述搜索插件
- 🏷️ **自定义分组** - 创建分组来组织你的插件
- 📝 **描述功能** - 为每个插件添加个性化描述
- ⚡ **快速操作** - 一键启用/禁用、打开设置、卸载插件
- 📊 **统计信息** - 实时查看插件数量和状态

## 安装

### 手动安装
1. 下载最新版本的 `main.js`、`manifest.json` 和 `styles.css`
2. 在你的 vault 中创建文件夹 `.obsidian/plugins/albus-obsidianx/`
3. 将下载的文件放入该文件夹
4. 重新加载 Obsidian
5. 在设置中启用插件

## 使用方法

### 打开插件管理器
- 点击左侧功能区的 📦 图标
- 或使用命令面板搜索"打开插件管理器"

### 主要功能

#### 搜索和筛选
- 在搜索框中输入关键词即可过滤插件
- 使用状态下拉菜单筛选已启用/未启用的插件
- 使用分组下拉菜单按分组查看插件

#### 管理分组
1. 进入 Obsidian 设置 → ObsidianX
2. 在"分组管理"部分添加或编辑分组
3. 在插件管理器中为插件分配分组

#### 添加描述
- 点击插件下方的描述区域
- 输入描述内容
- 按 Enter 保存

## 开发

详细的开发文档请查看 [PROJECT_README.md](PROJECT_README.md)

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
src/
├── main.ts                    # 插件入口
├── types.ts                   # 类型定义
├── data-storage.ts            # 数据存储
├── plugin-manager-modal.ts    # 主界面
├── group-settings.ts          # 设置页面
└── utils.ts                   # 工具函数
```

## 许可证

0-BSD License
