## 基础概念

```typescript
# 在class 方法上加 @Controller 和 @Get @Post 等装饰器
# @Controller 处理路由和解析请求参数
@Controller('path')
export class UserController {
	constructor(private readonly userService: UserService) {}

	# 创建 post 请求的响应
	# @Body 获取请求体，一般会传递 json，通过 dto(Data Transfer Object) 接收
	@Post('create')
	create(@Body() createUserDto: CreateUserDto) {
		return this.userService.create(cresteUserDto);
	}

	# 创建 get 请求
	# @Param 获取 url 路径上的参数
	# @Query 获取 url 的 query 参数
	@Get(':id')
	findOne(@Param('id'), @Query('name')) {
		return this.userService.fineOne(id, name); 
	}
}
```

用 @Module 声明模块，每个模块都有 controllers 和 services
controller 里处理路由和解析请求参数
service 里做业务逻辑的具体实现（写 demo 的时候也会直接在 controller 写简单实现）
dto 封装请求参数
entities 封装对应数据库表的实体


## Next Cli
```sh
# npx 执行，可以保证是最新版本
npx @nextjs/cli new project_name

# 安装到全局，需要及时更新，但是本地创建项目更快
npm install -g @nestjs/cli
nest new project_name
npm update -g @nestjs/cli

# 修改项目之后自动更新
nest start --watch
# 输出 nestjs 版本、node 版本、npm 版本
nest info

# 生成代码
nest g resource person # 快速生成 person 模块的 crud 代码
```

## 项目

main.js 负责启动 Nest 的 ioc 容器，调用 useStaticAssets 来支持静态资源的请求