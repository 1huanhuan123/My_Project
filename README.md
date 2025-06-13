# 我的图库小程序

一个基于微信小程序云开发的图片管理应用，支持图片上传、分类、搜索和查看等功能。

## 项目简介

"我的图库"是一个帮助用户轻松管理个人照片的微信小程序。通过云开发技术，用户可以将照片上传至云端存储，进行分类整理，并随时随地查看和分享自己的照片。

## 主要功能

- **照片上传**：支持从相册选取或拍摄新照片上传
- **分类管理**：对照片进行自定义分类整理
- **相册浏览**：多种视图模式查看照片
- **照片搜索**：根据标题、日期等条件搜索照片
- **个人中心**：查看个人上传统计和管理用户信息

## 技术栈

- 微信小程序原生开发
- 云开发（数据库、存储、云函数）
- 微信开放能力（用户信息、地理位置等）

## 项目结构

```
我的图库/
├── cloudfunctions/        # 云函数目录
│   ├── imageService/      # 图片处理相关云函数
│   └── login/             # 用户登录云函数
├── miniprogram/           # 小程序前端代码
│   ├── components/        # 自定义组件
│   ├── images/            # 静态图片资源
│   ├── pages/             # 页面文件
│   │   ├── index/         # 首页
│   │   ├── category/      # 分类页
│   │   ├── upload/        # 上传页
│   │   ├── album/         # 相册页
│   │   ├── detail/        # 详情页
│   │   ├── search/        # 搜索页
│   │   └── profile/       # 个人中心页
│   ├── app.js             # 小程序入口文件
│   ├── app.json           # 小程序全局配置
│   └── app.wxss           # 小程序全局样式
└── uploadCloudFunction.sh # 云函数上传脚本
```

## 快速开始

### 前提条件

- 安装最新版本的[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册[微信小程序账号](https://mp.weixin.qq.com/)并获取AppID
- 开通云开发服务

### 安装步骤

1. 克隆仓库到本地：
   ```bash
   git clone https://github.com/你的用户名/我的图库.git
   ```

2. 使用微信开发者工具打开项目

3. 在`project.config.json`中配置你的AppID

4. 云开发环境初始化：
   - 创建云环境
   - 配置云环境ID到`app.js`中
   - 初始化云数据库集合：`images`、`categories`、`users`

5. 部署云函数：
   ```bash
   # Linux/Mac
   chmod +x uploadCloudFunction.sh
   ./uploadCloudFunction.sh
   
   # Windows
   cd cloudfunctions/imageService
   npm install
   wx cloud functions deploy
   
   cd ../login
   npm install
   wx cloud functions deploy
   ```

6. 编译和预览小程序

## 常见问题解决

### 1. 云函数上传问题

如果在上传云函数时遇到 "Client network socket disconnected before secure TLS connection was established" 错误，可尝试以下解决方法：

- 检查网络连接是否稳定
- 关闭代理软件或VPN
- 使用命令行上传云函数:
  ```bash
  # 使用提供的脚本
  ./uploadCloudFunction.sh
  
  # 或手动上传
  cd cloudfunctions/imageService
  npm install
  wx cloud functions deploy
  ```

### 2. tabBar图标缺失问题

确保以下图标文件存在于 `miniprogram/images/` 目录下：
- home.png
- home_selected.png
- category.png
- category_selected.png
- upload.png
- upload_selected.png
- profile.png
- profile_selected.png

若图标缺失，可自行设计或从网络下载适合的图标放入此目录。

### 3. 文件编码问题

如果遇到文件编码问题（如 detail.json 不是UTF-8格式），可以：
- 使用文本编辑器（如VS Code）重新创建文件并保存为UTF-8格式
- 或使用编辑器的"以编码保存"功能将文件转换为UTF-8编码

### 4. WXML语法错误

在 WXML 文件中（如 upload.wxml）避免使用复杂表达式（如箭头函数）：

```xml
<!-- 错误示例 -->
<picker bindchange="{{(e) => handleChange(e)}}">

<!-- 正确示例 -->
<picker bindchange="handleChange">
```

复杂逻辑应放在 JS 文件中处理。

### 5. 图片资源加载错误

确保引用的图片资源文件存在于对应目录中，特别是：
- `/images/login.png`
- `/images/empty.png`

可能需要创建或复制这些图像到正确的目录。

## 贡献指南

欢迎对项目进行贡献！以下是参与项目的步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 贡献规范

- 遵循微信小程序开发规范
- 保持代码风格一致
- 添加必要的注释
- 编写测试（如适用）
- 更新文档反映您的更改

### 开发环境设置

1. 安装最新版本的微信开发者工具
2. Node.js 12.0+ 环境
3. npm 或 yarn 包管理工具

## 注意事项

- 本项目使用云开发，需要开通小程序云开发服务
- 图片上传大小限制为10MB
- 所有数据都保存在云端，确保网络连接良好





