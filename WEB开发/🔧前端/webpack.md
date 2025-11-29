
  
[toc]

  

## 背景

  

- 文件划分方式

模块直接在全局工作，污染全局作用域

没有私有空间，所有模块内的成员都可以在模块外部被访问和修改

无法管理模块直接的依赖关系，容易命名冲突

  

- 命名空间方式

约定每个模块只暴露一个全局对象，所有模块成员都挂载到这个全局对象中，解决了命名冲突问题

```javascript

// module-a.js

window.moduleA = { method1: function () {}}

```

  

- IIFE

使用立即表达式为模块提供私有空间，闭包

**每个模块成员都放在一个立即执行函数形成的私有作用域中，对于需要暴露给外部的成员，通过挂到全局对象上的方式实现**

这种方式带来了私有成员的概念，私有成员只能在模块成员内部通过闭包的形式访问，解决了全局作用域污染和命名冲突问题

```javascript

(function () {

var name = 'hello';

function method1 () {

console.log(name);

}

window.moduleB = {

method1: method1,

}

})()

```

  

- IIFE 依赖参数

在 IIFE 的基础上，利用参数作为依赖声明使用，使模块间的依赖关系更加明显

  

### 模块化规范的出现

  

- CommonJS 规范: Node.js 中遵循的模块规范，每个模块都有单独的作用域，通过 module.exports 导出成员，再通过 require 函数载入，**以同步的方式加载模块（Node.js 的执行机制是启动时加载模块，执行过程中只是使用模块，但是浏览器中也这样做的话会引起大量同步请求，导致效率低下，所以专门为浏览器设计了一个规范，AMD Asynchonous Module Definition）**

四个重要的环境变了：`exports` `module` `require` `global`

在 Node 中属于内置模块系统，可以直接使用，不存在环境不支持问题

  

- ES Modules 规范: 目前绝大部分浏览器支持

  

- AMD 规范: define() 函数定义，每个函数默认接收两个参数，第一个是依赖项数组，第二个是一个函数，函数参数与前面的依赖项一一对应，每个参数是一个数组成员，当前模块导出则 return

  

- CMD 规范: 淘宝的 Sea.js，另一种浏览器端模块化方案

  

**AMD 推崇依赖前置，提前执行，CMD 推崇依赖就近，延迟执行**

  

```javascript

/** CommonJS 写法 */

// math.js

var basic = 0;

function add(a, b) {

return a + b;

}

module.exports = {

add: add,

basic: basic

}

// 引用自定义模块，参数包含路径，可省略 .js

var math = require('./math.js');

math.add(2, 3);

  

// 引用核心模块，参数不用包含路径

var http = require('http')

http.createService(...).listen(3000);

  

/** ES6 Module 写法 */

// 定义模块 math.js

var basic = 0;

function add() {}

export { basic, add }

// 定义模块 b.js

var sum = 1;

export default { sum }

// 引入模块

import { basic, add } from './math'

import math from './b'

  

/** AMD 写法 */

define(['a', 'b', 'c', 'd', 'e'], function (a, b, c, d, e) {

// 等于在最前面声明并初始化了所有要用到的模块

a.doSomething();

if (false) {

// 即便没有用到 b 这个模块也提前执行了

b.doSomething();

}

})

  

/** AMD 引用模块 */

require(['jquery', 'math'], function ($, math) {

var sum = math.add(1, 3);

$('#sum').html(sum);

})

  

/** CMD 写法 */

define(function(require, exports, module) {

var a = require('./a'); // 需要时声明

a.doSomething();

if (false) {

var b = require('./b');

b.doSomething();

}

})

  

/** Sea.js 引用模块 */

seajs.use('math.js', function (math) {

var sum = math.add(1 + 2);

})

```

  

模块化的标准规范

- **Node.js 环境中，遵循 CommonJS 规范来组织模块（最新的 Node.js 提案中，Node 环境也会逐渐趋向于 ES Modules 规范）**

- **浏览器环境中，遵循 ES Module 规范**

  

### 模块打包工具的出现

  

- 问题

ES Moduls 的兼容性问题

划分的模块文件过多，造成频繁请求模块

HTML CSS 图片等文件也需要模块化

  

- 需要实现

编译代码能力：将包含新特性等代码转换成能够兼容大多数环境的代码 - ES5

将散落的模块打包到一起（运行时其实不需要模块化的文件划分，只是为了方便开发者组织代码）

支持不同类型的前端模块（HTML、CSS、图片...），所有资源文件的加载通过代码控制，与业务代码统一维护

  

## 核心特性

  

### 使用 Webpack 实现模块化打包

  

- 将零散的 javascript 代码打包到一个文件

- 对于有环境兼容问题的代码，在打包过程中通过 Loader 机制对其实现编译转换，然后再进行打包

- 支持在 JavaScript 中以模块化的方式载入任意类型的资源

- 按照需要分块打包，避免产生的单个文件过大，导致加载慢的问题，可以在工作过程中实际需要用到某个模块再异步加载该模块，实现增量加载，非常适合现代化的大型 Web 应用

  

```sh

# 初始化 管理依赖版本

npm init --yes

  

# webpack 是 Webpack 的核心模块，webpack-cli 是 Webpack 的 CLI 程序，用来在命令行中调用 Webpack

npm i webpack webpack-cli --save-dev

  

# npx 是 npm 5.2 以后新增的一个命令，用来更方便执行远程模块或者项目 node_modules 中的 CLI 程序

npx webpack --version

  

# 执行打包命令

npx webpack

  

# 可以将 Webpack 命令定义到 package.json 中的 scripts 中

"build": "webpack"

```

Webpack 4 以后的版本支持零配置直接启动打包，默认将 src/index.js 作为打包入口，最终打包结果放在 dist/main.js 中

  

可以通过配置文件的方式修改 Webpack 的默认配置，在项目的根目录下添加一个 webpack.config.js

  

**webpack.config.js 是一个运行在 Node.js 环境中的 JS 文件，也就是说，我们需要遵循 CommonJS 规范**

  

```javascript

// ./webpack.config.js

import { Configuration } from 'webpack';

  

/**

* 加上这种格式的注释后就会自动提示类型

* 配置完之后一定要将这段代码注释掉

* 因为 Node.js 环境中还不支持 import 语句

* @type {Configuration}

*/

const config = {}

// 或者在注释中动态导入类型

// 并不是基于 ES Modules 的动态 import，而是 TypeScript 中提供的特性（VSCode 中的类型系统都是基于 TyopeScript 的）

/**

* @type { import ('webpack').Configuration }

*/

  

// 运行在 Node.js 环境中的代码，可以直接使用 path 之类的 Node.js 内置模块

const path = require('path');

module.exports = {

entry: './src/main.js',

output: {

filename: 'bundle.js',

path: path.join(__dirname, 'output'),

}

}

```

  

[Webpack 详细配置](https://webpack.js.org/configuration/#options)

[中文网](https://www.webpackjs.com/configuration/)

  

#### Webpack 工作模式

  

Webpack 4 中新增了一个工作模式的用法，大大简化了配置的复杂程度，可以简单理解为针对不同环境的几组预设配置

- produuction 模式下，启动内置优化插件，自动优化打包结果，打包速度偏慢

- development 模式下，自动优化打包速度，添加一些调试过程中的辅助插件

- none 模式下，运行最原始的打包，不做任何额外处理

  

如果没有配置一个明确的值，打包过程中命令行终端会打印出一个警告，此时默认使用 production 模式去工作

  

修改工作模式可以：

- 通过 CLI --mode 参数传入

- 配置文件设置 mode 属性

  

[参考](https://webpack.js.org/configuration/mode/)

  

#### 打包结果运行原理

  

先将 mode 设置为 none，按照最原始的状态进行打包，得到的结果最容易理解和阅读

  

### 通过 Loader 实现特殊资源加载

  

直接用 Webpack 打包 CSS 文件会报错：解析过程遇到非法字符

Webpack 内部默认 Loader 只能处理 JS 模块代码，把所有文件当作 Javascript 代码解析

此时需要一个可以加载 CSS 模块的 Loader ，最常用的是 css-loader

**如果使用老版本 Webpack，对应的 loader 也要用老版本的**

**一旦配置多个 Loader，执行顺序是从后往前执行**

  

源码 ---> loader ---> webpack ---> bundle.js

  

```sh

npm install css-loader --save-dev

```

```javascript

// ./webpack.config.js

module.exports = {

entry: './src/main.css',

output: {

filename: 'bundle.css',

},

module: {

rules: [

{

test: /\.css$/, // 打包过程遇到的文件路径匹配则使用这个 loader

use: [ // 一旦配置多个 Loader，执行顺序是从后往前执行的

'style-loader',

'css-loader'

]

}

]

}

}

```

  

css-loader 的作用是将 CSS 模块转换成一个 JS 模块：将 CSS 代码 push 到一个数组中，数组由 css-loader 内部提供，**只会把 CSS 模块加载到 JS 代码中，并不会使用这个模块**，然后用 style-loader 将加载到的所有样式模块，通过创建 style 标签的方式添加到页面上

  

#### 在 JS 中加载其他资源

  

**建议把 JS 文件作为打包入口，然后 JS 代码中通过 import 语句去加载其他资源**

**即便通过 JS 代码去加载到 CSS 模块，css-loader 也可以正常工作，因为 Webpack 在打包过程中hi循环遍历每个模块，然后根据配置将每个遇到的模块江哥对应的 Loader 去处理，最后再将处理完的结果打包到一起**

  

***可以保证打包后资源不会缺失且都是必要的***

  

#### 开发一个 loader

  

Webpack 加载资源的过程类似于一个工作管道（then 的链式调用），可以依次使用多个 Loader，这个管道的最终结果必须是一段标准的 JS 代码字符串

  

- 最后必须返回标准的 JS 代码字符串，可以是 CommonJS 规范也可以是 ESModule 规范

- 可以多个 Loader 配合，注意书写顺序

  

### 利用插件机制横向扩展 Webpack 的构建能力

  

实现自动在打包之前清除 dist 目录 clean-webpack-plugin

自动生成应用所需的 HTML 文件 html-webpack-plugin

根据不同环境为代码注入类似 API 地址这种可能变化的部分

拷贝不需要打包的资源文件到输出目录 copy-webpack-plugin

压缩 Webpack 打包完成后输出的文件

自动发布打包结果到服务器实现自动部署

  

```javascript

// ./webpack.config.js

const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const HtmlWebpackPlugin = require('html-webpack-plugin'); // html-webpack-plugin 默认导出的就是插件类型

  

module.exports = {

entry: './src/index.js',

output: {

filename: 'bundle.js',

},

module: {

rules: [

{}

]

},

plugins: [

new CleanWebpackPlugin(),

new HtmlWebpackPlugin(

title: 'Webpack Plugin Sample',

template: './src/index.html',

meta: {

viewport: 'width=device-width'

}

),

new CopyWebpackPlugin({

patterns: ['public']

})

]

}

```

  

#### 开发一个插件

  

相比于 Loader，插件的能力范围更广泛，Loader 只是在模块加载环节工作，而插件的作用范围几乎可以触及 Webpack 工作的每一个环节

  

**在不同节点钩子上挂载不同任务，就可以轻松扩展 Webpack 的能力**

**生命周期的狗子中挂载任务函数实现的**

  

### Webpack 运行机制和核心原理

  

- 找到入口文件，根据 import 或者 require 解析文件所依赖的资源模块，形成依赖关系树

- Webpack 递归遍历依赖树，找到每个节点对应的资源文件，根据 Loader 配置加载，最后放入打包结果中

- 无法通过 JavaScript 代码表示的资源模块（图片和字体等），一般会单独作为资源文件拷贝到输出目录

  

- 查阅源码到思路

- Webpack CLI 启动打包流程

- 载入 Webpack 核心模块，创建 Compiler 对象

- 使用 Compiler 对象开始编译整个项目

- 从入口文件开始，解析模块依赖，形成依赖关系树

- 递归依赖树，将每个模块交给对应的 Loader 处理

- 合并 Loader 处理完的结果，将打包结果输出到 dist 目录

  

### Vue.js 3.0 带来了哪些变化

  
  

## 高阶特性

  

### Dev Server

  

### Webpack SourceMap 最佳实践

  

### 如何让模块支持热替换机制

  

HMR Hot Module Replacement

在程序运行过程中实时替换掉某个模块，而应用的运行状态不会因此而改变

  

已经集成到 webpack 中了

  

运行 webpack-dev-server --hot

  

```javascript

const webpack = require('webpack');

  

module.exports = {

devServer: {

hot: true

},

plugins: [

new webpack.HotModuleReplacementPlugin()

]

}

```

  

HMR APIS

  
  

## 其他同类优秀方案

  
  
  

### 更新到 webpack 5

  

```sh

npm install webpack@latest webpack-cli@latest webpack-dev-server@latest

```

  

引入 speed-measure-webpack-plugin 测速

  

开箱即用的持久化缓存

  

sourcemap优化

  

- 建议开发环境用 eval-cheap-module-source-map 内联 sourcemap，减少构建时间

  

- watch，watchOptions: { 'ignored': /node_modules}

  

- 忽略node_modules（很少改变）减少性能压力

  

- 开发环境和生产环境使用不同配置

  

- 开发中用 style-loader

- 生产中用MiniCssExtractPlugin

- TerserPlugin 插件缓存打开，然后里面exclude 去除 node_modules 部分

- React-refresh/babel 为React 项目添加热更新能力

- babel-loader 开启缓存