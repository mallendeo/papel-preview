;(() => {
  const acceptedOrigins = [
    'http://localhost:3000', // nuxt
    'https://papel.app'
  ]

  const state = {
    ready: false,
    html: {
      code: '',
      loaded: false
    },
    css: {
      code: '',
      loaded: false
    },
    js: {
      code: '',
      loaded: false
    }
  }

  const styleElem = document.querySelector('#__papel-preview-style')

  const createScript = code => {
    const jsEl = document.querySelector('#__papel-preview-script')
    if (jsEl) jsEl.parentNode.removeChild(jsEl)

    const script = document.createElement('script')
    const inlineScript = document.createTextNode(code)
    script.appendChild(inlineScript)
    script.id = '__papel-preview-script'
    document.body.appendChild(script)
    return code
  }

  const updateHtml = code => {
    // Remove all DOM elements, including textNodes
    document.body.childNodes.forEach(el => {
      const isScript = [
        '__papel-init-script',
        '__papel-preview-script'
      ].indexOf(el.id) > -1

      !isScript && el.parentNode.removeChild(el)
    })

    const fakeElem = document.createElement('div')
    fakeElem.innerHTML = code

    Array.from(fakeElem.childNodes).reverse().forEach(node => {
      let elem = node

      if (node.nodeName === 'SCRIPT') {
        elem = document.createElement('script')
        elem.appendChild(document.createTextNode(node.innerHTML))
      }
      document.body.insertBefore(elem, document.body.firstChild)
    })
  }

  const update = (type, opts) => {
    switch (type) {
      case 'html':
        if (opts.forceRefresh) {
          document.body.innerHTML = state.html.code
          createScript(state.js.code)
          return
        }

        updateHtml(state.html.code)
        break
      case 'css':
        styleElem.innerHTML = state.css.code
        break
      case 'js':
        createScript(state.js.code)
        break
    }
  }

  window.addEventListener('message', event => {
    const { data, origin } = event

    if (acceptedOrigins.indexOf(origin) < 0) return

    if (!data && !data.type) return
    if (data.type === 'papel:codeupdate') {
      const { output, error, type, opts = {} } = data.event
      if (error) return

      document.title = opts.title || 'Papel Preview'

      state[type].code = output
      state[type].loaded = true

      const types = ['html', 'css', 'js']
      const allLoaded = !types.some(type => !state[type].loaded)

      if (!allLoaded) return
      if (!state.ready) {
        types.forEach(update)
        state.ready = true
        return
      }

      update(type, opts)
    }
  }, false)
})()
