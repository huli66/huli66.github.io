#Rust 

## cargo

```sh
# 默认是 --bin，可以手动带上 --lib，bin 是可运行项目，lib 是依赖库
cargo new project_name

# 运行项目，默认 --debug，debug 模式下，编译不会做任何优化，编译速度会非常快，运行速度会慢
cargo run # 相当于运行下面两个指令
cargo build
./target/debug/project_name

# --release 模式，会进行编译优化，运行速度会更快
cargo run --release
cargo build --release
./target/release/project_name

# 项目大了之后，run 和 build 会变慢

# 可以用 cargo check 快速验证代码的正确性
cargo check
```

`cargo.toml` cargo 特有的项目数据描述文件，存储了项目所有的元配置信息

`cargo.lock` cargo 工具根据同一项目的 `cargo.toml` 文件生成的项目依赖详细清单，一般不需要手动修改

如果项目是一个可运行项目 （--bin）时，就应该讲 `cargo.lock` 也上传到 `git`,如果是依赖库项目，则建议添加到 `.gitignore`中

```toml
[package] # 定义项目描述信息

name = "project_name"

version = "1.0.0" # 项目版本

edition = "2024" # rust 大版本

[dependencies] # 定义项目依赖

rand = "0.3" # 基于官方仓库 `crates.io` 通过版本说明来描述

hammer = { version = "0.5.0" }

# 基于项目源代码仓库地址，通过 url 来描述
color = { git = "https://github.com/bjz/color-rs",branch = "master" }

# 基于本地的绝对路径或相对路径描述
geometry = { path = "crates/geometry" }
```

## 基础语法

### 变量

不可变变量和所有权

`let x = "hell"` 在 rust 中不是赋值的意思，给是绑定，让变量成为这个内存对象的主人

变量对存储这个字符串的内存对象具有所有权


```rust
let x = "hello"; // 声明的变量默认是不可变的，字符串必须使用双引号
let mut y = "world"; // mut 声明的变量是可变的
let _z = y; // 使用下划线开头忽略未使用的变量，否则 Rust 会给未使用变量 warning
```

不可变带来安全性，可变带来灵活性

显式声明类型的可变变量不能绑定其他类型的值，

变量解构


```rust
fn main() {
	let (a, mut b): (bool, bool) = (true, false)
}

```
  
解构式赋值

变量遮蔽（类似 js 的作用域，同作用域或者子作用域中，后面声明的同名变量覆盖前面的）

使用 `const x: bool = true` 声明常量，常量

### 基本类型

字符 char

字符类型用单引号，每个字符占用 4 字节，从 U+0000 - U+D7FF 和 U+E000 - U+10FFFF 都是合法的

字符串类型用双引号

布尔 bool

true 和 false，占用 1 字节内存，主要用于流程控制

单元类型 unit

单元类型就是 `()`，也是唯一值，main 函数返回类型就是单元类型，和 go 语言的 struct{} 类似，用于作为占位符也可以，但是完全不占用任何内存

没有返回值的函数定义是发散函数 `( diverging functions)`

语句 statement

Rust 的函数体由一系列语句组成，最后由一个表达式来返回值

语句会执行一些操作，但是不会返回一个值，不能用于给其他值赋值（绑定）

表达式

表达式 expression

表达式会进行求值，表达式可以是语句的一部分，比如 `let x = 6` 这个语句中，`6` 就是一个表达式

表达式本身不能包含分号，分号结尾就会变成语句，不再返回一个值

```rust
fn main() {
	let y = {
		let x = 3;
		x + 1
	};
	println!("y is {}", y)
}

```
