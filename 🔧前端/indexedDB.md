
[toc]

IndexedDB 允许存储大量数据，提供查找接口，还能建立索引，
就类型而言，其不属于关系型数据库（不支持 SQL 查询），更接近 NoSQL 数据库

- 键值对存储：所有类型都可以直接存储，主键独一无二
- 异步：操作是异步的，和 LocalStorage 的同步操作形成对比
- 支持事务：transaction 意味着一系列操作之中，只要有一步失败了，整个事务都会取消，数据库回滚到事务发生之前，不存在只改写一部分数据的情况
- 同源限制：网页只能访问自身域名下的数据库，不能跨域访问
- 存储空间大：一般来说不少于 250 MB，甚至没有上限
- 支持二进制存储： 不仅可以存储字符串、对象等，还可以存储二进制数据（ArrayBuffer 对象和 Blob 对象），也就是说文件也可以整个存储


## 基本概念

- 数据库: IDBDatabase，数据的容器，每个域名可以新建任意个数据库
	- IndexedDB 数据库有版本的概念，同一时刻只能有一个版本的数据库存在
	- **如果要修改数据库结构（新增删除Store、索引、主键），只能通过升级数据库版本完成（onupgradeneeded 事件中操作）**
- 对象仓库: IDBObjectStore，每个数据库包含若干个对象仓库，类似关系数据库的表格
	- 保存的每条数据记录类似于关系数据库的行，但只有主键和数据体两部分，主键是用来建立默认索引的，必须唯一，否则会报错，主键可以是数据记录里面的一个属性，也可以指定为一个递增的整数编号
- 索引: IDBIndex，为了加速数据的检索，可以在对象仓库里为不同的属性建立索引
- 事务: IDBTransaction，数据记录的读写、删改，都要通过事务来完成
	- 事务对象提供 `error` `abort` `complete` 三个事件用来监听操作结果
- 操作请求: IDBRequest
- 指针: IDBCursor
- 主键集合: IDBKeyRange

## 操作流程


### 创建数据库和表

```js
const version = 1;
const request = window.indexedDB.open('name', version);
request.error = (e) => console.log('open error', e);
request.success = (e) => console.log('成功，可以用 state 保存数据库', e.target.result === request.result);
request.onupgradeneeded = (e) => {
	const db = e.target.result;
	// 创建表格（对象仓库）只能在升级事件中，keyPath 是默认建立索引的属性
	// 主键也可以指定下一层对象的属性，如 name.firstName
	const objectStore = db.createObjectStore('person', {keyPath: 'id'});
	// 指定一个递增整数作为主键
	const userStore = db.createObjectStore('user', {autoIncrement: true})

	// 建立索引，参数为索引名称、索引所在属性、配置对象（说明该属性是否包含重复的值）
	userStore.createIndex('name', 'name', { unique: false });
	userStore.createIndex('email', 'emailId', { unidqu: true });
}
```


### 增删改查数据


- 先新建一个事务，新建时指定表格名称和操作模式（只读/读写）
- 新建事务后通过 IDBTransaction.obejctStore(name) 拿到对象仓库
- 通过对象仓库（表格）的 add 方法写入一条数据

```js
const add = (key) => {
	const request = db.transaction(['person'], 'readwrite')
		.objectStore('person')
		.add({ id: 1, name: 'ZS', age: 24, email: 'xxx@gmailcom'});

	request.onsuccess = (e) => {
		console.log('success', e);
	}

	request.onerror = (e) => console.log('write failed');
}
```

读取数据也要用事务, `objectStore.get(key)` 读取数据，参数是主键的值
```js
const onRead = () => {
	if (!db) return;
	const transaction = db.transaction(['person'], 'readonly');
	const objectStore = transaction.objectStore('person');
	const results = [];
	const keys = [1, 2, 3];

	for (let k in keys) {
		const request = objectStore.get(k);
		request.onsuccess = (e) => results.push(e.target.result);
	}

	transaction.oncomplete = (e) => console.log('success', results);
}
```

遍历表格所有数据，使用指针对象 IDBCursor
```js
function readAll() {
	const objectStore = db.transaction(['person'], 'readonly').objectStore('person');
	objectStore.openCursor().onsuccess = (e) => {
		const cursor = e.target.result;
		if (cursor) {
			console.log('id', cursor.key, 'value', cursor.value);
			cursor.continue();
		} else {
			console.log('没有更多数据了')
		}
	}
}
```
修改数据 `IDBObjectStore.put({id: 1, name: 'newName'})`
删除数据 `IDBObjectStore.delete(id)` 

使用索引，（建立表格的时候就应该读取建立索引）
```js
const store = db.transaction(['person']).objectStore('person');
const index = store.index('name');
const request = index.get('test');
const request2 = index.getAll('test');
request.onsuccess = (e) => console.log('success', e.target.result);
```


**如果多个事务同时进行呢**
 `readonly` 事务会使用数据库的快照，如果期间数据发生变化，事务可能会报错
 `readwrite` 事务
可以用现有库，实现了事务队列等操作

**分页查询大量数据**

**用索引和游标实现分页查询和正则/

```js
const store = db.transaction(['person']).objectStore('person');
const index = sotre.index('name');
const results: any[] = [];
let advanced = false;
let currentPage = 2;
const pageSize = 20;
// 使用索引的游标，遍历索引的值
const request = index.openCursor('test2');
// 分页查询到后面的也需要用 advance 跳过已经查过的数据
request.onsuccess = (e) => {
	const cursor = (e.target as IDBRequest).result;
	if (cursor) {
		if (!advanced && currentPage > 1) {
			cursor.advance((currentPage - 1) * pageSize);
			advanced = true;
			return; // 直接触发跳过之后的第一个值的遍历
		}
		results.push(cursor.value);
		// 不够一页则继续遍历
		if (results.length < pageSize) {
			cursor.continue();
		} else {
			console.log('pageNum', currentPage, 'length', results.length);
			console.log('results', results);
		}
	} else {
		console.log('没有更多数据了');
	}
}
```
