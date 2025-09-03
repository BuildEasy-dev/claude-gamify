# Claude Gamify 技术架构设计

## 项目概述

Claude Gamify 是一个为 Claude Code 提供游戏化音效系统的 NPX CLI 工具。采用**分离式架构设计**，通过富交互的 NPX 包管理轻量级的本地播放器，实现零依赖的音频播放与 Claude Code 深度集成。

### 设计目标

- **分离关注点**：管理界面与播放功能独立部署
- **零依赖播放**：本地播放器无外部依赖，保证稳定性
- **模块化架构**：清晰的分层设计，易于维护和扩展
- **用户体验优先**：友好的交互界面与自动升级机制

## 核心架构

### 1. 分离式系统架构

```
┌─────────────────────────┐     ┌──────────────────────────┐
│    NPX Package          │────▶│   Local Installation     │
│  (claude-gamify)        │     │  (~/.claude-gamify/)     │
├─────────────────────────┤     ├──────────────────────────┤
│ • Rich UI & Management  │     │ • Zero-dependency Player │
│ • Dependencies:         │     │ • Template Files         │
│   - inquirer, chalk     │     │ • Configuration Store    │
│   - commander, ora      │     │ • Theme Audio Files      │
│   - boxen, figlet       │     │                          │
└─────────────────────────┘     └──────────────────────────┘
             │                                │
             └────────── Integration ─────────┘
                         │
              ┌──────────▼───────────┐
              │   Claude Code        │
              │  (~/.claude/)        │
              ├──────────────────────┤
              │ • settings.json      │
              │ • output-styles/     │
              └──────────────────────┘
```

### 2. 分层架构设计

#### 2.1 CLI 入口层 (`bin/cli.js`)
- **职责**：命令行程序入口点
- **功能**：
  - 使用 `commander` 定义命令：`init`、`status`、`check-updates`、`uninstall`
  - 优雅处理 SIGINT/SIGTERM 信号
  - 默认启动交互模式

#### 2.2 协调器层 (`lib/orchestrator.js`)
- **职责**：系统的核心总线，实现依赖注入模式
- **组件管理**：
  ```javascript
  class ClaudeSound {
    constructor() {
      this.configManager = new ConfigManager(Paths.configFile);
      this.themeManager = new ThemeManager(Paths.themesDir, this.configManager);
      this.hookManager = new HookManager(Paths.claudeConfigPath, Paths.indexPath);
      this.styleManager = new StyleManager(Paths.claudeConfigPath, Paths.claudeOutputStylesDir);
      this.soundPlayer = new SoundPlayer(this.configManager, this.themeManager, Paths.playerPath);
    }
  }
  ```
- **高阶用例**：初始化、主题管理、卸载、系统信息展示等

#### 2.3 核心业务层 (`lib/core/`)

##### ConfigManager (`config.js`)
- **配置管理**：加载、保存、校验、迁移配置文件
- **Hook 状态管理**：批量操作各 Hook 开关状态
- **配置结构**：
  ```json
  {
    "theme": "zelda",
    "sound_enabled": true,
    "sound_volume": 0.5,
    "sound_hooks": {
      "session_start": true,
      "user_prompt_submit": true,
      "pre_tool_use": true,
      "post_tool_use": true,
      "notification": true,
      "stop": true,
      "subagent_stop": true
    },
    "version": "1.1.0"
  }
  ```

##### ThemeManager (`themes.js`)
- **主题枚举与验证**：检测可用主题
- **主题安装与移除**：管理主题生命周期
- **音频资源定位**：主题内音频文件查找

##### HookManager (`hooks.js`)
- **Claude Code 集成**：修改 `~/.claude/settings.json`
- **Hook 配置格式**：
  ```json
  {
    "hooks": {
      "SessionStart": [{
        "matcher": ".*",
        "hooks": [{
          "type": "command",
          "command": "node \"/path/to/.claude-gamify/index.js\" SessionStart"
        }]
      }]
    }
  }
  ```

##### StyleManager (`styles.js`)
- **输出样式管理**：从模板复制样式文件到 `~/.claude/output-styles/`
- **样式同步**：设置/重置 Claude Code 的 `outputStyle` 字段
- **主题样式关联**：将主题与对应的输出样式绑定

##### SoundPlayer (`player.js`)
- **播放决策引擎**：基于配置判断是否播放
- **测试播放功能**：异步、非阻塞的音频测试
- **播放器委托**：调用本地 `play_sound.js`

##### UpgradeManager (`upgrade.js`)
- **静默升级系统**：启动时自动增量升级
- **升级策略**：
  - 配置合并：模板为基础，保留用户配置
  - 文件同步：按需复制变更的模板文件
  - 样式重置：确保当前主题样式有效

#### 2.4 CLI 层 (`lib/cli/`)

##### InteractiveMode (`session.js`)
- **会话生命周期管理**：协调整个交互流程
- **并行版本检查**：启动时异步检查更新
- **初始化流程**：集成设置向导

##### CommandHandlers (`commands.js`)
- **命令实现**：`init`、`status`、`check-updates`、`uninstall`
- **错误处理**：统一的异常处理机制

##### MenuController (`menus.js`)
- **菜单导航**：主菜单与子菜单系统
- **交互路由**：根据用户选择调用相应功能

#### 2.5 UI 表现层 (`lib/ui/`)

##### 组件系统 (`components/`)
- **模块化组件**：可复用的 UI 展示组件
- **组件列表**：
  - `welcome-screen.js` - 欢迎界面
  - `status-bar.js` - 状态栏显示
  - `sound-config-display.js` - 音频配置界面
  - `theme-management-display.js` - 主题管理界面
  - `version-check-display.js` - 版本检查提示

##### 常量系统 (`constants/`)
- **样式常量** (`styles.js`)：配色方案、布局配置
- **消息常量** (`messages.js`)：统一的用户消息
- **配置常量** (`config.js`)：默认配置值
- **音频常量** (`sound.js`)：Hook 映射关系

##### 交互系统 (`prompts/`)
- **ESC 键支持**：统一的退出机制
- **键盘导航**：音频配置与测试的键盘操作

### 3. 部署与运行时系统

#### 3.1 模板部署 (`template/`)
```
template/
├── play_sound.js          # 零依赖播放器（Node.js原生）
├── index.js               # Hook入口点，路由到播放器
├── config.json            # 默认配置模板
├── README.md              # 本地安装说明
└── themes/                # 主题音频文件
    ├── zelda/
    │   ├── *.wav           # Hook事件音频文件
    │   ├── output-style.md # 可选的输出样式
    │   └── README.md       # 主题说明
    └── system/
        └── README.md       # 系统主题（静音）
```

#### 3.2 本地安装结构 (`~/.claude-gamify/`)
- **部署流程**：初始化时从 `template/` 递归复制
- **权限设置**：`play_sound.js` 设置为可执行（755）
- **升级同步**：启动时检测并同步模板变更

#### 3.3 音频播放链路
```
Claude Code Hook 触发
        ↓
~/.claude-gamify/index.js (路由)
        ↓
~/.claude-gamify/play_sound.js (播放器)
        ↓
平台音频播放器
├── macOS: afplay
└── Linux: paplay/aplay/mpg123/play
```

## 关键设计模式

### 1. 依赖注入模式
- **orchestrator.js** 作为 IoC 容器
- 各 Manager 通过构造函数注入依赖
- 便于单元测试与模块替换

### 2. 策略模式
- **平台检测**：不同平台使用不同音频播放器
- **主题切换**：运行时切换音频与样式主题
- **Hook 映射**：Claude事件名与配置键的动态映射

### 3. 模板方法模式
- **升级流程**：统一的升级算法，具体步骤可定制
- **初始化流程**：标准化的设置流程
- **卸载流程**：分步骤的清理过程

### 4. 外观模式
- **ClaudeSound 类**：为复杂的子系统提供统一接口
- **隐藏复杂性**：用户只需调用高层 API

## 配置与契约

### 1. 路径约定
```javascript
class Paths {
  static claudeGamifyDir = '~/.claude-gamify'
  static configFile = '~/.claude-gamify/config.json'
  static themesDir = '~/.claude-gamify/themes'
  static claudeConfigPath = '~/.claude/settings.json'
  static claudeOutputStylesDir = '~/.claude/output-styles'
}
```

### 2. Hook 事件映射
```javascript
const HOOK_EVENT_MAPPING = {
  'SessionStart': 'session_start',
  'UserPromptSubmit': 'user_prompt_submit',
  'PreToolUse': 'pre_tool_use',
  'PostToolUse': 'post_tool_use',
  'Notification': 'notification',
  'Stop': 'stop',
  'SubagentStop': 'subagent_stop'
};
```

### 3. Claude Code 集成契约
- **Hook 格式**：命令数组结构，兼容 Claude Code 规范
- **输出样式**：可选设置，支持主题绑定的样式文件
- **设置隔离**：仅修改相关配置项，保持其他设置不变

## 错误处理与容错

### 1. 播放容错
- **静默失败**：线上播放失败不影响 Claude Code 工作流
- **子进程隔离**：使用 `spawn` + `unref()` 避免阻塞主流程
- **平台兼容**：自动检测并选择可用的音频播放器

### 2. 文件操作容错
- **回退机制**：`FileUtils.readJsonFile` 支持默认值回退
- **权限检查**：敏感操作前确保目录存在
- **原子性**：升级失败不影响现有配置

### 3. 用户交互容错
- **ESC 键支持**：所有菜单支持ESC返回
- **Ctrl+C 处理**：优雅退出，清屏并显示告别消息
- **导航一致性**：统一的菜单导航范式

## 扩展性设计

### 1. 新增 Hook 支持
1. 更新 `ConfigDefaults.hookEventMapping` 添加映射关系
2. 在 UI `HOOK_NAMES` 中添加显示名称
3. 为新主题添加对应音频文件
4. 更新相关测试用例

### 2. 新增主题
1. 在 `template/themes/<theme-name>/` 创建主题目录
2. 放置各 Hook 对应的 `.wav` 音频文件
3. 添加 `README.md` 描述文件（首行作为主题描述）
4. 可选添加 `output-style.md` 输出样式文件
5. 初始化/升级时自动同步到用户环境

### 3. 新增 UI 功能
1. 遵循组件化设计，在 `lib/ui/components/` 添加新组件
2. 在 `lib/ui/constants/` 更新相关常量
3. 保持 ESC/Ctrl+C 导航范式一致性
4. 次级菜单遵循 "Back-only" 原则

## 测试与质量保证

### 1. 测试架构
- **轻量测试**：使用原生 Node.js 脚本，无外部测试框架
- **测试分类**：
  - `test-basic.js` - 基础功能验证
  - `test-init.js` - 初始化流程测试  
  - `test-uninstall.js` - 卸载功能测试
  - `test-integration-sounds.js` - 音频集成测试

### 2. 文件系统测试策略
- **备份恢复**：涉及 `~/.claude-gamify` 和 `~/.claude` 的测试需要备份/恢复
- **沙箱环境**：模拟真实环境进行集成测试
- **权限验证**：确保文件权限设置正确

### 3. 质量检查
```bash
# 运行所有测试
pnpm test

# 单独测试特定功能  
node test/test-init.js
node test/test-uninstall.js

# 检查打包文件
npm pack --dry-run
```

## 性能优化

### 1. 启动性能
- **并行处理**：版本检查与初始化并行执行
- **懒加载**：按需加载重型依赖（如 figlet）
- **缓存策略**：配置文件内存缓存

### 2. 音频播放性能
- **异步播放**：所有音频播放均为非阻塞
- **进程隔离**：音频进程独立，失败不影响主程序
- **资源优化**：WAV 格式音频，平衡质量与大小

### 3. UI 响应性
- **加载反馈**：使用 ora spinner 提供操作反馈
- **交互优化**：ESC 键快速退出，避免用户等待

## 兼容性与限制

### 1. 平台支持
- **支持平台**：macOS、Linux
- **音频播放器**：自动检测平台可用播放器
- **路径兼容**：使用 Node.js path 模块确保路径正确

### 2. Node.js 版本
- **最低要求**：Node.js >= 16.0.0
- **ESM 模块**：使用现代 ES 模块语法
- **API 兼容**：使用稳定的 Node.js API

### 3. 已知限制
- **Windows 支持**：暂未实现（需要适配音频播放器和路径约定）
- **音频格式**：目前仅支持 WAV 格式
- **主题文件大小**：音频文件会增加安装包大小

## 发布与部署

### 1. 开发工作流
```bash
# 本地开发
node bin/cli.js                    # 直接运行
pnpm link --global                 # 全局链接测试
claude-gamify                      # 测试全局命令

# 发布前检查
pnpm test                          # 运行所有测试
npm pack --dry-run                 # 检查打包内容
pnpm run commitlint               # 验证提交信息
```

### 2. 版本管理
- **语义化版本**：遵循 semver 规范
- **自动升级**：基于 update-notifier 的升级检查
- **向后兼容**：配置文件格式保持向后兼容

### 3. 分发策略
- **NPM 发布**：主要通过 npm registry 分发
- **NPX 使用**：推荐使用 `npx claude-gamify` 获取最新版本
- **全局安装**：支持 `npm install -g claude-gamify`

## 安全考虑

### 1. 文件权限
- **目录权限**：仅在用户 home 目录下操作
- **执行权限**：仅对播放器脚本设置执行权限
- **路径验证**：所有路径操作经过验证，防止目录遍历

### 2. 命令执行
- **白名单机制**：音频播放器命令采用白名单机制
- **参数验证**：所有外部命令参数经过验证
- **进程隔离**：子进程执行，错误不影响主程序

### 3. 配置安全
- **配置验证**：所有配置项经过类型和范围验证
- **默认安全**：默认配置采用安全的选项
- **用户控制**：用户完全控制所有配置选项

---

## 总结

Claude Gamify 采用现代化的分离式架构设计，通过模块化、分层的方式实现了一个功能丰富、易于维护的 Claude Code 游戏化系统。其核心优势包括：

1. **清晰的关注点分离**：管理界面与播放功能独立
2. **优秀的扩展性**：模块化设计便于功能扩展
3. **用户体验优先**：友好的交互界面与自动升级
4. **高度的可维护性**：依赖注入与分层架构
5. **良好的容错机制**：多层次的错误处理与恢复

该架构为未来的功能扩展（如新主题、新Hook、新平台支持）提供了坚实的基础，同时保持了代码的简洁性和可读性。