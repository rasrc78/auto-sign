# 自动签到脚本

解放你的双手，把时间花在更有意义的事情上。

> 经过一次**破坏性重写**，如果你使用的是*2026.3.15*之前的版本，请更新并重新阅读*README*文件。

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

在运行目录下创建`config.json`，配置项如下：

### 格式

- `general`：通用选项，适用于所有服务。
  - `[通用配置项]`
- `<服务名>`：可以在下面的列表中查看支持的服务。
  - `[服务配置项]`

### 通用配置项

- `general`
  - `logPath`：日志文件路径，值为`false`或不存在表示关闭日志文件输出。
  - `schedule`：每日签到时间，格式`hh:mm:ss`，默认`00:00:00`。

### 服务：再漫画

- `zaimanhua`：记得使用这个名字替换`<服务名>`。
    - `cookie`：用于登录的[Cookie](#获取-cookie)，一般填了这个就不用再填账号密码。
    - `username`：*用户名* 或 *登录账号*。
    - `password`：*明文密码* 或 *明文密码的小写MD5*。如果输入的是明文密码，会在首次运行时替换为哈希值。注意，如果明文密码格式和MD5相同，则不会进行自动替换。
    - `userAgent`：用户代理 (User agent)，默认为空。

### 示例

```json
{
  "general" : {
    "logPath": "./logs",
    "schedule": "11:45:14"
  },
  "zaimanhua": {
      "cookie": "token=XXXXX",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.53 Safari/537.36"
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
