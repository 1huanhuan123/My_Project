// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate
const imagesCollection = db.collection('images')
const userCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const { type, data } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (type) {
    case 'addImage':
      return addImage(data, openid)
    case 'getImages':
      return getImages(data, openid)
    case 'getImagesByCategory':
      return getImagesByCategory(data, openid)
    case 'getImageDetail':
      return getImageDetail(data, openid)
    case 'deleteImage':
      return deleteImage(data, openid)
    case 'updateImage':
      return updateImage(data, openid)
    case 'searchImages':
      return searchImages(data, openid)
    case 'toggleFavorite':
      return toggleFavorite(data, openid)
    case 'getFavorites':
      return getFavorites(data, openid)
    case 'saveUserInfo':
      return saveUserInfo(data)
    default:
      return {
        success: false,
        message: '未知的操作类型'
      }
  }
}

// 添加图片
async function addImage(data, openid) {
  try {
    const { fileID, category, description, tags, location } = data

    const result = await imagesCollection.add({
      data: {
        fileID,
        category,
        description: description || '',
        tags: tags || [],
        location: location || '',
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        views: 0,
        favorites: 0,
        openid
      }
    })

    return {
      success: true,
      data: result,
      message: '图片添加成功'
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}

// 保存用户信息
async function saveUserInfo(data) {
  try {
    const { userInfo, avatarUrl, code, openid } = data;
    console.log('保存用户信息参数:', data);

    if (!userInfo) {
      return {
        success: false,
        message: '用户信息不能为空'
      };
    }

    // 获取数据库引用
    const db = cloud.database();
    const _ = db.command;
    const userCollection = db.collection('users');

    // 上传头像到云存储
    let avatarFileID = null;
    if (avatarUrl) {
      try {
        // 从网络下载头像
        const avatarResult = await cloud.downloadFile({
          fileID: avatarUrl,
          fileContent: avatarUrl,
        }).catch(err => {
          console.error('下载头像失败', err);
          return null;
        });

        if (avatarResult) {
          // 上传到云存储
          const uploadResult = await cloud.uploadFile({
            cloudPath: `avatars/${openid || Date.now()}.jpg`,
            fileContent: avatarResult.fileContent,
          }).catch(err => {
            console.error('上传头像失败', err);
            return null;
          });

          if (uploadResult && uploadResult.fileID) {
            avatarFileID = uploadResult.fileID;
            console.log('头像上传成功:', avatarFileID);
          }
        }
      } catch (err) {
        console.error('处理头像失败:', err);
      }
    }

    // 获取用户openid
    let userOpenid = openid;
    if (!userOpenid && code) {
      try {
        // 通过code换取openid
        const wxContext = cloud.getWXContext();
        userOpenid = wxContext.OPENID;
      } catch (err) {
        console.error('获取openid失败:', err);
      }
    }

    if (!userOpenid) {
      return {
        success: false,
        message: '无法获取用户openid'
      };
    }

    // 查询用户是否已存在
    const userResult = await userCollection.where({
      openid: userOpenid
    }).get();

    let userData = {
      ...userInfo,
      openid: userOpenid,
      updateTime: db.serverDate()
    };

    if (avatarFileID) {
      userData.avatarFileID = avatarFileID;
    }

    // 保存或更新用户信息
    let result;
    if (userResult.data.length > 0) {
      // 更新用户信息
      result = await userCollection.where({
        openid: userOpenid
      }).update({
        data: userData
      });
      console.log('更新用户信息成功:', result);
    } else {
      // 新增用户信息
      userData.createTime = db.serverDate();
      result = await userCollection.add({
        data: userData
      });
      console.log('新增用户信息成功:', result);
    }

    return {
      success: true,
      message: '保存用户信息成功',
      data: {
        avatarFileID,
        openid: userOpenid
      }
    };
  } catch (err) {
    console.error('保存用户信息失败:', err);
    return {
      success: false,
      message: '保存用户信息失败: ' + err.message
    };
  }
}

// 获取图片列表
async function getImages(data, openid) {
  try {
    const { page = 1, pageSize = 10, sortBy = 'createTime', sortOrder = 'desc' } = data
    const skip = (page - 1) * pageSize

    const countResult = await imagesCollection.where({
      openid
    }).count()

    const total = countResult.total

    const orderBy = {}
    orderBy[sortBy] = sortOrder === 'desc' ? -1 : 1

    const images = await imagesCollection
      .where({
        openid
      })
      .orderBy(sortBy, sortOrder)
      .skip(skip)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: {
        list: images.data,
        total,
        page,
        pageSize
      }
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}

// 按分类获取图片
async function getImagesByCategory(data, openid) {
  try {
    const { category, page = 1, pageSize = 10 } = data
    const skip = (page - 1) * pageSize

    const countResult = await imagesCollection.where({
      openid,
      category
    }).count()

    const total = countResult.total

    const images = await imagesCollection
      .where({
        openid,
        category
      })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: {
        list: images.data,
        total,
        page,
        pageSize
      }
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}

// 获取图片详情
async function getImageDetail(data, openid) {
  try {
    const { id } = data

    // 增加浏览次数
    await imagesCollection.doc(id).update({
      data: {
        views: _.inc(1)
      }
    })

    const image = await imagesCollection.doc(id).get()

    // 检查是否已收藏
    const favoriteResult = await userCollection
      .where({
        openid,
        favorites: _.all([id])
      })
      .count()

    return {
      success: true,
      data: {
        ...image.data,
        isFavorite: favoriteResult.total > 0
      }
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}

// 删除图片
async function deleteImage(data, openid) {
  try {
    const { id, fileID } = data

    // 删除云存储中的文件
    await cloud.deleteFile({
      fileList: [fileID]
    })

    // 删除数据库中的记录
    await imagesCollection.doc(id).remove()

    return {
      success: true,
      message: '图片删除成功'
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}

// 更新图片信息
async function updateImage(data, openid) {
  try {
    const { id, category, description, tags, location } = data

    await imagesCollection.doc(id).update({
      data: {
        category,
        description,
        tags,
        location,
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      message: '图片信息更新成功'
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}

// 搜索图片
async function searchImages(data, openid) {
  try {
    const { keyword, page = 1, pageSize = 10 } = data
    const skip = (page - 1) * pageSize

    // 构建搜索条件
    const condition = {
      openid,
      $or: [
        {
          description: db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        },
        {
          tags: db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        },
        {
          location: db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        }
      ]
    }

    const countResult = await imagesCollection.where(condition).count()
    const total = countResult.total

    const images = await imagesCollection
      .where(condition)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: {
        list: images.data,
        total,
        page,
        pageSize
      }
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}

// 切换收藏状态
async function toggleFavorite(data, openid) {
  try {
    const { id, isFavorite } = data

    // 检查用户是否存在
    const userResult = await userCollection.where({ openid }).get()

    if (userResult.data.length === 0) {
      // 创建用户记录
      await userCollection.add({
        data: {
          openid,
          favorites: isFavorite ? [id] : [],
          createTime: db.serverDate()
        }
      })
    } else {
      // 更新用户收藏
      if (isFavorite) {
        await userCollection.where({ openid }).update({
          data: {
            favorites: _.addToSet(id)
          }
        })
      } else {
        await userCollection.where({ openid }).update({
          data: {
            favorites: _.pull(id)
          }
        })
      }
    }

    // 更新图片收藏计数
    await imagesCollection.doc(id).update({
      data: {
        favorites: isFavorite ? _.inc(1) : _.inc(-1)
      }
    })

    return {
      success: true,
      message: isFavorite ? '收藏成功' : '取消收藏成功'
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}

// 获取收藏的图片
async function getFavorites(data, openid) {
  try {
    const { page = 1, pageSize = 10 } = data
    const skip = (page - 1) * pageSize

    // 获取用户收藏的图片ID列表
    const userResult = await userCollection.where({ openid }).get()

    if (userResult.data.length === 0 || !userResult.data[0].favorites || userResult.data[0].favorites.length === 0) {
      return {
        success: true,
        data: {
          list: [],
          total: 0,
          page,
          pageSize
        }
      }
    }

    const favoriteIds = userResult.data[0].favorites

    // 获取收藏的图片总数
    const countResult = await imagesCollection.where({
      _id: _.in(favoriteIds)
    }).count()

    const total = countResult.total

    // 获取收藏的图片列表
    const images = await imagesCollection
      .where({
        _id: _.in(favoriteIds)
      })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: {
        list: images.data,
        total,
        page,
        pageSize
      }
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
} 