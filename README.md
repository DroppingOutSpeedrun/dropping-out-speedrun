# 快进到退学
「快进到退学」是[cxOrz/chaoxing-sign-cli: 超星学习通签到：支持普通签到、拍照签到、手势签到、位置签到、二维码签到，支持自动监测、QQ机器人签到与推送。](https://github.com/cxOrz/chaoxing-sign-cli)项目的微信小程序版本实现。本项目直接与超星学习通服务端进行通信，无后端依赖，可去中心化部署。

## 部署教程
### 注册微信小程序开发者账号并配置
打开[小程序](https://mp.weixin.qq.com/wxopen/waregister?action=step1)，按照流程注册小程序开发者账号并实名。

在小程序管理后台内，选择左侧的「开发 - 开发管理」，再点击上方的「开发设置」。
![小程序管理后台-开发设置](/docs/images/小程序管理后台-开发设置.png)

点击服务器域名中的「开始配置」配置域名。
![小程序管理后台-服务器域名](/docs/images/小程序管理后台-服务器域名.png)

在「request合法域名」一栏中填入`https://mobilelearn.chaoxing.com;https://mooc1-1.chaoxing.com;https://pan-yz.chaoxing.com;https://passport2.chaoxing.com;`，点击「保存并提交」。
![配置服务器域名](/docs/images/配置服务器域名.png)

### 下载源码
点击下方任意一个打得开的链接下载最新版源码，然后解压到任意位置。

- [Bitbucket下载](https://bitbucket.org/dropping-out-speedrun/dropping-out-speedrun/downloads/?tab=tags)
点击zip
![Bitbucket下载](/docs/images/Bitbucket下载.png)

- [GitHub下载](https://github.com/DroppingOutSpeedrun/Dropping-Out-Speedrun/tags)
点击zip
![GitHub下载](/docs/images/GitHub下载.png)

### 使用微信开发者工具进行部署
打开[微信开发者工具下载地址与更新日志 | 微信开放文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)，找到「稳定版」一栏。一般下载「Windows 64」版本，新款苹果电脑下载「macOS ARM64」版本，旧款苹果电脑下载「macOS x64」版本，不是苹果电脑但打不开「Windows 64」版本则下载「Windows 32」版本。

安装好微信开发者工具之后打开，然后使用微信扫描二维码，并在手机上确认登入。
![登入微信开发者工具](/docs/images/登入微信开发者工具.jpg)

点击导入，选择源码所在位置，打开到能看到miniprogram等文件夹时，点击选择文件夹。
![导入源码](/docs/images/导入源码.jpg)

点击AppID下拉菜单，选择一个AppID。然后将后端服务设置为「不使用云服务」，其他设置保持默认即可。最后点击确定。
![导入小程序向导](/docs/images/导入小程序向导.jpg)

选择「信任并运行」
![信任并运行](/docs/images/信任并运行.jpg)

点击「预览」，然后使用微信扫描二维码即可运行
![信任并运行](/docs/images/信任并运行.jpg)

### 将小程序分享给他人使用
选择「上传」，然后再点击上传
![上传](/docs/images/上传.jpg)

在微信中搜索「小程序助手」，选择小程序
![选择小程序](/docs/images/选择小程序.jpg)

点击「成员管理」
![成员管理](/docs/images/成员管理.jpg)

点击「体验成员」，再点击「新增体验成员」
![添加资格](/docs/images/添加资格.jpg)

输入受邀者微信号，搜索受邀者
![搜索受邀者](/docs/images/搜索受邀者.jpg)

回到主页，选择「审核管理」
![审核管理](/docs/images/审核管理.jpg)

点击刚发布的开发版
![选择开发版](/docs/images/选择开发版.jpg)

点击「体验版二维码」
![体验版二维码](/docs/images/体验版二维码.jpg)

将此二维码分享给受邀者即可
![小程序二维码](/docs/images/小程序二维码.jpg)

## 签到类型支持
- 点击签到
- 拍照签到
- 手势签到
- 位置签到
- 二维码签到
- 签到码签到

## 信息安全与隐私
本小程序不会与超星学习通以外的服务器进行通信，只在本地储存用户信息，通过[微信内置的AES-128加密储存API](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorage.html#Object-object)对敏感信息进行加密储存。

## LICENSE
Dropping Out Speedrun
Copyright (C) 2023  Dropping Out Speedrun

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
