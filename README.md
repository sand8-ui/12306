# Mini-12306

基于 Node.js + React 的简化版 12306 实验项目，实现以下最小闭环功能：

- 旅客实名注册（含身份证号、银行卡号模拟校验）
- 用户登录
- 查询车次
- 在线购票（模拟支付网关）
- 退票（按管理员设置计算手续费）
- 改签（按管理员设置计算手续费）
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

系统中额外模拟了两类第三方服务，便于和实验报告书要求对齐：

- `mock-citizen-service`：用于实名注册时的身份证号/银行卡号校验
- `mock-bank-gateway`：用于购票和改签时的在线支付演示

管理员设置中的 `refundRate` 与 `changeRate` 会在退票和改签流程中真正参与手续费计算，订单详情会显示支付金额、手续费和实际退款金额。

## Git 实验说明

当前目录 `project/` 可作为独立源码仓库使用，实验时建议只管理源码与运行说明，不将实验报告和截图纳入同一仓库。

当前仓库默认分支为 `main`，适合继续演示 `git status`、`git log`、`git ls-files` 等基础操作。
