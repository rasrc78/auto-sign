# 自动签到脚本

解放你的双手，把时间花在更有意义的事情上。

## 支持列表

| 名称 | 域名 | 认证方式 |
| ---- | ---- | --------|
| **再漫画** | zaimanhua.com | 密码、Cookie |
| **百合会** | bbs.yamibo.com | Cookie |
| **Anime字幕论坛** | bbs.acgrip.com | Cookie（未来可能支持密码） |
| **天使动漫（计划）** | tsdm39.com | Cookie |

## 环境准备

请确保系统已经安装以下环境：

- Node.js (>= v18.20.8)
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

> 不建议把签到时间设置太早，有的平台会取消凌晨的签到奖励。

### 服务：再漫画（Beta）

- `zaimanhua`：记得使用这个名字替换`<服务名>`。
    - `cookie`：用于登录的[Cookie](#获取-cookie)，一般填了这个就不用再填账号密码。
    - `username`：*用户名* 或 *登录账号*。
    - `password`：*明文密码* 或 *明文密码的小写MD5*。如果输入的是明文密码，会在首次运行时替换为哈希值。注意，如果明文密码格式和MD5相同，则不会进行自动替换。
    - `userAgent`：用户代理 (User agent)，默认为空。

### 服务：百合会（Beta）

- `yamibo`
    - `cookie`：用于登录的[Cookie](#获取-cookie)。账密登录需要验证码，暂时没考虑添加。
    - `userAgent`：用户代理 (User agent)，默认为空。

### 服务：Anime 字幕论坛（Beta）

- `animesubs`
  - `cookie`
  - `userAgent`
  - `signOptions`：签到选项。
    - `mood`：签到心情，可用选项因网站而异，默认为`kx`（开心）。在*网站签到页*能看到心情名称，一般取*小写的拼音首字母*作为值，单字心情则取*完整拼音*，如`shuai`（衰）和`yl`（慵懒）。
    - `mode`: 今日最想说模式，默认为`3`。可用选项有`1`（自己填写），`2`（快速选择），`3`（不想填写）。
    - `message`：签到文字，`mode`为`1`时必须填写，默认为空字符串。
    - `fastReply`：快速选择的签到文字，`mode`为`2`时生效，默认为`0`。在网站签到页，每往下面一个选项，值+1，通常可用值为`0`-`7`。

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
