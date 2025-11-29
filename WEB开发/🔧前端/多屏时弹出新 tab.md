
```ts
const openWindow = (url: string) => {
	const {
		availTop, // 返回浏览器可用空间左边距离屏幕（系统桌面）左边界的距离。
		availLeft, // 返回浏览器可用空间左边距离屏幕（系统桌面）左边界的距离。
		availHeight, // 浏览器在显示屏上的可用高度，即当前屏幕高度
		availWidth, // 浏览器在显示屏上的可用宽度，即当前屏幕宽度
	} = window.screen as any;
	const pageWidth = window.innerWidth * 0.8; // 弹出窗口的宽度
	const pageHeight = window.innerHeight * 0.8; // 弹出窗口的高度
	let pageTop = (availHeight - pageHeight) / 2 // 窗口的垂直位置
	let pageLeft = (availWidth - pageWidth) / 2 // 窗口的水平位置;
	// if (navigator.userAgent.indexOf('Chrome') !== -1) { // 兼容chrome的bug
	// pageTop += availTop // 距顶偏移值
	// pageLeft += availLeft // 距左偏移值
	// }
	pageTop += availTop // 距顶偏移值
	pageLeft += availLeft // 距左偏移值
	console.log('pageTop', pageTop, pageLeft, pageWidth, pageHeight);
	const windowFeatures = `channelmoe=yes,width=${pageWidth},height=${pageHeight},top=${pageTop},left=${pageLeft}`;
	window.open(url, issuerDetail, windowFeatures);
}
```