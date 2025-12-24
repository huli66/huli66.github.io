canvas 只有 `width` `height` 两个属性，默认宽度是 300px，高度是 150px

*如果绘制的图像扭曲，尝试用属性明确宽高，而不是 CSS*

```html
<canvas id='stockGraph' width='150' height='150'>
	<span>浏览器不支持 canvas 时的替代内容</span>
</canvas>
<script>
	const c = document.getElementId('stockGraph');
	if (c.getContext) {
		const ctx = c.getContext('2d');
	} else {
		console.log('browser dont support canvas');
	}
</script>
```

在 html 中，canvas 必须要有闭合标签（不能自闭合），否则会把后面的内容当成替代内容，不展示出来

*canvas 提供了一个 `getContext` 方法，可以获取 canvas 的多种上下文，`2d` `bitmaprenderer` `webgl` `webgl2` ，目前使用最常用的 `2d`，也可以用 `if (canvas.getContext)` 来简单测试浏览器是否支持 canvas*

## 图形绘制

canvas 只支持两种图形的绘制：矩形和路径（由一系列点连成的线段），其他图形都是通过一条或多条路径组合而成

**路径和子路径都是闭合的（可以调用 closePath 闭合，也可以自动闭合）**

	矩形绘制
	fillRect(x, y, widht, height) 填充矩形
	strokeRect(x, y, width, height) 矩形边框
	clearRect(x, y, widht, height) 清除指定矩形区域，清除部分完全透明

	绘制路径
	beginPath() 新建路径，图形绘制命令被指向到了路径上来生成路径
	closePath() 闭合路径，图形绘制命令又会重新指向上下文
	storke() 通过线条来绘制图形的轮廓
	fill() 通过填充路径的内容区域生成实心的图形

如果图形已经是闭合的了，即当前点是开始点，那闭合方法什么都不做，否则绘制一条从当前点到开始点的直线来闭合路径

调用 `fill()` 时，所有没有闭合的形状都自动闭合，不需要调用 closePath，但是 `stroke()` 不会这样

`moveTo(x, y)` 将笔触移动到指定坐标，通常在 canvas 初始化或者 beginPath 后设置起点，也可以用来绘制不连续路径

`lineTo(x, y)` 绘制一条从当前点到指定点的直线

`arc(x, y, radius, startAngle, endAngle, anticlockwise)` 以 (x, y) 为圆心，radius 为半径，从起始弧度到结束弧度，顺时针画圆弧（ 默认是 false，顺时针，true 则逆时针）

*`弧度=(Math.PI / 180) * 角度`，所以半圆位置为 `Math.PI`，画整个圆为 `Math.PI*2`，虽然 和 0 位置一样，但是不能是 0*

弧度 0 是圆心右侧距离为 radius 的位置，弧度计算是顺时针计算角度

`arcTo(x1, y1, x2, y2, radius)` 初始点到 (x1, y1)，(x1, y1) 到 (x2, y2) 两条直线相交会有一个夹角，画一段弧线，在这个角里面，和两条直线都相切，半径为 radius，不太可控，很少使用