#vue/pinia #vue 

```sh
pnpm add pinia
```

```js
import { createPiania } from 'pinia'

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.mount('#app')
```

## 定义

```js
import { defineStore } from 'pinia'

export const useUserInfoStore = defineStore('store-name', {
	// ...其他配置
})
```

`defineStore(id, opt)` ,第一个参数为名称是必传的，被用作 id，Pinia 会用它连接 store 和 devtools，第二个参数可以是 *Option 对象*或者 *Setup 函数*，返回值是一个函数，名为为 `use...` 符合组合式函数风格的约定

### Option Store

```js
export const useUserInfoStore = defineStore('store-name', {
	state: => ({ count: 0 }), // data
	getters: { // computed
		double: (state) => state.count * 2,
	},
	actions: { // methods
		increment () {
			this.count++
		}
	}
})
```
### Setup Store
和组合式 API 的 setup 函数相似，传入一个函数，函数定义响应式属性和方法，并暴露一个带有想暴露的对象和方法的对象

```js
export const useCounterStore = defineStore('counter', () => {
	const count = ref(0) // state
	const doubleCount = computed(() => count.value * 2) // getter
	function increment() { count.value++ } // action

	return { count, dobleCount, increment }
})
```

### 使用

```vue
<script setup>
import { useCounterStore, storeToRefs } from '@/stores/counter'

const store = useCounterStore()

// const { name, doubleCount } = store // 这样解构会破坏响应性，解构的结果不具有响应性
const { increment } = store // action 可以直接从 store 解构，因为它们被绑定到 store 上了

const { name, doubleCount } = storeToRefs(store)
// 这样解构出来还是会有响应性
</script>
```

***store 是一个用  `reactive` 包装的对象，这意味着不需要在 getters 后面写 `.value` 。就像 setup 中的 props 一样，也不能进行解构***

	建议在不同文件去定义 pinia，可以定义任意多个，有利于构建工具自动进行代码分割以及 TS 推断

## State

```js
let entrust, transaction, position;

interface Message {

topic_id: '10002' | '10003' | '10004* msg_format: string;

msg_content: string;

const messageToStore = (msg: Message) =› {

if (msg.topic_id === '10002') {

entrust - msg.msg_content

} else if (msg.topic id === '10003') {

transaction - msg.msg_content

} else if (msg.topic id === '10004') {

position = msg.msg_content

} else {

console. log ('other message ...')
}
}
```