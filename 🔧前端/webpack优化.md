  

```js

// ./webpack.config.js

module.exports = {

entry: '',

module: {

rules: [

{

test: /\.js$/,

include: path.resolve(__dirname, '../src'),

exclude: /node_modules/,

use: [

'cache-loader',

'thread-loader',

'babel-loader',

]

}

]

}，

plugins: [

new webpack.HotModuleReplacementPlugin()

],

devServer: {

hot: true

}

}

```

  

## 构建时间的优化

  

### thread-loader

  

多进程打包，放在比较费时间的 loader 之前

  

### cache-loader

  

缓存资源，提高二次构建的速度，放在比较费时的loader 之前

  

### 开启热更新

  

修改某一个文件会导致整个项目刷新，很耗时间，开启热更新

  

只用于开发模式

  

### exclude & include

  

合理设置 exclude 和 include 属性指定需要处理和不需要处理的文件，提高构建速度

  

### 构建区分环境

  

开发环境：去除压缩代码，gzip，体积分析等优化等配置，大大提高构建速度

  

生产环境：需要代码压缩，gzip，体积分析等，降低打包体积

  

### 提升 webpack 版本

  

新版本打包效果好

  

## 打包体积的优化

  

### CSS 代码压缩

  

### JS 代码压缩

  

### tree-shaking

  

webpack5 在 mode 为 production 时默认开启 tree-shaking 优化

  

### source-map 类型

  

开发环境中需要精准定位错误位置，而不是打包后的代码位置

eval-cheap-module-source-map

  

生产环境中避免体积太大，可以不用 source-map 或者使用 nosources-source-map

  

### 打包体积分析

  

## 用户体验优化

  

### 模块懒加载

  

### 小图片转 base64

  

### 合理配置 hash

  

### Gzip