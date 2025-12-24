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

	矩形绘制
	fillRect(x, y, widht, height) 填充矩形
	strokeRect(x, y, width, height) 矩形边框
	clearRect(x, y, widht, height) 清除指定矩形区域，清除部分完全透明