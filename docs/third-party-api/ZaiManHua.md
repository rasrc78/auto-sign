# 再漫画 API 收集

欢迎补充更多信息和纠错。

> 最后更新：**2026.03.08**

## 用户相关 API

### 获取用户信息

> https://account-api.zaimanhua.com/v1/userInfo/get

请求方式：GET

认证方式：Authorization 请求头

响应（JSON）：

- `errno`：**num** | 错误码
- `errmsg`：**str** | 错误提示
- `data`：**obj** | 数据部分
  - `userInfo`：**obj** | 用户信息部分
    - `uid`：**num**
    - `username`：**str**
    - `nickname`：**str**
    - `email`：**str**
    - `photo`： str | 可能为用户头像URL
    - `bind_photo`：**str** | 绑定手机号
    - `sex`：**str** | 性别
    - `token`：**str** | 用于验证的token
    - `setPasswd`：**num** | 是否已经设置密码
    - `bindWechat`：**bool**
    - `bindQq`：**bool**
    - `bindSina`：**bool**
    - `status`：**num** | 未知
    - `is_sign`：**bool** | 是否签到
    - `user_level`：**num** | 用户等级
    - `isInUserWhitelist`：**bool** | 是否在白名单
    - `isMember`：**bool** | 是否为会员
    - `memberExpireTime`：**str** | 会员到期时间，格式为*ISO 8601*

### 用户登录

> https://manhua.zaimanhua.com/lpi/v1/login/passwd

请求方式：POST

验证方式：用户名/手机号/邮箱 + 密码

请求体：

- `username`：**str**
- `passwd`：**str** | 明文密码的MD5哈希值，无盐值
- `captchaId`：**str** | 验证码UUID，在主页底部`<script>`标签返回的 JSON 里可以找到
- `captchaResult`：**str** | 固定为`%5B%5D`，作用不明
- `captchaCate`：**num** | 固定为`2`，可能为验证码类型

响应（JSON）：

- `errno`：**num** | 错误码
- `errmsg`：**str** | 错误提示
- `data`：**obj** | 数据部分
  - `user`：**obj** | 用户信息部分
    - 参考[获取用户信息](#获取用户信息)部分

## 活动相关 API

### 每日签到

> https://i.zaimanhua.com/lpi/v1/task/sign_in

请求方式：POST

认证方式：Authorization 请求头

响应（JSON）：

- `errno`：**num** | 错误码，重复签到为`1`，未登录为`99`
- `errmsg`：**str** | 错误提示
- `data`：**obj** | 数据部分
    - `userInfo`：**obj** | 用户信息部分
      - 参考[获取用户信息](#获取用户信息)部分

### 任务列表

> https://i.zaimanhua.com/lpi/v1/task/list

请求方式：GET

认证方式：Authorization 请求头

响应（JSON）：

- `errno`：**num** | 错误码，重复签到为`1`，未登录为`99`
- `errmsg`：**str** | 错误提示
- `data`：**obj** | 数据部分
  - `userCurrency`：obj | 用户积分信息
    - `credits`：num | 积分
    - `silver`
    - `stars`
  - `task`：**obj** | 任务列表
    - `dayTask`：**arr** | 每日任务信息
      - `[任务条目数据]`
    - `newUserTask`：**arr** | 新人任务
      - `[任务条目数据]`
    - `signInfo`：obj | 每日签到
      - `currentDay`：num | 当前签到天数
      - `currentSign`：bool | 签到状态
      - `list`：arr
        - `[任务条目数据]`
    - `sumSignTask`：obj | 累计签到
      - `continuousSignDays`：num | 连续签到天数
      - `sumSignDays`：num | 累计签到天数
      - `list`：arr
        - `[任务条目数据]`

**任务条目数据**：

- `id`：num | 任务ID
- `title`：str | 任务名称
- `desc`：str | 任务描述
- `currency`：obj | 任务奖励
  - `credits`：num | 积分
  - `silver`
  - `stars`
  - `vip`
- `status`：num | 完成状态，`1`为未完成，`3`为完成
- `icon`：str | 任务图标URL

## 杂项

### Authorization 请求头

格式：`Bearer ${token}`，注意中间有一个空格

示例：如果 `token=foobar`，那么 `Authorization=Bearer foobar`
