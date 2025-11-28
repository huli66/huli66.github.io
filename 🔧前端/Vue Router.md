#vue/vue-router #vue 
## 入门

```sh
pnpm add vue-router@4
```

`<router-link to="/">` 进行导航，会被渲染成一个带 `href` 的 `<a>` 标签，但是它可以不重新加载页面就更改 URL [怎么做到的]()
`<router-view>` 路由匹配到的组件将渲染在这里，功能类似于插槽，它本身不会渲染 DOM，页面当中可以使用多个，每个都会单独渲染

通过调用 `app.use(router)` 触发第一次导航，并且可以在任意组件中以 `this.$router` 访问路由，`this.$route` 访问当前路由

```js
console.log(this.$route.params.username)
this.$router.push('/login')
```

要在 `setup()` 中（*没有this*）访问路由，请调用 `useRouter` 或 `useRoute`

`this.$router` 与直接使用 `createRoute` 创建的 `route` 实例完全相同，Vue 中使用 `this.$router` 只是为了避免在每个需要操作陆游的组件中都导入一次

完整代码 demo 如下：
```js
// router/index.js
import { createRouter, createWebHistory } from 'vue'
import HomeView form '../view/HomeView.vue'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	// useRouter 访问到的或者 this.$router.options.routes 也是这个
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView
		},
		{
			path: '/about',
			name: 'about',
			// tree-shaking 组件动态加载
			component: () => import('../components/about.vue')
		}
	]
})
export default router;
```

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)

app.mount('#app')
```

```vue
<script setup>
// App.vue
import { RouterView, RouterLink, useRouter, useRoute } from 'vue-router'
import { watchEffect } from 'vue'

const router = useRouter();
const route = useRoute();

watchEffect(() => {
	// 直接监听 route 是不会触发更新的，因为一直是同一个对象
	console.log('route', route.fullPath)
})
</script>
<template>
	<ul>
		<li v-for="{ name, path } in router.options.routes" :key="name">
			<RouterLine :to="path">{{ name }}</RouterLink>
		</li>
	</ul>
	<RouterView></RouterView>
</template>
```

## 动态路由匹配

将给定匹配模式的多个路由映射到同一个组件，实际生产环境中常用的例如用户主页
不同用户的路由 `/users/john` `/users/marks` 需要对应同一个组件 User

用冒号表示路径参数 `/user/:id`，这样可以匹配所有匹配路由，`this.$route.params.id` 获取指定参数

可以有多个参数在不同位置
`/users/:username/posts/:postId`  `$route.params --- { username: '', postId: '' }`

*使用带参数路由时，如果匹配同一个组件，那么组件实例将会被复用，比起销毁再创建性能更好，但是不会再调用生命周期钩子*

`watch` 监听路由内容后对比新老数据进行操作，可以实现类似 [导航守卫](#导航守卫) 功能

### 捕获所有路由或者 404 Not found 路由

```js
const routes = [
	// 匹配所有内容，括号内的正则表示可选可重复，放在 $route.params.pathMatch 上
	{ path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
	// 匹配以 `/user-` 开头的内容，放在 $route.params.afterUser 上
	{ path: '/user-:afterUser(.*)', component: UserGeneric }
]
```

*匹配跟书写顺序无关*
## 路由的匹配语法

在动态参数后的 `()` 中写正则匹配规则

默认情况下，所有路由不区分大小写且不区分结尾是否带 `/`，通过 `strict: true` 改为严格区分是否有后缀 `/`， `sensitive: true` 改为严格大小写，可以只修改某一条路由，也可以应用于所有路由

可选参数 `/users/:userId?` 匹配 0 或 1 个

## 嵌套路由

在组件内使用 `<router-view>` 可以渲染对应路由的 `children` 中配置的内容

## 编程式导航

类似 `window.history.pushState()`

`router.push()` 会向 history 栈添加一个新的标记，用户点击会退会回到前一个
点击 `<router-link :to="">` 时内部也是调用这个方法，一个是声明式导航，一个是编程式导航

`router.push()` 和 `to` 参数可以是路径字符串，也可以是一个对象（和 routes 一样）

*对象参数 的属性有 `path` `name` `params` `query` 等，传递了 `path` 则 `params` 会被忽略*

导航方法都会返回一个 `Promise` ，返回后就知道导航是成功了还是失败了

### 替换当前位置

类似 `window.history.replaceState()`

`<router-link :to="..." replace>` `router.push({ path: '/home', replace: true})` 这样不会向 history 添加新纪录，而是取代当前条目

### 横跨历史

类似于 `window.history.go(n)` ，`router.go(n)` 也是相同用法，代表在 `history` 栈中前进或后退几步，还有 `router.forward()` 相当于 `go(1)` ，`router.back()` 相当于 `go(-1)` ，如果没有那么多步，则静默失败

*不管是 history 模式还是 hash 模式，使用的都是这几个方法，应该是底层做了兼容*

## 命名路由

可以不传递 `path` 而使用 `name` ，这样就不需要写完整的 URL，然后动态参数部分通过 `params` 传递

所有命名必须唯一，否则只会保留最后一条

`{ path: '/usersss/:username', name: 'user', component: User }`

`<router-link :to="{ name: 'user', params: { username: 'eee' }}">`

匹配到 `/usersss/eee`

## 命名视图

一个路由展示多个同级的视图，比如一个路由下 sideBar 和 main 两个内容都是根据路由变化的
此时就需要两个 `router-view` 了，设置 `name` 属性进行区分，`components` 匹配多个组件，没有 `name` 则匹配 `components` 的 `default`

```html
<router-view class="view left-sidebar" name="LeftSideBar"></router-view>
<router-view class="view right-sidebar" name="RightSideBar"></router-view>
<router-view class="view" ></router-view>
```

```js
const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{
			path: '/',
			components: {
				default: Home,
				LeftSideBar: LeftSideBar,
				RightSideBar: RightSide,
			}
		}
	]
})
```

## 重定向和别名

### 重定向

```js
const routes = [{ path: '/home', redirect: '/' }]
// 传递一个对象，命名路由
const routers = [{ path: '/home', redirect: { name: 'homePage' } }]
```

一般情况下有 `redirect` 就不需要 `component` ，嵌套路由除外（有 `children` 和 `redirect` 则必须有 `component`）

*导航守卫并没有应用中跳转路由上，而是应用在其目标上，所以如果一个路由地址被重定向了，在这个路由上添加导航守卫是不会生效的*

### 别名

重定向会改变 URL，别名则不会，别名可以是一个数组
```js
// 访问 `/home` 时 URL 不会边，但是匹配的内容会是 `/` 对应的内容
const routes = [{ path: '/', component: HomePage, alias: '/home' }]
```

***路由有参数时，请确保在绝对别名中包含它们***

## 路由组件传参

routes 的 component 属性值可以是一个组件，也可以是一个对象，对象的 `template` 属性是 html 内容

`app.use(router)` 时就会触发一次导航

props 设置为 true 时，`route.params` 将被设置为组件的 props

等待后续开发

## 不同历史记录模式

### Hash 模式

使用 `createWebHashHistory()` 创建，path之前使用一个哈希字符 `#` ，后面跟配置的路由，且这部分 URL 不会发送到服务器，所以不需要在服务器层面进行特殊处理，但是不利于 `SEO`

### Memory 模式

`createMemoryHistory()` ，不会与 URL 交互，也不自动触发初始导航，适用于 Node 环境和 SSR，在浏览器中也可以使用，但是不会有历史记录，无法后退前进(会显示但无效)
### HTML5模式

即 history，`createWebHistory()` 创建，正常与 URL 交互，推荐使用


## 导航守卫

### 全局前置守卫
 
`router.beforeEach((to, from) => { ... })` ，导航触发时，全局前置守卫按照创建顺序调用，守卫是异步解析执行的，导航在所有守卫 resolve 之前一直处于等待中

```js
router.beforeEach(async (to, from) => {
	if (to.name === 'Login') { // 防止无限重定向
		return true // 返回 true 则正常导航，并且调用下一个导航守卫
		// 返回 false 则导航取消
	}
	await new Promise((resolve, reject) => {
		setTimeout(() => console.log, 3000) // 模拟异步查询内容
	})
	return { name: 'Login' } // 重定向到 Login 页面
})
```

### 全局解析守卫

`router.befroeResolve(async (to) => { ...getData })`，返回值情况和 `beforeEach` 一样

	在导航确认之前，所以异步解析之后，（`beforeEach` 返回 true 之后进入，导航取消则不进入），是获取数据或执行其他操作的理想位置（如果用户无法进入页面则可以避免执行）

### 全局后置钩子

`router.afterEach((to, from) => {})` ，不会接受 `next` 函数也不会改变导航

#### 守卫内全局注入

Vue 3.3 开始，可以在导航守卫内使用 `inject()` 方法

### 路由独享的守卫

`beforeEnter` 只有进入路由时触发，改变 params、query 或 hash 都不触发，（例如 `/users/2` `/users/3` 不会触发）

### 组件内的守卫

- `beforeRouteEnter` 路由被验证前调用，不能获取组件实例，但是可以在 next 中访问
- `beforeRouteUpdate` 当前路由改变，但是组件被复用时调用，可以访问组件实例
- `beforeRouteLeave` 导航离开该组件的对应路由时调用，可以访问组件实例

### 完整导航解析流程

	1. 导航被触发
	2. 在失活的组件里调用 `beforeRouteLeave`
	3. 调用全局的 `beforeEach`
	4. 在复用的组件里调用 `beforeRouteUpdate`
	5. 路由配置里调用 `beforeEnter`
	6. 解析异步路由组件
	7. 在被激活的组件里调用 `beforeRouteEnter`
	8. 调用全局的 `beforeResolve`
	9. 导航被确认
	10. 调用全局 `afterEnter`
	11. 触发 DOM 更新
	12. 调用 `beforeRouteEnter` 传给 `next` 的回调函数，创建好的组件实例会作为回调参数

## 路由元信息

## 数据获取

## 组合式 API

`useRoute` 返回一个 route 响应式对象，它的任何属性都可以被监听
`useRouter`

模板中还是可以直接访问 `$route` `$router` 不需要在 `setup` 中返回

### 导航守卫

`onBeforeRouteLeave`
`onBeforeRouteUpdate`

可以在任何由 `router-view` 渲染的组件中使用，不必像组件内守卫那样直接用在路由组件上
### useLink

```js
const {
	route, // 解析出来的路由对象
	href, // 用在链接里的 href
	isActive, // boolean，ref标识是否匹配当前路由
	isExactActive, // 是否严格匹配
	navigate // 导航函数
} = useLink(props)
```

`RouterLink` 的 `v-slot` 中可以访问与 `useLink` 相同的属性

## RouterView 插槽

暴露一个插槽，在渲染路由组件的基础上使用其他功能（比如 keep-alive，transition）

```vue
<template>
	<router-view v-slot="{ Component }">
		<keep-alive>
			<component :is="Component" />
		</keep-alive>
	</router-view>
</template>
```

## 过渡动效

## 滚动行为

```js
scrollBehavior (to, from, savedPosition) {
	// return 期望滚动到的位置
	return {
		el: '#main', // 默认不写，就是整个 body
		top: 10, // 相对 el 的偏移量
	}
	// 也可以是某个锚点
	return {
		el: to.hash,
		behavior: 'smooth', // 更流畅
	}
}
```

## 路由懒加载

## 类型化路由

## 扩展 RouterLink

## 导航故障

## 动态路由

`router.addRoute()` `router.removeRoute()` 。注册一个新的路由，然后用 `router.push()` `router.replace()` 来手动导航

添加同名路由会先删除原来的路由

`router.addRoute()` 返回路由的删除函数

