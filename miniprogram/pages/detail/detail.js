// pages/detail/detail.js
Page({
  data: {
    id: '',
    image: null,
    isLoading: true
  },

  onLoad: function (options) {
    const { id } = options;

    this.setData({ id });

    this.loadImageDetail();
  },

  // 加载图片详情
  loadImageDetail: function () {
    this.setData({ isLoading: true });

    wx.cloud.callFunction({
      name: 'imageService',
      data: {
        type: 'getImageDetail',
        data: {
          id: this.data.id
        }
      },
      success: res => {
        console.log('获取图片详情成功', res);
        if (res.result && res.result.success) {
          this.setData({
            image: res.result.data
          });
        }
      },
      fail: err => {
        console.error('获取图片详情失败', err);
        wx.showToast({
          title: '获取图片详情失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 预览图片
  previewImage: function () {
    wx.previewImage({
      urls: [this.data.image.fileID],
      current: this.data.image.fileID
    });
  },

  // 收藏图片
  toggleFavorite: function () {
    const { _id, isFavorite } = this.data.image;

    wx.cloud.callFunction({
      name: 'imageService',
      data: {
        type: 'toggleFavorite',
        data: {
          id: _id,
          isFavorite: !isFavorite
        }
      },
      success: res => {
        if (res.result && res.result.success) {
          // 更新本地收藏状态
          const image = {
            ...this.data.image,
            isFavorite: !isFavorite,
            favorites: isFavorite ? (this.data.image.favorites - 1) : (this.data.image.favorites + 1)
          };

          this.setData({ image });

          wx.showToast({
            title: !isFavorite ? '收藏成功' : '取消收藏',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: !isFavorite ? '收藏失败' : '取消收藏失败',
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
  },

  // 编辑图片
  editImage: function () {
    wx.navigateTo({
      url: `/pages/edit/edit?id=${this.data.id}`
    });
  },

  // 删除图片
  deleteImage: function () {
    const { _id, fileID } = this.data.image;

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
                id: _id,
                fileID
              }
            },
            success: res => {
              if (res.result && res.result.success) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });

                // 返回上一页
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
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

  // 分享图片
  onShareAppMessage: function () {
    if (!this.data.image) return;

    return {
      title: this.data.image.description || '分享一张精美图片',
      path: `/pages/detail/detail?id=${this.data.id}`,
      imageUrl: this.data.image.fileID
    };
  }
}) 