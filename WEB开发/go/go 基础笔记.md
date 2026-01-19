
- 解引用再访问字段需要用括号，比较麻烦，所以go 语法允许直接写 q.X 无需显示解引用
- 结构体允许只声明部分字段，未声明的字段会自动赋值为零值
- 数组固定大小，切片是动态数组 slices
- 切片不会单独存储数据，只是描述底层数据的一部分，更改一个切片的元素，会改变其底层数组的元素，其他切片也能看到
- 同一个目录下的文件必须属于同一个包，同一个包的不同文件可以共享类型与函数
- 值接收器，调用时传递值创建副本，指针接收器，不创建副本，传递指针

```go
package main

import "fmt"

type Vertex struct {
	X int
	Y int
}

func main1() {

	v := Vertex{1, 2}
	v.Y = 6

	q := &v

	// 解引用再访问字段需要用括号，比较麻烦，所以go 语法允许直接写 q.X 无需显示解引用
	// 这两种写法一致
	fmt.Println((*q).X, q.X)

	var (
		v1 = Vertex{1, 2}
		// 结构体允许只声明部分字段，未声明的字段会自动赋值为零值
		v2 = Vertex{X: 1}
		
		v3 = Vertex{}
		s  = &Vertex{1, 2}
	)

	// 为什么这里&v1输出的不是一段地址
	// 因为 fmt.Println 打印会自动解引用，要打印地址需要使用 fmt.Printf p%
	fmt.Println(v1, v2, v3, s, &v1)
	fmt.Printf("v1 is of type %T\n, address is %p\n", v1, &v1)

	// 数组固定大小，切片是动态数组 slices
	a := [3]int{1, 2, 3}
	a[0] = 100
	fmt.Println(a[0])

	// 获取 a 的前开后闭区间的切片，包含开头，不包含结尾，切片范围也不能溢出，否则会报错
	b := a[0:3]
	fmt.Println(b)

	// 切片不会单独存储数据，只是描述底层数据的一部分，更改一个切片的元素，会改变其底层数组的元素，其他切片也能看到
	// 类似引用的效果

	// 没有传长度，创建一个数组，然后构建一个引用它的切片
	ss := []int{1, 2, 3}

	fmt.Printf("ss is of type %T\n, address is %p\n", ss, &ss)
	fmt.Println(ss)

	ss = ss[1:3]
	fmt.Printf("ss is of type %T\n, address is %p\n", ss, &ss)
	// 省略切片的上下限则使用其默认值，0 和 length，切片的切片也可以使用
	fmt.Println(ss[:], ss[:2], ss[0:])

	n := [5]int{1, 2, 3, 4, 5}
	var m []int = n[2:3]
	fmt.Println(m)
	fmt.Printf("len=%d, cap=%d, address=%p\n", len(m), cap(m), &m)

	// len 代表切片的长度，cap 代表切片的容量（数组从切片开头计数的元素数量，容量大于长度可以重新切片延长范围）
	// 切片可以作为另一个切片的底层数组
	// 不同类型不能直接比较，否则会报错

	// make 分配内存，将元素初始化为零值，创建一个切片并返回

	// 切片比数组更灵活，更轻，传递只需要传递切片头，不需要传递整个数组，自切片操作也不需要复制数据
	// 只有读写数据的时候才会操作底层数组

	// 切片头包含三个字段，指向底层数组的指针 ptr，长度 len，容量 cap

	// 作为函数参数时，也应该传入切片头，而不是整个数组

	// 切片 append 方法，将元素添加到切片末尾，返回新的切片，如果底层数组长度不够，将分配更大的数组，返回的切片也指向新的数组

	// range 遍历切片或映射，可以使用 _ 来忽略索引或者值，如果只需要索引可以直接忽略
	// range 读取的值是副本，如果是切片（引用），修改了也不会影响原切片的底层数组

	// map 的的顶级类型是个类型名称，那可以省略，如果是匿名结构体，引用，interface 都不能省略
	// delete(m, key) 删除某个元素

	// elem, ok := m[key] 获取 元素值和key 是否存在，如果 key 不存在，则读取的值是零值

	// map，qiep，函数，都传递头，不传递底层数据
}
```

```go
package main
import (
"fmt"
"math"
)

type Vertex1 struct {
X, Y float64
}

func (v Vertex1) Abs() float64 {
return math.Sqrt(v.X*v.X + v.Y*v.Y)
}

  

func (v Vertex) Scale2(f int) int {
v.X = v.X * f
v.Y = v.Y * f
return v.X
}

// 方法在类型外部，通过接收器绑定
// 类似于 Vertex1.prototype.Scale = function(f) {}
// 只是 js 中显示绑定，go 中编译器内部自动处理绑定
// 接收器变量名则类似 this，指向调用的该方法的实例
// 使用指针接收器（*Vertex1）才能修改原值，否则（Vertex1）只会修改一个副本的值
// js this 在运行时确定，go 的接收器变量类型在编译时确定
// 值接收器，调用时传递值创建副本，指针接收器，不创建副本，传递指针
func (x *Vertex1) Scale(f float64) float64 {
x.X = x.X * f
x.Y = x.Y * f
return x.X
}

// 同一个目录下的文件必须属于同一个包，同一个包的不同文件可以共享类型与函数
// 调用具有指针接收器的函数时，如果实参是值类型，会自动取地址传递给函数
// 如果实参是指针类型，会自动解引用传递给函数
func main() {
v := Vertex1{3, 4}
fmt.Println(v.Abs(), v.Scale(10), v.X)
}
```

