
## 前置知识

role 用于帮助无障碍设备阅读网页

formAction button 的这个属性上绑定动作，和 form 的 action 属性效果类似，是 React18/Next13 后支持的属性
### useTransition

在组件顶层调用 useTransition，将某些状态更新标记为 transition（一种 react 更新的优先级）

```js
const [isPending, startTransition] = useTransition();
```
- isPending 是否存在待处理的 transition（pending？）
- startTransition 函数，可以使用此方法将更新标记为 transition

### useFormStatus

```jsx
function Submit() {
	const { pending } = useFormStatus();
	return <button disabled={pending}>...</button>
}
function Form() {
	return(
		<form action={submit}>
			<Submit />
		</form>
	)
}
```

显示父级 form 的提交状态，submit 了则 pending 为 true，否则为 false，如果没有嵌套在 form 的子组件中而是直接在使用 form 的组件中使用，则一直是 false

### useActionState

原 react-dom/useFormState，现移到 react 下，名字改为 useActionState

```jsx
const [state, formAction, isPending] = useActionState(action, initialState, permalink?);
```

- state 随表单动作被调用更新的 state，初始为 initialState，每次 formAction 执行完后会把返回结果更新给 state
- formAction 绑定 from 组件的 action 或者 button 组件的 formAction，也可以手动在 startTransition 中调用
- isPending 是 formAction 执行的状态，执行中为 true
- action 表单动作要执行的函数，会把上一次的 state 和当前的 formData 当成参数传入调用
- initialState 必传参数，state 的默认值，可以给 null
- permalink 可选参数，涉及到更新是否需要更新页面

```jsx
function action(currentState, formData) {
	// ...
	return { message: '服务器错误', success: false }
}

function Page() {
	const [state, formAction, isPending] = useActionState(action, {});

	return (
		<form action={formAction}>
			{/* ... */}
			<p>{isPending ? '提交中' : state.message}</p>
		</from>
	)
}
```

### useOptimistic

允许异步操作时显示不同 state，网络挂起时使用乐观结果进行乐观更新，比如微信发送消息，先把消息塞到消息列表里，后面进行转圈圈表示发送中，真实发送结束则只需要去掉 loading）

```jsx
const [optimisticState, addOptimistic] = useOptimistic(state, updateFn);
```
- optimisticState
- addOptimistic 触发乐观更新时调用 的 dispatch 函数
- state 初始时和没有挂起时要返回的值
- updateFn(currentState, optimisticValue) 接受当前 state 和乐观值，纯函数

## Server Actions

在 Server Action 中，有两种方法让路由缓存失效
- 通过 revalidatePath 或 revalidateTag 重新验证数据
- 使用 cookies.set 或 cookies.delete 会使路由缓存失效
router.refresh 或重新部署也会使路由缓存失效