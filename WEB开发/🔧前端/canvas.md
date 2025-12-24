canvas 只有 `width` `height` 两个属性，默认宽度是 300px，高度是 150px

*如果绘制的图像扭曲，尝试用属性明确宽高，而不是 CSS*

```html
<canvas id='stockGraph' width='150' height='150'>
	<span>浏览器不支持 canvas 时的替代内容</span>
</canvas>
```

在 html 中，canvas 必须要有闭合标签（不能自闭合），否则会把后面的内容当成替代内容，不展示出来

*canvas 提供了一个*