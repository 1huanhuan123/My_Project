// pages/album/album.js
Page({
  data: {
    category: '',
    title: '相册',
    images: [],
    total: 0,
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false
  },

  onLoad: function (options) {
    const { category, title } = options;

    this.setData({
      category,
      title: title || '相册'
    });

    wx.setNavigationBarTitle({
      title: this.data.title
    });

    this.loadImages(true);
  },

  // 加载图片
  loadImages: function (refresh = false) {
    if (this.data.isLoading) return;

    const page = refresh ? 1 : this.data.page;

    this.setData({
      isLoading: true,
      page
    });

    wx.cloud.callFunction({
      name: 'imageService',
      data: {
        type: 'getImagesByCategory',
        data: {
          category: this.data.category,
          page,
          pageSize: this.data.pageSize
        }
      },
      success: res => {
        console.log('获取图片成功', res);
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
        console.error('获取图片失败', err);
        wx.showToast({
          title: '获取图片失败',
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
    this.loadImages(true);
  },

  // 上拉加载更多
  onReachBottom: function () {
    if (this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      });
      this.loadImages();
    }
  },

  // 点击图片
  onImageTap: function (e) {
    const { id, fileID } = e.detail;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 删除图片
  onDeleteTap: function (e) {
    const { id, fileID } = e.detail;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      success: res => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'imageService',
            data: {
              type: 'deleteImage',
              data: {
                id,
                fileID
              }
            },
            success: res => {
              if (res.result && res.result.success) {
                // 删除成功，刷新列表
                this.loadImages(true);
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: err => {
              console.error('删除失败', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 编辑图片
  onEditTap: function (e) {
    const { id } = e.detail;
    wx.navigateTo({
      url: `/pages/edit/edit?id=${id}`
    });
  },

  // 收藏图片
  onFavoriteTap: function (e) {
    const { id, isFavorite } = e.detail;

    wx.cloud.callFunction({
      name: 'imageService',
      data: {
        type: 'toggleFavorite',
        data: {
          id,
          isFavorite
        }
      },
      success: res => {
        if (res.result && res.result.success) {
          // 更新本地收藏状态
          const images = this.data.images.map(image => {
            if (image._id === id) {
              return {
                ...image,
                isFavorite,
                favorites: isFavorite ? (image.favorites + 1) : (image.favorites - 1)
              };
            }
            return image;
          });

          this.setData({ images });

          wx.showToast({
            title: isFavorite ? '收藏成功' : '取消收藏',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: isFavorite ? '收藏失败' : '取消收藏失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('操作失败', err);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    });
  }
}) 