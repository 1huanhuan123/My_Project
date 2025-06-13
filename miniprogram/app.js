// app.js
App({
  onLaunch: function () {
    this.globalData = {
      // env 参数说明：
      //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
      //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
      //   如不填则使用默认环境（第一个创建的环境）
      env: "cloudbase-1g9m34oq265a5d95",
      userInfo: null,
      isLogin: false,
      avatarFileID: null,
      openid: null,
      categories: [
        { id: 'scenery', name: '风景', icon: 'landscape' },
        { id: 'food', name: '美食', icon: 'food' },
        { id: 'travel', name: '旅行', icon: 'travel' },
        { id: 'life', name: '生活', icon: 'life' },
        { id: 'work', name: '工作', icon: 'work' },
        { id: 'other', name: '其他', icon: 'other' }
      ]
    };

    // 强制清除登录状态，确保每次启动都需要重新登录
    this.clearLoginState();

    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }

    // 检查用户授权设置
    wx.getSetting({
      success: res => {
        console.log('获取用户授权设置:', res);
        if (res.authSetting['scope.userInfo']) {
          console.log('用户已授权获取用户信息');
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
          wx.getUserInfo({
            success: res => {
              console.log('获取用户信息成功:', res);
              // 修改用户名为"欢"，使用固定头像
              const userInfo = {
                nickName: "欢",
                avatarUrl: "/images/touxiang.jpg"
              };
              this.globalData.userInfo = userInfo;
              this.globalData.isLogin = true;
              this.globalData.avatarFileID = "/images/touxiang.jpg";

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback({ userInfo: userInfo });
              }
            },
            fail: err => {
              console.error('获取用户信息失败:', err);
            }
          });
        } else {
          console.log('用户未授权获取用户信息');
        }
      },
      fail: err => {
        console.error('获取用户授权设置失败:', err);
      }
    });
  },

  // 获取用户openid
  getUserOpenId: function (callback) {
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        console.log('云函数获取到的openid: ', res.result.openid);
        callback(res.result.openid);
      },
      fail: err => {
        console.error('云函数调用失败', err);
      }
    });
  },

  // 清除登录状态
  clearLoginState: function () {
    console.log('清除登录状态');
    this.globalData.userInfo = null;
    this.globalData.isLogin = false;
    this.globalData.avatarFileID = null;
    this.globalData.openid = null;

    // 清除本地存储的登录信息
    try {
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('avatarFileID');
      wx.removeStorageSync('openid');
    } catch (e) {
      console.error('清除本地存储失败', e);
    }
  },

  // 保存登录状态到本地存储
  saveLoginState: function (userInfo, avatarFileID, openid) {
    console.log('保存登录状态', userInfo, avatarFileID, openid);
    try {
      wx.setStorageSync('userInfo', userInfo);
      if (avatarFileID) {
        wx.setStorageSync('avatarFileID', avatarFileID);
      }
      if (openid) {
        wx.setStorageSync('openid', openid);
      }
    } catch (e) {
      console.error('保存登录状态失败', e);
    }
  }
});
