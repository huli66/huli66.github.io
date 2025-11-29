
尺寸小于一定尺寸则判断为移动端
```js
window.screen.width < 700
window.innerWidth < 700
window.matchMedia('only screen and (max-width: 700px)').matches;
```



特有的属性，orentation 是否横屏，ontouchstart 桌面设备没有这个属性

```js
if (typeof window.orentation !== 'undefined') {
	// 移动端
}
if ('ontouchstart' in document.documentElement) {
	// 移动端
}
```

userAgent
```js
if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
	// 移动设备
}
// Chromium 系浏览器专属
const isMobile = navigator.userAgentData.mobile

// 所有浏览器都支持的废弃属性
if (/Android|iPhone|iPad|iPod/i.test(navigator.platform)) {
	// 移动端
}
```

现有的库 `react-device-detect` 

**如何判断是 M 系列芯片的 Mac 还是 Intel**
目前主流浏览器都在撒谎，说是 Intel 芯片
Chromium 浏览器可以通过 
`navigator.userAgentData.getHighEntropyValues(["architecture", "bitness"]).then((ua) => console.log('ua', ua));`
里面的结果有没有 Mac 和 Arm 来判断

通过 WebGL 渲染器的信息来检测、更加性能特征来检测、检查系统信息

```js
const detectM1M2 = async () => {

	try {
		// 方法1：使用 WebGL 渲染器信息
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl');
		if (gl) {
			const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
			if (debugInfo) {
				const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
				console.log('WebGL 渲染器:', renderer);
				// Apple Silicon 通常会显示 "Apple M1" 或 "Apple M2"
				if (renderer.includes('Apple M')) {
					console.log('检测到 Apple Silicon 芯片');
					return true;
				}
			}
		}
		// 方法2：使用性能特征
		const start = performance.now();
		// 执行一些计算密集型操作
		for (let i = 0; i < 1000000; i++) {
			Math.sqrt(i);
		}
		const end = performance.now();
		const duration = end - start;
		console.log('计算耗时:', duration, 'ms');
		// M1/M2 芯片通常性能更好，计算速度更快
		if (duration < 50) { // 这个阈值需要根据实际情况调整
			console.log('可能运行在 Apple Silicon 芯片上');
			return true;
		}
		// 方法3：检查系统信息
		if (navigator.platform === 'MacIntel' &&
			window.matchMedia('(prefers-color-scheme: dark)').matches) {
			// 这是一个间接的方法，因为 M1/M2 Mac 通常运行较新的 macOS
			console.log('可能是 Apple Silicon Mac');
			return true;
		}
		console.log('未检测到 Apple Silicon 芯片');
		return false;
	} catch (error) {
		console.error('检测过程出错:', error);
		return false;
	}
}
```

