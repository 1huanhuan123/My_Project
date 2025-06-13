// pages/search/search.js
Page({
  data: {
    keyword: '',
    images: [],
    total: 0,
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
    isSearched: false
  },

  // 输入关键词
  onKeywordInput: function (e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  // 清空关键词
  clearKeyword: function () {
    this.setData({
      keyword: '',
      images: [],
      total: 0,
      isSearched: false
    });
  },

  // 搜索图片
  searchImages: function (refresh = true) {
    if (!this.data.keyword.trim()) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }

    if (this.data.isLoading) return;

    const page = refresh ? 1 : this.data.page;

    this.setData({
      isLoading: true,
      page,
      isSearched: true
    });

    wx.cloud.callFunction({
      name: 'imageService',
      data: {
        type: 'searchImages',
        data: {
          keyword: this.data.keyword,
          page,
          pageSize: this.data.pageSize
        }
      },
      success: res => {
        console.log('搜索图片成功', res);
        if (res.result && res.result.success) {
          const { list, total } = res.result.data;

          this.setData({
            images: refresh ? list : this.data.images.concat(list),
            total,
            hasMore: page * this.data.pageSize < total
          });
        }
      },
      fail: err => {
        console.error('搜索图片失败', err);
        wx.showToast({
          title: '搜索图片失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ isLoading: false });
        wx.stopPullDownRefresh();
      }
    });
  },

  // 回车搜索
  onKeywordConfirm: function () {
    this.searchImages();
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    if (this.data.isSearched) {
      this.searchImages(true);
    } else {
      wx.stopPullDownRefresh();
    }
  },

  // 上拉加载更多
  onReachBottom: function () {
    if (this.data.hasMore && this.data.isSearched) {
      this.setData({
        page: this.data.page + 1
      });
      this.searchImages(false);
    }
  },

  // 点击图片
  onImageTap: function (e) {
    const { id, fileID } = e.detail;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
})