class Vue {

  constructor(options) {

    // console.log(options, 'constructor')

    this.$options = options
    this.$watchEvent = {}

    this.$data = options.data
    this.proxyData()
    this.observe()

    if (typeof options.beforeCreate === 'function') options.beforeCreate.bind(this)()
    if (typeof options.created === 'function') options.created.bind(this)()
    if (typeof options.beforeMount === 'function') options.beforeMount.bind(this)()

    this.$el = document.querySelector(options.el)
    this.compile(this.$el)

    if (typeof options.mounted === 'function') options.mounted.bind(this)()
  }

  /** @双向数据绑定原理 */
  proxyData () {
    // 1. 给vue大对象赋属性，来自于data中
    // 2. data中的属性值和vue大对象的属性保持双向（劫持）
    for (let key in this.$data) {
      Object.defineProperty(this, key, {
        get () {
          return this.$data[key]
        },
        set (val) {
          this.$data[key] = val
        }
      })
    }
  }

  /** @触发data中数据发生变化来执行watch中的update */
  observe () {
    // console.log(this.$watchEvent, 'observe')
    for (let key in this.$data) {
      let value = this.$data[key]
      const _this = this
      Object.defineProperty(this.$data, key, {
        get () {
          return value
        },
        set (val) {
          value = val
          if (_this.$watchEvent[key]) {
            _this.$watchEvent[key].forEach(item => {
              item.update()
            })
          }
        }
      })
    }
  }

  /** @模板解析 */
  compile (node) {

    // console.log(node.childNodes, 'compile')
    node.childNodes.forEach((item, i) => {
      // console.log(this.$options)
      // 判断元素节点是否绑定@click


      // 元素节点
      if (item.nodeType === 1) {
        if (item.hasAttribute('@click')) {

          const vmKey = item.getAttribute('@click').trim()

          item.addEventListener('click', (event) => {
            this.eventFn = this.$options.methods[vmKey].bind(this)
            // this.observe()
            this.eventFn(event)

          })

        }

        // 元素节点是否添加v-model 
        if (item.hasAttribute('v-model')) {
          const vmkey = item.getAttribute('v-model').trim()
          if (this.hasOwnProperty(vmkey)) { item.value = this[vmkey] }
          item.addEventListener('input', () => {
            this[vmkey] = item.value
          })
        }

        if (item.childNodes.length) this.compile(item)
      }

      // 这是文本节点，如果有{{}}就替换成数据
      if (item.nodeType === 3) {
        // 正则匹配{{}}
        const reg = /\{\{(.*?)\}\}/g
        const text = item.textContent
        // 替换本文
        item.textContent = text.replace(reg, (match, vmKey) => {
          vmKey = vmKey.trim()
          if (this.hasOwnProperty(vmKey)) {
            const watch = new Watch(this, vmKey, item, 'textContent')
            if (this.$watchEvent[vmKey]) {
              this.$watchEvent[vmKey].push(watch)
            } else {
              this.$watchEvent[vmKey] = []
              this.$watchEvent[vmKey].push(watch)
            }
          }
          return this.$data[vmKey]
        })
      }
    })
  }
}


/**
 * @param {Object} vm 对象
 * @param {String} key 属性名称
 * @param {dom} node 节点
 * @param {String} attr 改变文本节点内容的字符串
 */
class Watch {
  constructor(vm, key, node, attr) {
    this.vm = vm
    this.key = key
    this.node = node
    this.attr = attr

  }
  /** @执行改变update操作 */
  update () {
    this.node[this.attr] = this.vm[this.key]
  }

}