// components/tag-selector/tag-selector.js
const { TAG_LIST } = require('../../utils/util')

Component({
  properties: {
    title: { type: String, value: '' },
    multiple: { type: Boolean, value: true },
    value: { type: Array, value: [] }
  },

  data: {
    tags: TAG_LIST,
    selectedMap: {}
  },

  observers: {
    'value': function (val) {
      const selectedMap = {}
      ;(val || []).forEach(label => {
        const tag = TAG_LIST.find(t => t.label === label)
        if (tag) selectedMap[tag.key] = true
      })
      this.setData({ selectedMap })
    }
  },

  methods: {
    onToggle(e) {
      const { key, label } = e.currentTarget.dataset
      const selectedMap = { ...this.data.selectedMap }

      if (this.properties.multiple) {
        // 多选切换
        if (selectedMap[key]) {
          delete selectedMap[key]
        } else {
          selectedMap[key] = true
        }
      } else {
        // 单选
        Object.keys(selectedMap).forEach(k => delete selectedMap[k])
        selectedMap[key] = true
      }

      this.setData({ selectedMap })

      // 输出选中的标签 label 数组
      const selected = TAG_LIST
        .filter(t => selectedMap[t.key])
        .map(t => t.label)

      this.triggerEvent('change', { value: selected })
    }
  }
})
