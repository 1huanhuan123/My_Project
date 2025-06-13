// pages/profile/profile.js
Page({
  data: {
    userInfo: null,
    isLogin: false,
    avatarFileID: null,
    favoriteImages: [],
    total: 0,
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
    activeTab: 'favorites'
  },

  onLoad: function () {
    const app = getApp();

    // 强制清除登录状态，确保每次都需要重新登录
    app.clearLoginState();

    this.setData({
      isLogin: false,
      userInfo: null,
      avatarFileID: null
    });
  },

  onShow: function () {
    const app = getApp();

    // 更新头像
    if (this.data.isLogin && app.globalData.avatarFileID) {
      this.setData({
        avatarFileID: app.globalData.avatarFileID
      });
    }

    if (this.data.isLogin) {
      this.loadFavorites();
    }
  },

  // 加载收藏的图片
  loadFavorites: function (refresh = true) {
    if (this.data.isLoading) return;

    const page = refresh ? 1 : this.data.page;

    this.setData({
      isLoading: true,
      page
    });

    wx.cloud.callFunction({
      name: 'imageService',
      data: {
        type: 'getFavorites',
        data: {
          page,
          pageSize: this.data.pageSize
        }
      },
      success: res => {
        console.log('获取收藏图片成功', res);
        if (res.result && res.result.success) {
          const { list, total } = res.result.data;

          this.setData({
            favoriteImages: refresh ? list : this.data.favoriteImages.concat(list),
            total,
            hasMore: page * this.data.pageSize < total
          });
        }
      },
      fail: err => {
        console.error('获取收藏图片失败', err);
        wx.showToast({
          title: '获取收藏图片失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ isLoading: false });
        wx.stopPullDownRefresh();
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    if (this.data.isLogin) {
      this.loadFavorites(true);
    } else {
      wx.stopPullDownRefresh();
    }
  },

  // 上拉加载更多
  onReachBottom: function () {
    if (this.data.hasMore && this.data.isLogin && this.data.activeTab === 'favorites') {
      this.setData({
        page: this.data.page + 1
      });
      this.loadFavorites(false);
    }
  },

  // 切换标签页
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // 点击图片
  onImageTap: function (e) {
    const { id, fileID } = e.detail;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
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
        isLogin: true,
        avatarFileID: "/images/touxiang.jpg" // 直接使用本地图片路径
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

                      // 更新页面显示的头像
                      this.setData({
                        avatarFileID: avatarFileID
                      });

                      wx.showToast({
                        title: '登录成功',
                        icon: 'success'
                      });

                      // 延迟刷新页面
                      setTimeout(() => {
                        this.loadFavorites();
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
                      userInfo: null,
                      avatarFileID: null
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
  },

  // 关于我们
  onAboutTap: function () {
    wx.showModal({
      title: '关于我的图库',
      content: '我的图库是一款个人图片管理工具，帮助您方便地管理和分享您的照片。\n\n版本：1.0.0\n开发者：我的图库团队',
      showCancel: false
    });
  },

  // 清除缓存
  onClearCacheTap: function () {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除缓存吗？',
      success: res => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              wx.showToast({
                title: '缓存已清除',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  }
}) 