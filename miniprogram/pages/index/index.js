// index.js
Page({
  data: {
    userInfo: null,
    isLogin: false,
    categories: [],
    recentImages: [],
    categoryCount: {},
    isLoading: true
  },

  onLoad: function () {
    const app = getApp();

    // 强制清除登录状态，确保每次都需要重新登录
    app.clearLoginState();

    // 获取分类
    this.setData({
      categories: app.globalData.categories,
      isLogin: false,
      userInfo: null
    });

    // 检查登录状态
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        isLogin: true
      });
      this.loadData();
    } else {
      // 由于 app.js 中的 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          isLogin: true
        });
        this.loadData();
      };
    }
  },

  onShow: function () {
    if (this.data.isLogin) {
      this.loadData();
    }
  },

  // 加载数据
  loadData: function () {
    this.loadRecentImages();
    this.loadCategoryCount();
  },

  // 加载最近上传的图片
  loadRecentImages: function () {
    this.setData({ isLoading: true });

    wx.cloud.callFunction({
      name: 'imageService',
      data: {
        type: 'getImages',
        data: {
          page: 1,
          pageSize: 5
        }
      },
      success: res => {
        console.log('获取最近图片成功', res);
        if (res.result && res.result.success) {
          this.setData({
            recentImages: res.result.data.list
          });
        }
      },
      fail: err => {
        console.error('获取最近图片失败', err);
        wx.showToast({
          title: '获取图片失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 加载各分类的图片数量
  loadCategoryCount: function () {
    const app = getApp();
    const categories = app.globalData.categories;
    const categoryCount = {};

    // 初始化分类计数
    categories.forEach(category => {
      categoryCount[category.id] = 0;
    });

    // 获取每个分类的图片数量
    categories.forEach(category => {
      wx.cloud.callFunction({
        name: 'imageService',
        data: {
          type: 'getImagesByCategory',
          data: {
            category: category.id,
            page: 1,
            pageSize: 1
          }
        },
        success: res => {
          if (res.result && res.result.success) {
            categoryCount[category.id] = res.result.data.total;
            this.setData({ categoryCount });
          }
        },
        fail: err => {
          console.error('获取分类计数失败', err);
        }
      });
    });
  },

  // 点击图片
  onImageTap: function (e) {
    const { id, fileID } = e.detail;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 点击分类
  onCategoryTap: function (e) {
    const { id, name } = e.detail;
    wx.navigateTo({
      url: `/pages/album/album?category=${id}&title=${name}`
    });
  },

  // 搜索
  onSearchTap: function () {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  // 处理授权按钮回调（旧版本API，兼容性更好）
  onGetUserInfo: function (e) {
    console.log('授权回调', e);

    if (e.detail.userInfo) {
      // 用户同意授权
      // 修改用户名为"欢"，使用固定头像
      const userInfo = {
        nickName: "欢",
        avatarUrl: "/images/touxiang.jpg"
      };

      const app = getApp();
      app.globalData.userInfo = userInfo;
      app.globalData.isLogin = true;

      this.setData({
        userInfo: userInfo,
        isLogin: true
      });

      // 获取登录凭证
      wx.login({
        success: loginRes => {
          if (loginRes.code) {
            // 保存用户信息并上传头像
            wx.showLoading({
              title: '登录中...',
            });

            // 先获取openid
            wx.cloud.callFunction({
              name: 'login',
              success: loginResult => {
                const openid = loginResult.result.openid;
                console.log('获取openid成功:', openid);

                // 保存用户信息并上传头像
                wx.cloud.callFunction({
                  name: 'imageService',
                  data: {
                    type: 'saveUserInfo',
                    data: {
                      code: loginRes.code,
                      userInfo: userInfo,
                      avatarUrl: userInfo.avatarUrl,
                      openid: openid
                    }
                  },
                  success: result => {
                    console.log('用户信息保存成功', result);
                    if (result.result && result.result.success) {
                      // 如果头像上传成功，更新本地头像地址
                      let avatarFileID = "/images/touxiang.jpg"; // 使用固定头像
                      app.globalData.avatarFileID = avatarFileID;

                      // 保存openid
                      let resultOpenid = null;
                      if (result.result.data && result.result.data.openid) {
                        resultOpenid = result.result.data.openid;
                        app.globalData.openid = resultOpenid;
                      } else {
                        app.globalData.openid = openid;
                      }

                      // 保存登录状态到本地存储
                      app.saveLoginState(userInfo, avatarFileID, app.globalData.openid);

                      wx.showToast({
                        title: '登录成功',
                        icon: 'success'
                      });

                      // 延迟刷新页面
                      setTimeout(() => {
                        this.loadData();
                      }, 500);
                    }
                  },
                  fail: err => {
                    console.error('保存用户信息失败', err);
                    wx.showToast({
                      title: '登录失败',
                      icon: 'none'
                    });

                    // 登录失败时，重置登录状态
                    app.clearLoginState();
                    this.setData({
                      isLogin: false,
                      userInfo: null
                    });
                  },
                  complete: () => {
                    wx.hideLoading();
                  }
                });
              },
              fail: err => {
                console.error('获取openid失败', err);
                wx.showToast({
                  title: '登录失败',
                  icon: 'none'
                });
                wx.hideLoading();
                app.clearLoginState();
              }
            });
          } else {
            console.error('登录失败', loginRes);
            wx.showToast({
              title: '登录失败',
              icon: 'none'
            });
            app.clearLoginState();
          }
        },
        fail: err => {
          console.error('wx.login失败', err);
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          });
          app.clearLoginState();
        }
      });
    } else {
      // 用户拒绝授权
      console.log('用户拒绝授权');
      const app = getApp();
      app.clearLoginState();

      wx.showModal({
        title: '提示',
        content: '您需要授权才能使用小程序的全部功能',
        showCancel: false
      });
    }
  }
})
