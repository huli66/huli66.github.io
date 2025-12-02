
#Rust
#Web
#WebAssembly

## 编译 Rust 为 WebAssembly
安装 Rust，`rustup` 会自动安装 Rust 编译器 `rustc`，Rust 包管理工具 `cargo`，Rust 标准库 `rust-std`，部分文档 `rust-docs`

创建项目

```sh
# 把代码编译成 WebAssembly 并生成 npm 包的工具
cargo install wasm-pack

# 查看安装列表
cargo --list # 自动安装？
cargo install --list # 手动安装的包？

# 创建一个 Rust 依赖库项目
cargo new --lib hello-wasm
```

```rust
// 声明使用外部库 wasm_bindgen，用作 Rust 和 Js 之间的桥梁
extern crate wasm_bindgen;

use wasm_bindgen:prelude:*;
```

## 在项目中使用

### 手动引入

参考 [web.dev](https://web.dev/articles/loading-wasm?hl=zh-cn)

```js
// fetch 加载 --- 设置缓冲区 --- 转换为模块 --- 执行
const response = await fetch('test_wasm.wasm');
const buffer = await response.arrayBuffer();
// 转换成模块，同步执行，阻塞主线程
const module = new WebAssembly.Module(buffer);
const instance = new WebAssembly.Instance(module); // 生成示例
const result = instance.exports.fibonacci(42);
```

```js
// 让转换模块和生成示例过程都变成异步的
(async () => {
	const response = await fetch('fibonacci.wasm');
	// 响应字节作为数组缓冲区传递，无需 MIME 类型检查
	const buffer = await response.arrayBuffer();
	const module = await WebAssembly.compile(buffer);
	const instance = await WebAssembly.instantiate(module);
	const result = instance.exports.fibonacci(42);
	console.log('result');
})();
```

```js
const response = await fetch('fibonacci.wasm');
// 流式编译模块，需要设置Content-Type: application/wasm
const module= awaitWebAssembly.compileStreaming(response);

// 或者直接传入 Promise
const module = await WebAssembly.compileStreaming(fetch('fibonacci.wasm'));
```

### vite 项目

使用 `vite-plugin-wasm` 插件，或者直接引入 `.wasm?url` 文件

```js
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await'; // 非必要，用于兼容老版本浏览器

export default ({
	plugins: [
		wasm(),
		topLevelAwait()
	],
	// 如果是在 worker 中使用 wasm 
	worker: {
		plugins: [
			wasm(),
			topLevelAwait()
		]
	}
})
```

### webpack 项目

webpack4 和 webpack5 的处理不一样

webpack4 配置

	让 wasm-pack 生成老版本胶水代码


webpack5 配置

```js
// 配置
{
	experiments: {
		asyncWebAssembly: true
	}
}

// 直接 import 引入胶水代码使用
const js = import("@huli66/hello-wasm/hello_wasm.js");
js.then((js) => {
	js.greet("WebAssembly");
});

// fetch 引入 wasm 文件
```

webpack 是否可以配置 loader 来将二进制文件打包到一起
或者使用远程文件通过 fetch 进行请求

使用时应该进行错误捕捉，严格验证类型，避免类型错误导致 Rust 错误

### 工具链

- wasm-bindgen：rust/js底层互操作库和cli工具，实现 rust/js 类型转换，生成绑定代码
- wasm-pack：基于wasm-pack的高级构建工具链，集成了 wasm-opt等优化文件大小的工具，自动化了构建、优化、打包发布到npm的完整流程

## wasm-pack

`wasm-pack` 集成了打包、发布、测试、优化体积等功能，用于构建 wasm 包

```sh
cargo -V
rustup update standable
cargo install wasm-pack
cargo install --list

wasm-pack new wasm-tools

wasm-pack build --scope huli66 --target bundler
wasm-pack build --scope huli66 --target web
wasm-pack publish
```

`--scope huli66` 使用自己的 `npm` 用户名作为域，生成的 `pkg` 下面的 `package.json` 的 `name` 也会带上 `@huli66` 前缀

 
两种打包 target 的区别

| 特性         | bundler          | web          |
| ---------- | ---------------- | ------------ |
| 构建目标       | --target bundler | --target web |
| 加载方式       | 同步/内联            | 异步/fetch     |
| 需要 init()  | 不需要              | 需要           |
| 需要 MIME 配置 | 不需要              | 需要           |
| 构建工具支持     | 需要               | 不需要          |

### bundler

### web
这个方式的优点是，不需要构建工具支持，如果是老项目使用 webpack3 这种，或者不想找版本合适的 `loader` `plugin` 等，可以使用这种方式，只需要在生产环境的 `nginx` 上配置 MIME 类型

```sh

```

可能遇到的问题：
直接调用 `init()` 出现报错
	webpack4 不支持 import meta，可以在包中找到相关代码，删掉，或者尝试手动引入 `.wasm` 文件然后进行使用
console 出现乱码
	开发环境没有配置 `application/wasm`
	