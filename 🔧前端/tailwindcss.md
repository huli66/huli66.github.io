
[添加自定义工具类](https://tailwindcss.com/docs/adding-custom-styles)
[内置工具类查询文档]()
[变体/伪类快速参考](https://tailwindcss.com/docs/hover-focus-and-other-states#quick-reference)

优势

可以配合点击元素定位代码的工具，改变局部样式时，只需要简单定位直接修改即可，不用担心影响范围大小
原子规则复用方便(比起内联样式等)，整段代码复用也方便

缺点
写多套样式时不方便整合一直，主题颜色可以通过变量来控制，但是尺寸和布局就不太方便，涉及响应式的判断也要分布在各个工具类上，hover、active 等状态同样

## 安装使用


## 核心概念

### 工具类

方括号使用任意值
如果要使用自定义 CSS 变量，也可以使用 `color-(--my-color)`，这是 `color-[var(--my-color)]` 的缩写
方括号包裹的任意属性，则类似内联样式
方括号还能直接声明变量，还能在不同条件在更改变量值，声明的元素本身或者子元素可用
方括号内空格无效，但是可以使用下划线，包括文本属性比如 content
jsx 中 content 需要使用 String.raw()，其他样式空格不需要
```jsx
<button
className='
	bg-[red]
	max-h-[calc(100vh - 12px)]
	grid
	grid-cols-[24rem_2.5rem_minmax(0,1fr)]
	color-[var(--my-brand-color)]
	color-(--my-brand-color)
	[mask-type:luminance]
	hover:[mask-type:alpha]
	[--scroll-offset:56px]
	lg:[--scroll-offset:44px]
'>
	click
</button>
```

如果要编写大量的通用的基础 `css` 作为默认样式，可以使用 `@layer` 指令
然后在 jsx 中直接使用工具类去覆盖部分样式做自定义
```css
@layer base {
	h1 {
		font-size: var(--text-2xl);
		font-weight: bold;
	}
}
@layer components {
	.card {
		background: var(--color-white);
		border-radius: var(--radius-lg);
		@variant dark {
			@variant hover {
				background: black;
			}
		}
	}
}
```

用 `@variant` 使用变体
`@utility` 自定义工具类，效果其实和全局写类名差不多，但是插件会有提示
`--value()` 解析值，里面写的 `--color-*` 是 tw 内置的类型之一，代表颜色，插件提示也会匹配对应类型的可选值，也可以使用 `[color]` 等来使用任意值
两个都写则可以同时支持工具类的值和方括号包裹的任意值，否则只能支持各自代表的值
提供可选项参数则是提供
```css
@utility hover-black {
	background: white;
	color: black;
	@variant dark {
		background: yellow;
		color: red;
	}
	@variant hover {
		background: black;
		color: white;
	}
}

/* 可传参的工具类 */
@utility hover-color-* {
	@variant hover {
		color: --value(--color-*);
		color: --value([color]);
		color: --value('hhh', 'ggg', 'ddd')
	}
}

/* 参数提供可选项 */
@utility textcolor-* {
	color: --value('background', 'card');
}
```

`group-hover` `group-active` 等，支持复杂场景，比如父元素悬浮时子元素变色
tw 支持 each 循环，但是在 jsx 中建议优先使用 js 循环，增加可读性

[变体/伪类快速参考](https://tailwindcss.com/docs/hover-focus-and-other-states#quick-reference)

### 响应式设计

移动端设备优先
所有无前缀的工具类在所有尺寸屏幕都生效，待前缀的则仅在屏幕尺寸大于等于指定断点时生效
所以 `sm` 不是只小屏幕，而是大于这个尺寸
`sm` `md` `lg` `xl` `2xl`

`max-sm` 则代表小于指定尺寸

`md:max-lg:flex` 代表大于等于 `md` 小于 `lg` 尺寸的样式

也可以用自定义的断点覆盖默认断点范围，确保所有断点使用相同的单位
```css
@theme {
	--breakpoint-xs: 30rem;
	--breakpoint-md: initial; /* 删除这个默认断点 */

	--container-8xl: 180rem; /* 添加一个自定义的新断点 */
}
```

使用一次性断点 `max-[600px]:bg-sky-300` `min-[320px]: text-white`, 小于等于指定尺寸和大于指定尺寸

默认情况在，媒体查询都是作用在 `body` 元素上，也可以指定某个元素作为容器
可以嵌套容器，并给容器命名，并给断点带上容器名

```html
<div class='@container'>
	<div class='text-black @md:text-white @min-[600px]:bg-[yellow]'>hhh</div>
	<div class='@container/main'>
		<h2 class='text-amber-300 @min-[300px]/main:text-blue-400 @md:text-amber-700'>worlo</h2>
	</div>
</div>
```

`cqw` 容器宽度百分比单位
