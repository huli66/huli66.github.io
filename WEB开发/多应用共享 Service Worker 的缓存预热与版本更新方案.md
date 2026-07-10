

## 1. 背景

当前系统存在以下特点：

- 一个主域名下存在多个独立项目
    
- 每个项目通过不同 Path 区分，例如：
    

```
example.com/hr/
example.com/finance/
example.com/report/
```

- 每个项目独立构建和发布
    
- 所有项目共享同一个 Service Worker
    
- 希望预加载热门项目资源，提高首次访问速度
    
- 当项目重新部署时，需要主动通知客户端更新缓存，确保用户下次打开时使用最新版本
    

目标：

1. 支持多项目资源统一管理
    
2. 支持 Service Worker 主动感知项目更新
    
3. 支持热门项目缓存预热
    
4. 支持发布后快速通知在线用户更新
    
5. 避免旧缓存导致版本不一致
    

---

# 2. 整体架构

整体流程：

```
                 CI/CD Jenkins

                       |
                       |
              构建多个子应用

                       |
                       |
              生成应用 Manifest

                       |
                       |
              发布静态资源/CDN

                       |
          ---------------------------
          |                         |
      WebSocket通知             定时检查
          |                         |
          |                         |
          v                         v

                 Browser Page

                       |
              postMessage

                       |
                       v

              Service Worker

                       |
        --------------------------------
        |              |               |
      app-a          app-b           app-c

      cache          cache           cache
```

---

# 3. 核心设计原则

## 3.1 Manifest 作为版本中心

Service Worker 不应该扫描服务器目录判断资源变化。

推荐：

> 发布系统生成 manifest，Service Worker 消费 manifest。

原因：

### 不推荐运行时扫描目录

例如：

```
GET /apps-manifest.json
```

服务器实时扫描：

```
/app-a/assets
/app-b/assets
```

存在问题：

- 每次请求产生额外开销
    
- 多节点部署可能返回不同结果
    
- 无法表达业务信息
    
- 无法控制热门项目
    

因此采用：

```
构建阶段生成 manifest
发布阶段同步 manifest
运行阶段读取 manifest
```

---

# 4. Manifest 设计

示例：

```json
{
  "generatedAt": "2026-07-10T12:00:00Z",

  "apps": [
    {
      "id": "hr",

      "path": "/hr/",

      "version": "20260710.3",

      "preload": true,

      "assets": [
        "/hr/assets/index.a82d.js",
        "/hr/assets/vendor.91ff.js",
        "/hr/assets/style.22aa.css"
      ]
    }
  ]
}
```

字段说明：

|字段|说明|
|---|---|
|id|项目唯一标识|
|path|访问路径|
|version|项目版本|
|preload|是否预加载|
|assets|需要缓存的静态资源|

---

# 5. Jenkins 发布流程

## 5.1 构建流程

```
代码提交

    |

Jenkins Pipeline

    |

npm build

    |

生成 dist

    |

执行 Node 脚本

    |

生成 manifest.json

    |

发布
```

---

## 5.2 Jenkins 执行 Node 脚本

目录：

```
project

├── dist

├── scripts

│   └── generate-manifest.js

├── package.json

└── Jenkinsfile
```

Jenkinsfile：

```groovy
pipeline {

    agent any


    stages {

        stage('Build') {

            steps {

                sh 'npm install'

                sh 'npm run build'

            }

        }


        stage('Generate Manifest') {

            steps {

                sh 'node scripts/generate-manifest.js'

            }

        }


        stage('Deploy') {

            steps {

                sh './deploy.sh'

            }

        }

    }
}
```

---

# 6. Manifest 生成策略

生成脚本负责：

- 扫描 build 输出目录
    
- 收集 js/css 文件
    
- 生成版本号
    
- 写入 manifest
    

例如：

```
dist

├── assets

│   ├── main.abc123.js

│   ├── vendor.xyz456.js

│   └── style.aaa.css


生成：

apps-manifest.json

```

---

# 7. Service Worker 更新流程

## 7.1 发布通知

项目发布完成：

```
app-a v101

        |

        v

通知服务

        |

        v

WebSocket 推送

```

消息：

```json
{
  "type": "APP_UPDATED",
  "app": "hr",
  "version": "102"
}
```

---

## 7.2 页面接收通知

页面：

```javascript
socket.onmessage = async(event)=>{

    const msg = JSON.parse(event.data);


    if(msg.type==="APP_UPDATED"){

        const registration =
            await navigator.serviceWorker.getRegistration();


        await registration.update();

    }

}
```

注意：

WebSocket 不直接维护 Service Worker。

原因：

- Service Worker 生命周期短
    
- 浏览器可能冻结 Service Worker
    
- 长连接不可靠
    

正确关系：

```
WebSocket

    |

    v

Page

    |

postMessage

    |

    v

Service Worker

```

---

# 8. Service Worker 缓存更新

Service Worker 收到更新：

```
fetch apps-manifest.json

        |

        v

比较版本

        |

        v

发现资源变化

        |

        v

下载新资源

        |

        v

更新 Cache
```

---

# 9. 缓存策略

## 9.1 HTML

不要长期缓存：

```
index.html
```

原因：

旧 HTML 可能引用旧 JS。

策略：

```
Network First
```

---

## 9.2 JS/CSS

使用 hash 文件：

例如：

```
main.abc123.js

main.def456.js
```

策略：

```
Cache First
```

原因：

文件名变化代表版本变化。

---

## 9.3 热门项目资源预加载

Manifest：

```json
{
 "id":"hr",
 "preload":true
}
```

Service Worker：

```
读取 manifest

      |

找到热门项目

      |

下载 assets

      |

写入 cache
```

用户访问：

```
/hr/
```

资源已经存在：

```
main.js
vendor.js
style.css
```

---

# 10. 缓存隔离设计

不要：

```
cache-v1
```

推荐：

```
app-cache

├── hr-v102

├── finance-v88

└── report-v51
```

好处：

- 单项目更新不会影响其他项目
    
- 清理范围明确
    
- 支持灰度发布
    

---

# 11. 定时检查机制

WebSocket 作为实时通知。

同时增加兜底：

```
Service Worker

每 30 分钟

检查 manifest
```

防止：

- websocket 断开
    
- 用户长时间在线
    
- 发布通知失败
    

---

# 12. 推荐最终方案

## 发布侧

```
Jenkins

    |

build

    |

generate manifest

    |

deploy

    |

notify update

```

## 客户端

```
收到通知

    |

registration.update()

    |

Service Worker 更新

    |

读取 manifest

    |

更新热门项目缓存

    |

controllerchange

    |

刷新页面
```

---

# 13. 最终结论

推荐采用：

- Jenkins 构建后生成 manifest
    
- Manifest 作为所有项目版本事实来源
    
- WebSocket 只负责通知客户端
    
- 页面负责唤醒 Service Worker
    
- Service Worker 根据 manifest 更新缓存
    
- 热门项目通过 preload 标记提前缓存
    
- HTML 不缓存，静态资源 hash 缓存
    

该方案适用于：

- 企业门户
    
- 微前端平台
    
- 多租户后台系统
    
- OA / ERP 系统
    
- 多业务 Web 应用中心
    

具备较好的扩展性和版本可控性。