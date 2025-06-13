// pages/upload/upload.js
Page({
  data: {
    tempFilePath: '',
    categories: [],
    description: '',
    tags: '',
    location: '',
    selectedCategory: '',
    selectedCategoryName: '',
    isUploading: false,
    retryCount: 0,
    maxRetries: 3
  },

  onLoad: function () {
    const app = getApp();

    // 获取分类
    const categories = app.globalData.categories;
    this.setData({
      categories: categories,
      selectedCategory: categories[0].id,
      selectedCategoryName: categories[0].name
    });
  },

  // 选择图片
  chooseImage: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'], // 使用压缩图片，减少上传数据量
      success: res => {
        this.setData({
          tempFilePath: res.tempFiles[0].tempFilePath,
          retryCount: 0 // 重置重试计数
        });
      }
    });
  },

  // 输入描述
  onDescriptionInput: function (e) {
    this.setData({
      description: e.detail.value
    });
  },

  // 输入标签
  onTagsInput: function (e) {
    this.setData({
      tags: e.detail.value
    });
  },

  // 输入位置
  onLocationInput: function (e) {
    this.setData({
      location: e.detail.value
    });
  },

  // 选择分类
  onCategoryChange: function (e) {
    const categoryIndex = e.detail.value;
    const selectedCategory = this.data.categories[categoryIndex].id;
    const selectedCategoryName = this.data.categories[categoryIndex].name;

    this.setData({
      selectedCategory: selectedCategory,
      selectedCategoryName: selectedCategoryName
    });
  },

  // 压缩图片
  compressImage: function (filePath) {
    return new Promise((resolve, reject) => {
      wx.compressImage({
        src: filePath,
        quality: 80, // 压缩质量
        success: res => {
          console.log('图片压缩成功', res);
          resolve(res.tempFilePath);
        },
        fail: err => {
          console.error('图片压缩失败', err);
          // 如果压缩失败，仍然使用原图
          resolve(filePath);
        }
      });
    });
  },

  // 上传图片
  uploadImage: async function () {
    if (!this.data.tempFilePath) {
      wx.showToast({
        title: '请选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({ isUploading: true });

    try {
      // 先压缩图片
      wx.showLoading({
        title: '处理图片中...',
        mask: true
      });

      const compressedFilePath = await this.compressImage(this.data.tempFilePath);

      // 文件名使用时间戳 + 随机数
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 1000);
      const extension = compressedFilePath.match(/\.(\w+)$/)[1] || 'jpg';
      const cloudPath = `images/${timestamp}_${random}.${extension}`;

      wx.showLoading({
        title: '上传中...',
        mask: true
      });

      // 上传图片到云存储
      wx.cloud.uploadFile({
        cloudPath,
        filePath: compressedFilePath,
        timeout: 60000, // 设置60秒超时
        success: res => {
          console.log('上传成功', res);
          const fileID = res.fileID;

          // 处理标签
          const tags = this.data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

          wx.showLoading({
            title: '保存信息...',
            mask: true
          });

          // 将图片信息保存到数据库
          wx.cloud.callFunction({
            name: 'imageService',
            data: {
              type: 'addImage',
              data: {
                fileID,
                category: this.data.selectedCategory,
                description: this.data.description,
                tags,
                location: this.data.location
              }
            },
            success: res => {
              console.log('添加图片记录成功', res);
              if (res.result && res.result.success) {
                wx.hideLoading();
                wx.showToast({
                  title: '上传成功',
                  icon: 'success'
                });

                // 重置表单
                this.setData({
                  tempFilePath: '',
                  description: '',
                  tags: '',
                  location: '',
                  selectedCategory: this.data.categories[0].id,
                  selectedCategoryName: this.data.categories[0].name,
                  retryCount: 0
                });
              } else {
                wx.hideLoading();
                wx.showToast({
                  title: '保存图片信息失败',
                  icon: 'none'
                });
              }
            },
            fail: err => {
              console.error('保存图片信息失败', err);
              wx.hideLoading();
              wx.showToast({
                title: '保存图片信息失败',
                icon: 'none'
              });
            },
            complete: () => {
              this.setData({ isUploading: false });
            }
          });
        },
        fail: err => {
          console.error('上传失败', err);
          wx.hideLoading();

          // 实现重试机制
          if (this.data.retryCount < this.data.maxRetries) {
            const retryCount = this.data.retryCount + 1;
            this.setData({
              retryCount: retryCount,
              isUploading: false
            });

            wx.showModal({
              title: '上传失败',
              content: `网络连接不稳定，是否重试？(${retryCount}/${this.data.maxRetries})`,
              confirmText: '重试',
              cancelText: '取消',
              success: res => {
                if (res.confirm) {
                  // 延迟一秒后重试
                  setTimeout(() => {
                    this.uploadImage();
                  }, 1000);
                }
              }
            });
          } else {
            wx.showToast({
              title: '上传失败，请检查网络',
              icon: 'none',
              duration: 2000
            });
            this.setData({
              isUploading: false,
              retryCount: 0
            });
          }
        }
      });
    } catch (error) {
      console.error('处理图片失败', error);
      wx.hideLoading();
      wx.showToast({
        title: '处理图片失败',
        icon: 'none'
      });
      this.setData({ isUploading: false });
    }
  }
}) 