
参考文件

- [shadcn 文档](https://ui.shadcn.com/docs/components-json)
- [Tailwind CSS 文档](https://tailwindcss.com/docs/installation/tailwind-cli)

## 项目入门

### 初始化项目

vite 初始化 React + Typescript 项目，初始化 git 方便看每一步操作变化，添加 md 文件进行记录，设置 typescript 版本解决报错

```sh
pnpm create vite@latest
git init
touch note.md
```
### 配置别名
修改 tsconfig.json tsconfig.app.json ，配置别名

```css
/* src/index.css */
@import 'tailwindcss';
```
  
```json
// tsconfig.json
{
	//...
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@/*": ["./src/*"]
		}
	}
}

// tsconfig.app.json
{
	"compilerOptions": {
	// ...
		"baseUrl": ".",
		"paths": {
			"@/*": [
				"./src/*"
			]
		}
	}
}
```

修改 vite.config.ts 配置别名

```sh
pnpm add -D @types/node
```


```ts
// vite.config.ts
import path from 'path';
// ...
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src')
		}
	}
})
```

### 配置 tailwindcss 后初始化 shadcn

此时按照官网步骤直接进行 shadcn 初始化会报错，没有 tailwind CSS config
此时先去参考 tailwindcss 官网配置 tailwindcss 相关内容

```sh
# 中文官网的错误步骤，可能是因为版本不兼容
pnpm add -D tailwindcss postcss autoprefixer
# -p 代表生成 post.config.ts
# npx 可以直接初始化，pnpm dlx 需要用 @tailwindcss/cli，因为 v3 开始官方将工具移到了单独的包里，直接按照 tailwindcss 不再包含可执行文件
# npx 有兼容层，会自动解析到脚手架的包，pnpm 则严格校验
# 也可以先按照 @tailwindcss/cli 包，再本地执行 tailwindcss init -p 命令
npx tailwindcss init -p

pnpm dlx @tailwindcss/cli init -p
```

按照中文官网初始化 tailwindcss 也会报错，应该参考英文文档和版本
直接使用 tailwindcss 或者作为 postcss 插件使用

#### 安装依赖

```sh
pnpm add tailwindcss @tailwindcss/vite # 作为 vite 插件使用
pnpm add tailwindcss postcss @tailwindcss/postcss # 集成到 postcss 中使用
```

#### 修改配置
- 作为 vite 插件使用则配置 vite.config.ts 文件

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
	plugins: [
		tailwindcss(),
	],
})

```

- 作为 postcss 插件则创建 postcss.config.ts 文件并配置
	- vite 会自动检测项目中是否包含 postcss.config.ts 文件（冷启动时，并不会热更新）

```ts
// postcss.config.ts
export default {
	plugins: {
		'@tailwindcss/postcss': {}
	}
}
```

#### css中引入

两种方式都需要在 css 文件中引入

```css
@import 'tailwindcss';
```

### 初始化 shadcn

```sh
pnpm dlx shadcn@latest init
```

这一步可以选择主题
多主体怎么操作？

- 自动安装依赖
	- `class-variance-authority`
	- `clsx`
	- `lucide-react`
	- `tailwind-merge`
	- `tw-animate-css`
- 创建 `components.json` 文件并根据选择生成配置
- 生成 `src/lib/utils.ts` 文件
	- 生成 `cn` 方法，目测是用于合并类名
- 在引入 `tailwindcss` 的 `css` 文件中添加变量，一般是 `src/index.css`
	- 可以根据 `components.json` 文件配置修改变量所在文件
- 内容待解读

***直接使用 twind 这种库需要这么繁琐配置吗***
如果直接使用 twind 库，则只需要引入即可，不用配置

### 添加组件

```sh
pnpm dlx shadcn@latest add button
```

- 安装依赖
- 添加对应组件到 `src/components/ui` 下

### 主题切换 & 黑夜模式

```css
/* 声明 CSS 变量 */
:root {
	--background: #fff;
	--sm-size: 12px;
}

/* 深色模式下替换的变量 */
.dark {
	--background: #000;
	--sm-size: 12px;
}

/* 其他主题 */
.other-theme {
	--background: pink;
	--sm-size: 18px;
}

/* 声明为 tailwindcss 可以使用的工具类的色值、尺寸等 */
@theme inline {
	--color-bgground: var(--background);
	--radius-sm: var(--sm-size);
}

/* tw 中不同层级决定生成真实 css 文件时写入顺序，依次是 base - components - utilities */
@layer base {
	body {
		/* 将 工具类代表的样式插入到选择器中 */
		@apply bg-bgground;
	}
}
```

更换主题的核心逻辑

```ts
// 判断系统设置是亮色还是暗色
const systemTheme = window.mediaMatch('(prefers-color-scheme: dark)')
	.matches ? 'dark' : 'light';

// 改变 html 上的类名来使用不同的底色（优先级比 root 直接写的高)
document.documentElement.classList.add('light'); // .remove('oldclass');
```

还可以通过 `context` 来让全局更方便地切换主题和获取当前主题，并且让主题受控
