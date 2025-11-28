rollup.js 本意是打造一款简单易用的 ES 模块打包工具，不必配置直接使用，它确实做到了，但是后面不断发展也支持打包 CommonJS 模块，这时就需要复杂配置了，并不比 Webpack 简单多少，因此*只建议把 rollup.js 用于打包 ES 模块*，使用了 CommonJS 模块则不推荐

[rollup 官网](https://www.rollupjs.com/)

```sh
npm i -g rollup
# 不在本地安装也可以用 npx rollup 实现下面的所有命令
npx rollup --help

# 打包 main.js 文件，保存到 bundle.js 文件中
rollup main.js --file bundle.js

# 多入口打包并指定保存文件
rollup main1.js main2.js --dir dist

# 压缩/最小化代码包
rollup main.js --compact
# 用其他工具压缩，如 uglifyjs
rollup main.js | uglifyjs --output bundle.js

# 默认不启用配置文件 rollup.config.js，带 -c 参数启用配置文件
rollup --config rollup.config.ts --configPlugin typescript

# 转换成 commonjs 模块
rollup add.js --format cjs
```

```ts
/** @type {import('rollup').RollupOptions} */
export default {
	input: 'src/main.js',
	output: {
		file: 'budle.js',
		format: 'cjs'
	}
}
```

