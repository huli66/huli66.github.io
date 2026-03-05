# CLAUDE.md（中文版）

  

本文件为 Claude Code（claude.ai/code）在此代码仓库中工作时提供指导。

  

## 项目概述

  

React-Grid-Layout 是一个支持响应式断点的 React 可拖拽、可调整大小的网格布局系统。它是纯 React 实现（无 jQuery），已在 BitMEX、Grafana、Metabase、HubSpot 等众多生产环境中使用。

  

**Version 2** 是完整的 TypeScript 重写版本，采用现代化的 Hooks API，同时通过专用的兼容层保持向后兼容性。

  

## 包管理器

  

在此项目中，**始终使用 `yarn`** 而非 `npm` 执行所有命令。

  

## 开发命令

  

### 测试

  

```bash

# 运行所有测试并生成覆盖率报告

make test

yarn test

  

# 开发模式下的监听模式

make test-watch

  

# 运行指定测试文件

NODE_ENV=test npx jest --testPathPatterns="compactors"

```

  

### 构建

  

```bash

# 构建库（ESM、CJS 及 TypeScript 声明文件）

make build

yarn build

  

# 清理构建产物

make clean

```

  

### 开发服务器

  

```bash

# 启动带热重载的开发服务器（端口 4002）

make dev

yarn dev

```

  

### 代码检查与格式化

  

```bash

# 运行 ESLint

yarn lint

  

# 使用 Prettier 格式化代码（提交前必须运行！）

yarn fmt

```

  

**重要**：提交前务必运行 `yarn fmt`，否则 CI 将会失败。

  

### 发布版本

  

```bash

# 补丁版本（修复 Bug）- 升级版本号、构建并发布到 npm

make release-patch

  

# 次版本（新功能，向后兼容）

make release-minor

  

# 主版本（破坏性变更）

make release-major

```

  

**重要**：始终使用 `make release-*` 命令，切勿直接使用 `npm version`。Makefile 会正确处理构建、版本升级和发布流程。

  

## 架构（v2）

  

### 包结构

  

```

src/

├── core/ # 纯 TypeScript，无 React 依赖

│ ├── types.ts # 所有类型定义

│ ├── layout.ts # 布局操作（移动、克隆、校验）

│ ├── collision.ts # 碰撞检测

│ ├── sort.ts # 排序算法

│ ├── compactors.ts # 压缩算法（垂直、水平）

│ ├── compact-compat.ts # 旧版 compact() 函数包装器

│ ├── constraints.ts # 布局约束（位置、尺寸、宽高比）

│ ├── calculate.ts # 网格计算（网格单位 <-> 像素）

│ ├── position.ts # CSS 定位辅助工具

│ ├── responsive.ts # 断点工具函数

│ └── index.ts # Core 导出

│

├── react/ # React 绑定

│ ├── hooks/

│ │ ├── useContainerWidth.ts # 容器宽度测量

│ │ ├── useGridLayout.ts # 网格状态管理

│ │ └── useResponsiveLayout.ts # 响应式断点处理

│ └── components/

│ ├── GridItem.tsx # 单个网格项

│ ├── GridLayout.tsx # 主网格组件

│ ├── ResponsiveGridLayout.tsx

│ └── WidthProvider.tsx # 宽度测量 HOC（内部使用）

│

├── legacy/ # v1 API 兼容层

│ ├── ReactGridLayout.tsx # 旧版组件包装器

│ ├── ResponsiveReactGridLayout.tsx

│ ├── WidthProvider.tsx # 向后兼容的重导出

│ └── index.ts

│

└── index.ts # 主入口

```

  

### 入口点

  

```typescript

// 新 v2 API（推荐）

import ReactGridLayout, {

Responsive,

useContainerWidth,

verticalCompactor,

horizontalCompactor

} from "react-grid-layout";

  

// 使用可组合接口

<ReactGridLayout

width={width}

layout={layout}

gridConfig={{ cols: 12, rowHeight: 30 }}

dragConfig={{ enabled: true, handle: '.handle' }}

resizeConfig={{ enabled: true, handles: ['se'] }}

compactor={verticalCompactor}

/>

  

// 核心工具函数（框架无关）

import {

moveElement,

collides,

transformStrategy,

absoluteStrategy,

createScaledStrategy,

getCompactor,

verticalCompactor,

horizontalCompactor

} from "react-grid-layout/core";

// 注意：compact() 未导出，请使用 compactor.compact() 代替。

  

// 旧版 v1 API（100% 向后兼容，扁平 props）

import ReactGridLayout, {

WidthProvider,

Responsive

} from "react-grid-layout/legacy";

```

  

### 核心组件

  

**GridLayout**（`src/react/components/GridLayout.tsx`）

  

- 主网格布局组件（函数式，基于 Hooks）

- 管理布局状态、拖放和调整大小操作

- 处理压缩（垂直、水平或无压缩）

- 所有网格项必须有唯一的 `key` prop，与布局中的 `i` 对应

  

**ResponsiveGridLayout**（`src/react/components/ResponsiveGridLayout.tsx`）

  

- 为 GridLayout 添加响应式断点支持

- 管理以断点为键的多个布局

- 自动生成缺失断点的布局

  

**GridItem**（`src/react/components/GridItem.tsx`）

  

- 单个网格项的包装器

- 集成 react-draggable 和 react-resizable

- 通过 CSS transform 处理定位（默认）

  

### 核心算法

  

**压缩**（`src/core/compactors.ts`）

  

- `verticalCompactor`：元素向上浮动（默认）

- `horizontalCompactor`：元素向左浮动

- `noCompactor`：自由定位

- 所有压缩器均实现 `Compactor` 接口

  

**碰撞检测**（`src/core/collision.ts`）

  

- `collides()`：检查两个元素是否重叠

- `getFirstCollision()`：找到第一个碰撞

- `getAllCollisions()`：找到所有碰撞

  

**布局工具函数**（`src/core/layout.ts`）

  

- `moveElement()`：带碰撞处理的元素移动

- `cloneLayout()`：深拷贝布局数组

- `validateLayout()`：校验布局结构

  

### 关键概念

  

**布局结构**

  

```typescript

interface LayoutItem {

i: string; // 唯一标识符

x: number; // X 坐标（网格单位）

y: number; // Y 坐标（网格单位）

w: number; // 宽度（网格单位）

h: number; // 高度（网格单位）

minW?: number; // 最小宽度

maxW?: number; // 最大宽度

minH?: number; // 最小高度

maxH?: number; // 最大高度

static?: boolean; // 不可移动/调整大小

isDraggable?: boolean;

isResizable?: boolean;

}

  

type Layout = LayoutItem[];

```

  

**宽度处理**

  

```typescript

// v2：使用 Hook

const { width, containerRef, mounted } = useContainerWidth();

return (

<div ref={containerRef}>

{mounted && <GridLayout width={width} ... />}

</div>

);

  

// 旧版：使用 WidthProvider HOC

import { WidthProvider } from 'react-grid-layout/legacy';

const GridLayoutWithWidth = WidthProvider(ReactGridLayout);

```

  

## 技术栈

  

- **语言**：TypeScript

- **构建工具**：tsup（ESM + CJS + DTS）

- **测试**：Jest 配合 @testing-library/react

- **代码检查**：ESLint 9（扁平配置）

- **代码格式化**：Prettier

  

## 示例

  

交互式示例位于 `test/examples/` 目录。添加重要功能时，务必创建对应的示例。

  

### 示例结构

  

```

test/examples/

├── 00-showcase.jsx # 主展示演示

├── 01-basic.jsx # 基础用法

├── ...

└── 24-custom-constraints.jsx

```

  

### 添加新示例

  

1. **创建示例文件**：`test/examples/NN-feature-name.jsx`

- 在文件末尾接入 test-hook.jsx

- 使用带 `useContainerWidth` hook 的 v2 API（参见示例 19+）

- 默认导出一个函数式组件

  

2. **在 vars.js 中注册**：在 `examples/util/vars.js` 中添加条目：

  

```js

{

title: "Feature Name",

source: "feature-name", // 与不含数字前缀的文件名对应

paragraphs: ["示例描述..."]

}

```

  

3. **更新 README.md**：在示例列表中添加链接

  

4. **生成 HTML**：运行 `env CONTENT_BASE="/react-grid-layout/examples/" node ./examples/util/generate.js`

  

### 运行示例

  

```bash

yarn dev # 启动开发服务器，地址为 http://localhost:4002

```

  

## 测试规范

  

- 测试文件位于 `test/spec/`

- 使用 `@testing-library/react` 进行组件测试

- 运行单个测试：`NODE_ENV=test npx jest --testPathPatterns="pattern"`（注意：必须使用复数形式 `--testPathPatterns`，而非 `--testPathPattern`）

  

## 重要实现说明

  

### 性能

  

- 对传入 GridLayout 的 `children` 数组进行记忆化（memoize）

- GridLayout 通过引用比较子元素以进行优化

- 若不进行记忆化，父组件每次重新渲染都会导致整个网格重新渲染

  

### 自定义组件作为网格项

  

用作网格子项的自定义 React 组件必须：

  

1. 将 ref 转发到底层 DOM 节点

2. 转发以下 props：`style`、`className`、`onMouseDown`、`onMouseUp`、`onTouchEnd`

3. 包含 `{children}` 以渲染调整大小的把手

  

```typescript

const CustomItem = forwardRef<HTMLDivElement, Props>(

({ style, className, onMouseDown, onMouseUp, onTouchEnd, children, ...props }, ref) => (

<div ref={ref} style={style} className={className}

onMouseDown={onMouseDown} onMouseUp={onMouseUp} onTouchEnd={onTouchEnd}>

{children}

</div>

)

);

```

  

### 常见陷阱

  

- **忘记唯一键**：每个网格项需要与布局中 `i` 对应的唯一 `key`

- **布局与子项数量不匹配**：布局项的数量必须与子项数量一致

- **缺少宽度**：GridLayout 需要 `width` prop（使用 `useContainerWidth` hook）

  

## 构建产物

  

```

dist/

├── index.js # CJS 主入口

├── index.mjs # ESM 主入口

├── index.d.ts # TypeScript 声明文件

├── core.js/mjs/d.ts # 纯核心（无 React）

├── react.js/mjs/d.ts # React 组件

└── legacy.js/mjs/d.ts # v1 API 兼容层

```

  

## Bug 报告

  

用户应在 CodeSandbox 中复现 Bug：https://codesandbox.io/p/sandbox/5ywf7c

  

## 自定义技能

  

### `/fix-issue <number>`

  

自动化 Bug 修复工作流。用法：

  

```

/fix-issue 2203

```

  

此技能将：

  

1. 获取并分析 GitHub Issue

2. 调查代码库以找到根本原因

3. 编写能复现 Bug 的失败测试

4. 实施修复

5. 验证所有测试通过

6. 创建 PR 并等待 CI

7. CI 通过后合并

  

该技能强制执行测试驱动开发：测试必须在修复前处于失败状态。

  

## RFC 与设计文档

  

**重要**：完整设计文档请参见 `rfcs/0001-v2-typescript-rewrite.md`。该 RFC 定义了：

  

- 破坏性变更（拖拽阈值、不可变回调、data-grid 废弃）

- 可组合配置接口（GridConfig、DragConfig、ResizeConfig、DropConfig）

- PositionStrategy 接口（transform 与 absolute 定位）

- Compactor 接口（可插拔压缩算法）

- 快速压缩算法（rising tide - O(n log n)）

- v1 到 v2 的迁移指南

  

v2 实现遵循 RFC，可组合接口现已全部实现。