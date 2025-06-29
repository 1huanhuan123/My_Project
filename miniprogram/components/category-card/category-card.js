// components/category-card/category-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    category: {
      type: Object,
      value: {}
    },
    count: {
      type: Number,
      value: 0
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
    onCategoryTap() {
      const { id, name } = this.properties.category
      this.triggerEvent('categorytap', { id, name })
    }
  }
}) 