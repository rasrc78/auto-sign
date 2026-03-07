# 自动签到脚本

解放你的双手，把时间花在更有意义的事情上。

> 练习项目，不保证稳定性。遇到错误可以提交 [Issues](https://github.com/Sh2-103/auto-signin/issues)。

## 环境准备

请确保系统已经安装以下环境：

- Node.js (>= 24.14.0)
- npm

若还没有安装，可以在[Node.js 官网](https://nodejs.org/zh-cn/download)获取。

## 快速开始

安装所需依赖：

```bash
npm install
```

运行脚本：

```bash
npm start

# 或者
node src/index.mjs
```

## 签到配置

在运行目录下创建`configs.json`，或者自行修改`src/index.mjs`中的`CONFIG_PATH`，以更改文件路径。

**格式**：

- `log`：开关主脚本的日志文件，默认`false`。
- `time`：每日签到时间，格式`hh:mm:ss`，默认`00:00:00`。
- `services`
  - 平台名：需要签到的平台名称，目前只支持`zaimanhua`。
    - `log`：参考上面的。
    - `username`：用户名，或登录账号。
    - `password`：明文密码或平台登录使用的哈希值。明文密码运行时替换为哈希值，当明文密码和哈希值格式一致时**不会进行替换**。如果你不是有意为之，可能会导致错误。
    - `cookie`：用于登录的Cookie，一般填了这个就不用再填账号密码。
    - `user-agent`：用户代理 (User agent)，默认为空。

**示例**：

```json
{
  "log": false,
  "time": "11:22:33",
  "services": {
    "zaimanhua": {
      "log": true,
      "cookie": "token=XXXXX",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.53 Safari/537.36"
    }
  }
}
```
