

一门向后兼容的 CSS 扩展语言

**Less 不会直接生效成样式，而是被编译为 CSS 之后才能生效**

使用 Less 本质上来说还是在使用 CSS，只是一些语法糖写法，可以由 less-loader 去转换成标准的 CSS，所以 CSS Module 不好写的问题还是有


## CSS in JS 和 CSS Module


都是通过生成唯一的类名来避免全局样式冲突，确保样式的局部作用域

两者都支持样式与组件直接关联，提高了组件的封装性

cssinjs 是将样式直接嵌入到 js 中，更灵活，可以动态样式，

css module 样式在构建时就已经确定（开发模式可以热更新）


- CSS Module，写法上类名需要从引入的文件获取

- CSS-in-JS 有运行时效率问题

- Tailwind CSS 预设样式，然后直接使用类名，编译成 css 文件

  
**传统的用 bem 命名法来保证样式局部生效**


## 用法

### 手动使用


可以在线上进行实践，把 less 转为 css [less2css.org](https://lesscss.org)

  

也可以在本地

  

```sh

npm install less

  

# 使用全局安装的 less 或者 node_modules/.bin/lessc

lessc --version / -v

  

# 把指定的 less 文件转换成 css 文件

# lessc [option ...] <source> [destination]

lessc ./src/index.less ./src/index.css

```

  

### webpack 中配置

  
  
  

### vite 中配置

  

## Sass 快速入门

  

### 变量

  

用 `$` 符号定义变量和使用变量，并且在 sass 中，**中划线和下划线互通，可以用一个定义，另一个使用**

  

作用域：在规则集内定义只能在该规则集内使用（包括子规则集）

  

```scss

$nav-border: 1px solid red;

nav {

$width: 100px;

width: $width; // 在规则集内定义只能在规则集内使用

border: $nav-border;

}

// 编译后

nav {

width: 100px;

border: 1px solid red;

}

```

  

### 嵌套

  

`&` 符号代表父选择器

  

同样支持 css 的群组选择器写法

  

还支持属性嵌套，写法是**从属性的一个中划线断开，然后把子属性写到 `{}` 中**

  

```scss

nav {

width: 1px;

border: {

style: solid;

width: 1px;

color: red;

}

}

```

  

### 导入

  

`@import` 进行导入

  

#### 局部文件

  

`sass` 的局部文件名以下划线开头，，这样的文件被称为局部文件，不会被生成对应的独立的 css 文件，导入这个文件时可以省略开头的下划线

  

```scss

@import "themes/night-sky" // 导入 "theme/_night-sky.scss"

```

  

#### 默认变量值

  

一般情况下，反复声明同一个变量，只有最后一处会有效

  

但是使用默认值时，如果已经被声明了会直接使用声明的值，否则使用默认值

  

```scss

$fan-width: 400px !default; // 如果前面（或者导入的库中）已经声明了这个变量，则使用声明的值

.fancybox {

width: $fan-width;

}

```

  

#### 嵌套导入

  

嵌套导入，局部文件会被直接插入到导入它的地方

  

```scss

// _blue-theme.scss

aside {

color: blue;

}

  

// index.scss

.blue-theme {

@import "blue-theme";

}

  

// 编译后

.blue-theme {

aside {

color: blue;

}

}

```

  

#### 原生导入

  

遇到这三种情况时，会被视为是原生的导入（`@import` 语句会保留在生成的 css 文件中）

  

- 被导入的文件名后缀为 `.css`

- 被导入的名字是一个 url 地址

- 被导入的文件名是一个 CSS 的 `url()` 值

  

如果要直接把一个 css 文件的内容插入，可以把该文件后缀改为 `.scss` ，再导入，因为 sass 完全支持 css 语法

  

### 静默注释

  

```scss

div {

width: 1px; // 这种注释不会出现在生成的 css 文件中

height: 2px; /* 这种注释会出现在生成的 css 文件中 */

color/* CSS 标准格式注释出现在原生CSS不支持的地方，也不会出现在生成的css 文件中 */: red;

}

```

  

### 混合

  

用于重用样式，用 `@mixin` 标识符定义，`@include` 调用

  

#### 混合器传参

  

```scss

// 定义一个混合器，可以传参，有一个参数有默认值

@mixin link-colors($normal, $hover, $visited: green) {

color: $normal;

&:hover { color: $hover }

&:visited { color: $visited }

}

  

a {

@include link-colors(blue, red, grey)

}

  

// 通过 $name: value 传参，可以不关注顺序

div {

@include link-colors(

$normal: blue,

$visited: grey,

$hover: red

);

}

```

  

#### 继承

  

基于类名的重用

  

```scss

//通过选择器继承继承样式

.error {

border: 1px solid red;

background-color: #fdd;

}

.seriousError {

@extend .error;

border-width: 3px;

}

  

// 编译后

.error, .seriousError {

border: 1px solid red;

background-color: #fdd;

}

  

.seriousError {

border-width: 3px;

}

```

  

混合器本身不会引起 css 层叠问题，因为混合器直接把样式放到 css 中，权重不变

  

## Less快速入门

  

### 变量 Variables

  

变量可以用来代替：规则值、规则名、url、import 导入的部分或者完整路径（可以用于切换主题）

  

用 `@` 前缀声明一个变量，`@{}` 来读取变量，如果是直接使用变量值，可以省略 `{}`

  

```less

@primary: #428bca; // 声明变量

@primary-dark: darken(@link-color, 10%); // 通过变量和函数计算另一个变量

@images: "../img"; // url

@selector: banner; // 选择器

@property: background; // 属性

  

.@{selector} {

@{property}: url("@{images}/wave.png"); // 属性名

@{property}-color: #0ee; // 属性名的一部分

}

  

// 可变变量

.section {

@color: primary;

.element {

color: @@color; // 用多重 @ 符号来取值

}

}

```

  
  
  

### 混合 Mixins

  

混合是一种将一组属性从一个规则集包含到另一个规则集的方法

  

比 sass 中的混合写法更简单

  

```less

.bordered {

border: 1px solid red;

}

  

#id {

color: #111;

.bordered(); // .bordered 所属的规则就包含在这个规则集下面了

}

div {

#id(); // 也可以用 id 进行混合

}

```

  

如果希望创建的 mixin 不被编译成 css 输出，需要在定义的时候就加上括号

  

```less

.mixin() {

color: red;

}

// 命名空间

#outer() {

.inner {

color: blue

}

}

```

  
  
  

### 嵌套 Nesting

  

`&` 代表当前选择器的父选择器

  

```less

.c {

color: red;

&:hover {

color: blue;

}

}

// 编译后的 css 文件

.c {

color: red;

}

.c:hover {

color: blue;

}

```

  

`@`规则（例如 `@media` `@supports`）会被冒泡到前面

  

```less

.component {

width: 300px;

@media (min-width: 768px) {

width: 600px;

@media (min-resolution: 192dpi) {

background-image: url(/img/retina2x.png);

}

}

@media (min-width: 1280px) {

width: 800px;

}

}

// 编译为

.component {

width: 300px;

}

@media (min-width: 768px) {

.component {

width: 600px;

}

}

@media (min-width: 768px) and (min-resolution: 192dpi) {

.component {

background-image: url(/img/retina2x.png);

}

}

@media (min-width: 1280px) {

.component {

width: 800px;

}

}

```

  
  
  

### 运算 Operations

  

算术运算符可以对任何数字、颜色、或变量进行运算，从 4.0 开始，括号外的 `/` 不会被计算，而是直接转换成 CSS，**calc 中的变量会被编译成值，但是里面的计算也会保留原样**

  

```less

@color: #222 / 2;

@var: 12px;

.c {

background-color: (#FFFFFF / 16);

color: @color;

height: calc(50% + @var - 220px);

}

  

// 编译后

.c {

background-color: #101010;

color: #222 / 2;

height: calc(50% + 12px - 220px);

}

```

  
  
  

### 转义 Escaping

  

转义允许使用任意字符串作为属性或者变量值 `~"anything"` 将会被原样输出

  

在 less 3.5+版本中，很多转义都不需要了，可以直接简写了

  

```less

@min700: ~"(min-width: 700px)";

@min800: (min-width: 800px); // 可以直接简写了

.element {

@media @min700 {

font-size: 12px;

}

}

// 编译

@media (min-width: 700px){

.element {

font-size: 12px;

}

}

```

  
  
  

### 函数 Functions

  

Less 中内置了多种用于转换颜色、处理字符串、算术运算等，[参考函数手册](#函数手册)

  

### 命名空间和访问符

  

出于组织和封装的目的，可以对混合进行分组，便于分发和重用

  

```less

// 可以通过后面是否附加括号来决定是否要被编译成 CSS 输出

// 如果有括号，那只有使用的地方会被编译成 CSS 输出

// 如果没有括号，那会被编译成普通的 类选择器规则集或id选择器规则集，使用的地方也会输出一遍

#bundle() {

.button {

display: block;

border: 1px solid black;

background-color: grey;

&:hover {

background-color: white;

}

}

.tab {

background-color: red;

}

}

  

div {

#bundle.button();

background-color: #bundle.tab[backgroundcolor] // 映射

}

  

// 编译后

header {

display: block;

border: 1px solid black;

background-color: grey;

background-color: red; // 映射的

}

header:hover {

background-color: white;

}

```

  
  
  

### 映射

  

3.5+版本，可以将 mixins 的规则集当成一组值的映射使用，可见上面例子

  

### 作用域 Scope

  

混合和变量定义和CSS 自定义属性（CSS变量）一样，不必在引用前先定义，而且也会按照作用域进行查找使用

  

```less

@var: red;

.div {

p {

color: @var;

}

@var: white;

}

// 编译后

.div p {

color: white;

}

```

  

CSS 变量和作用域

  

```css

:root {

--color1: red;

--color2: black; // 备用

}

.div {

color: var(--color1, --color2);

}

```

  
  
  

### 注释

  

和 js 一样

  

### 导入

  

在 CSS 中必须把 `@import` 放在其他规则集前面，但是在 Less 中不需要

  

- 如果导入的 `.css` 文件，则将被视为 CSS 并且保持原样

- 如果是其他任何扩展名或者没有扩展名后缀，都会被当成 `.less` 导入

  

```less

@import "library"; // library.less

@import "index.css";

@import (keyword) "index.less";

```

  

在React 项目中，如果在不同组件分别导入 CSS 文件，其实是会对全局生效的，按照导入顺序优先级

  

### 插件

  

```less

functions.add('pi', function() {

return new tree.Dimension(Math.PI);

});

.show-me-pi {

value: 3.141592653589793;

}

  

```

  
  
  
  
  

## 函数手册

  

less 内置的一些函数， [less函数手册](https://less.bootcss.com/functions/#logical-functions)

  

#### if(condition, trueValue, falseValue)

  

根据条件使用某一个值

  

```less

@some: foo;

div {

color: if((iscolor(@same))), @some, black);

}

```

  

#### boolean(condition)

  

保存一个 布尔值变量，方便后续的 if 等使用

  

```less

@bg: black;

@is-bg-light: boolean(luma(@bg) > 50%);

  

div {

color: if(@is-bg-light, black, white);

}

```

  

#### escape(string)

  

对输入字符串中的一些特殊字符进行编码，输出成新的字符串

  

- 不编码：`,` `/` `?` `@` `&` `+` `'` `$` `!` `~`

- 常见编码字符：`#` `=` `()` `{}` `<>` `:` `^`

  

```less

escape('a=1'); // a%3D1

```

  

#### e

  

字符串转换成不带引号的 css 或 less 规则

  

#### %format

  

带有 % 号的语句，会进行格式化，用后续参数替代前缀`%` 的符号，可以相同，会按照索引顺序来替换

  

```less

format-a-d:%("repetitions: %a file:%b", 1, 2)

```

  
  
  

#### replace(string, pattern, replacement[, flags])

  

把 string 中的 pattern 替换成 replacement

  

flags 类似正则：g 替换所有，i 不区分大小写

  
  
  
  
  

#### length(用逗号或者空格分割开的一组值)

  

返回这组值有几个

  

```less

  

@list: "banna", "tomato", "potato";

n: length(@list); // n: 3

length(1px solid red); // 3

```

  

#### extract(list, index)

  

按照索引返回空格或者逗号隔开的一组数据中的某个值

  

```less

style: extract(8px solid red, 2); // style: solid

```

  

#### range(start, end, step)

  

生成一组值，start 和 step 都是可选，start 默认是 1 或者 1px

  

```less

value: range(4); // value: 1 2 3 4;

value2: range(10px, 30px, 10); // value2: 10px 20px 30px

```

  

#### each(list, rules)

  

对 list 里的每个值按照 rules 进行操作

  

```less

@list: blue, green, red;

each(@list, {

.sel-@{value} {

a: b;

}

})

  

// 等价于

.sel-blue {

a: b;

}

.sel-green {

a: b;

}

.sel-red {

a: b;

}

  

// 也可以对规则组使用

@set: {

one: blue;

two: green;

three: red;

}

.set {

each(@set, {

@{key}-@{index}: @value;

})

}

```

  

#### Math 方法

  

内值了一批数学方法，对数字进行处理，使用和 js 类似

  

- ceil 进一

- floor 收尾

- percentage 转换成带 `%` 格式

- round 四舍五入，第二个参数可以指定位数

- sqrt 开方，单位不会 进行操作，保留原单位

- abs 取绝对值

- mod 求余

- min 数组取最小

- max 数组取最大

- pow 计算次方

- sin ，还有其他三角函数计算不一一列举

  
  
  

#### 类型方法

  

- isnumber 判断是否是数字，可以带单位，但是16进制不判断为数字

- isstring 是否是字符串

- iscolor 判断是否为颜色值，16进制和预设值等

- isruleset 是否是规则集

- isdefined 变量是否被定义了

  

- isem ispixel isurl iskeyword 等

  

#### 各种单位转换和颜色转换函数

  

less 中还内置了各种单位转换和颜色转换的函数，不一一列举了，秉承着样式结构逻辑分离的原则，把计算逻辑放在 js 中，平时开发基本上用不上这些内置函数，可以参考 [less函数手册](https://less.bootcss.com/functions/#logical-functions)