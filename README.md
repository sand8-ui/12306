# Mini-12306

基于 Node.js + React 的简化版 12306 实验项目，实现以下最小闭环功能：

- 旅客注册
- 用户登录
- 查询车次
- 购票
- 退票
- 改签
- 管理员系统设置

## 目录结构

- `server/`：Node.js 后端
- `client/`：React 前端
- `scripts/`：启动脚本

## 运行方式

1. 启动后端：

```powershell
node .\server\src\server.js
```

2. 启动前端静态服务：

```powershell
node .\scripts\serve-client.js
```

3. 浏览器访问：

```text
http://localhost:5173
```

## 演示账号

- 旅客：`13800000001 / password123`
- 管理员：`admin / admin123`

## 说明

当前实现不依赖额外 npm 包，适合直接在实验环境中演示。数据存放在内存中，重启后会恢复为种子数据。

## Git 实验说明

当前目录 `project/` 可作为独立源码仓库使用，实验时建议只管理源码与运行说明，不将实验报告和截图纳入同一仓库。
