// pages/category/category.js
Page({
  data: {
    categories: [],
    categoryCount: {},
    isLoading: true
  },

  onLoad: function () {
    const app = getApp();

    // 获取分类
    this.setData({
      categories: app.globalData.categories
    });

    this.loadCategoryCount();
  },

  onShow: function () {
    this.loadCategoryCount();
  },

  // 加载各分类的图片数量
  loadCategoryCount: function () {
    this.setData({ isLoading: true });

    const app = getApp();
    const categories = app.globalData.categories;
    const categoryCount = {};

    // 初始化分类计数
    categories.forEach(category => {
      categoryCount[category.id] = 0;
    });

    let completedCount = 0;

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
        },
        complete: () => {
          completedCount++;
          if (completedCount === categories.length) {
            this.setData({ isLoading: false });
          }
        }
      });
    });
  },

  // 点击分类
  onCategoryTap: function (e) {
    const { id, name } = e.detail;
    wx.navigateTo({
      url: `/pages/album/album?category=${id}&title=${name}`
    });
  }
}) 