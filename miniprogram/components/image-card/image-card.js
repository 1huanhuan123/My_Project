// components/image-card/image-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    image: {
      type: Object,
      value: {}
    },
    showActions: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onImageTap() {
      const { _id, fileID } = this.properties.image
      this.triggerEvent('imagetap', { id: _id, fileID })
    },

    onDeleteTap(e) {
      e.stopPropagation()
      const { _id, fileID } = this.properties.image
      this.triggerEvent('deletetap', { id: _id, fileID })
    },

    onEditTap(e) {
      e.stopPropagation()
      const { _id } = this.properties.image
      this.triggerEvent('edittap', { id: _id })
    },

    onFavoriteTap(e) {
      e.stopPropagation()
      const { _id, isFavorite } = this.properties.image
      this.triggerEvent('favoritetap', { id: _id, isFavorite: !isFavorite })
    }
  }
}) 