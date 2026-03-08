# 自动签到脚本

解放你的双手，把时间花在更有意义的事情上。

> 练习项目，不保证稳定性。遇到错误可以提交 [Issues](https://github.com/Sh2-103/auto-signin/issues)。

## 环境准备

请确保系统已经安装以下环境：

- Node.js (建议 >= 24.14.0)
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

- `log`：主脚本的日志文件开关，默认`false`。
- `time`：每日签到时间，格式`hh:mm:ss`，默认`00:00:00`。
- `services`
  - 平台名：需要签到的平台名称，同平台可共存多个任务。目前只支持`zaimanhua`。
    - `log`：每个任务的日志开关。
    - `username`：用户名，或登录账号。
    - `password`：明文密码或平台登录使用的哈希值。明文密码会自动替换为哈希值，当明文密码和哈希值格式一致时**不会进行替换**。如果你不是有意为之，可能会导致错误。
    - `cookie`：用于登录的[Cookie](#获取-cookie)，一般填了这个就不用再填账号密码。
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

## 获取 Cookie

接受的 Cookie 格式为：`name1=foo;name2=bar`。

这里提供两种获取方式，**开发者工具**和**浏览器插件**。

### 通过开发者工具获取 Cookie

打开需要获取 Cookie 的网站，按 `F12` 或 `Ctrl + Shift + I` 打开开发者工具。进入 `Console` 或 `控制台` 选项卡，并输入以下代码回车。

获取全部 Cookie：

```js
document.cookie
```

获取指定 Cookie:

```js
document.cookie.split(';').filter(cookie=>cookie.startsWith('token='))[0]
```

把其中的`token`换成目标 Cookie 的名称。

获取到的 Cookie，可以直接填入配置文件中的`cookie`字段。注意把首尾的**单引号替换为双引号**。

### 通过浏览器插件获取 Cookie

下载并安装[Cookie-Editor](https://cookie-editor.com/)，并授予权限。

点击插件右下角的`Export`按钮，选择导出为`Header String`，Cookie会复制到剪贴板。

## 第三方 API 收集

此项目用到的一些第三方平台API。

- [再漫画](./docs/third-party-api/ZaiManHua.md)
