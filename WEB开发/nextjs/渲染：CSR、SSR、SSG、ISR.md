 ## page Router
 
 在 page Router 中可以很容易实现 CSR、SSR、SSG、ISR

### CSR

使用 useEffect 或其他异步获取数据的方法拉取数据，拿到之后再结束 Loading 状态

### SSR

导出一个 getServerSideProps async 函数，这个函数每次请求页面时这个函数都会被调用，返回的内容会被当成组件的属性，然后渲染成 html 页面再返回给浏览器

```js
export default function Page({data}) {
	return <p>{JSON.stringify(data)}</p>
}

export async function getServerSideProps() {
	const res = await fetch(`https://...`);
	const data = await res.json();
	return { props: {data}}
}
```

### SSG

Static Site Generation，静态站点生成，在构建阶段就将页面编译为静态的 HTML 文件，不用等用户访问时再生成，配置 output 后，`npm run build` 可以直接再文件夹看到生成的所有 html 页面

导出一个 getStaticProps 函数，用法和 getServerSideProps 类似，但是 只在构建时执行一次

```js
export defautl function Page ({post}) {
	return <p>{JSON.stringify(post)}</p>
}

// 生成动态路由的参数
export async const getStaticPaths() {
	const res = await fetch(`https://...`);
	const posts = await res.json();

	const paths = posts.map((post) => ({
		params: {id: String(post.id)},
	}))

	// 存在的路由的 getStaticProps 会拿到 paths 里面的 params 当入参
	// 不存在的路由会返回 404 页面
	return { paths, fallback: false}
}

// 不需要动态路由则不需要传参
export async const getStaticProps ({params}) {
	const res = await fetch(`https://.../${params.id}`);
	const post = await res.json();
	return { props: {data} }
}
```

**一个项目中，可以在不同页面中，分别使用 SSR 和 SSG，能用 SSG 的页面尽量使用 SSG，也可以使用 SSG + CSR 混合，提高首屏加载速度，CSR 动态填充内容**

### ISR

Incremental Static Regeneration 增量静态再生

在 page Router 下，ISR 效果可以简单理解为，一定时间内使用 SSG，一定时间后重新 调用 getStaticProps 生成新的 SSG

在 getStaticPaths 返回结果的 fallback 改为 ‘blocking'，getStaticProps 返回结果中增加也给 revalidate 属性，代表至少间隔多少秒才更新页面（构建失败则用之前的）
本地测试 ISR 功能需要先构建生产版本，再运行生产服务才行， `next dev` 运行会每次请求都调用 getStaticProps

**效果并不是类似服务端组件和客户端组件一样，只更新页面部分内容，而是整个页面刷新才能看到**


*混合使用时，Nextjs 会自动判断使用哪个模式，当页面有 `getServerSideProps` 时，会切换成 SSR 模式，没有则会预渲染页面为静态页面（CSR 也会先提供一个静态 HTML，只是部分内容没有）*

## app Router

app Router 中使用 强制缓存实现类似效果


