如果 flex 是一维布局，则 grid 是比 flex 布局更强大的 二维布局

容器 项目 单元格 交叉线
## 容器属性

- display: grid | inline-grid; 是否占满一行文档流
- grid-template-columns: [1] 100px [2] 200px [line3] 100px [4]
	- 分隔线可以命名，不命名则从 1 开始默认用数字命名
	- 网格高度可以是 绝对值 | 百分比 | fr 表示项之间的比例，类似 flex
	- repeat(3, 100px 20px 80px) 按照这个排列重复 3 次
	- repeat(auto-fill, 100px) 能排下几个 100px 的就排几个
	- minmax(100px, 35%); 最大值和最小值，如果最小值大于最大值呢
	- 100px auto minmax(100px,50%)
- grid-template-rows
- gird-template-areas: 'a b c' 'd e f' 'g g g'; 同名视为一个区域，不相邻的同名区域呢

- grid-gap: grid-column-gap grid-row-gap;

- grid-auto-flow: row | column | row dense | column dense; 带 dense 则用后续项填充前面留白

- justify-items: start | end | center | stretch; 默认 stretch
- align-items 项在格子里的位置
- place-items: align-items justify-items

- align-content: start | end | center | stretch | space-around | space-between | space-evenly;
	- space-evenly 所有间距相等
- justify-content
- palce-content: align-content justify-content; 所有格子在容器的布局

- grid-auto-columns 
- grid-auto-rows
- 用来指定自动创建的多余的格子的大小，用法和 grid-template-columns 一样

## 项目属性

- grid-column-start: line-name
- grid-column-end
- grid-row-start
- grid-row-end
- grid-column: grid-column-start / grid-column-end;
- grid-row: grid-row-start / grid-row-end;

- grid-area: area-name 撑满所有同名 area
- grid-area: row-start / column-start / row-end / column-end;
- 

- justify-self: start | end | center | stretch;
- align-self
- place-self: align-self justify-self; 只有一个则认为两值相同