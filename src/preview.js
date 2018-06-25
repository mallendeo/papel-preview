;(() => {
  const acceptedOrigins = [
    'http://localhost:3000', // nuxt
    'https://papel.app'
  ]

  const state = {
    ready: false,
    html: {
      code: '',
      meta: {},
      loaded: false
    },
    css: {
      code: '',
      meta: {},
      loaded: false
    },
    js: {
      code: '',
      meta: {},
      loaded: false
    }
  }

  const styleElem = document.querySelector('#__papel-preview-style')

  const setReady = () => {
    const { html, css, js } = state
    // TODO: title, head
    const htmlReady = html.loaded && html.meta
    const cssReady = css.loaded && css.meta.libs
    const jsReady = js.loaded && js.meta.libs

    const ready = htmlReady && cssReady && jsReady

    // Load code once libraries are added
    if (ready) {
      ['html', 'css', 'js'].forEach(update)
    }

    state.ready = ready
  }

  const createScript = code => {
    const jsEl = document.querySelector('#__papel-preview-script')
    if (jsEl) jsEl.parentNode.removeChild(jsEl)

    const script = document.createElement('script')
    const inlineScript = document.createTextNode(code)
    script.appendChild(inlineScript)
    script.id = '__papel-preview-script'
    script.dataset.papelDoNotRemove = true

    document.body.appendChild(script)
    return code
  }

  const removeNodes = (nodes, exclude) => {
    if (!nodes) throw Error('No nodes provided')
    const filter = exclude || (node =>
      node.dataset && node.dataset.papelDoNotRemove
    )

    return Array.from(nodes).map(node => !(filter(node)) && node.remove(node))
  }

  const updateHtml = code => {
    // Remove all DOM elements, including textNodes
    removeNodes(document.body.childNodes, node => {
      const { dataset } = node
      if (!dataset) return false
      return dataset.papelDoNotRemove || dataset.papelExternalLib
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

    if (data.type === 'papel:metaupdate') {
      const { libs, title, head, htmlClasses } = data.event

      removeNodes(document.head.childNodes)

      if (libs.css && libs.css.length) {
        libs.css.reverse().forEach(lib => {
          const elem = document.createElement('link')
          elem.setAttribute('rel', 'stylesheet')
          elem.setAttribute('href', lib.url)

          document.head.insertBefore(elem, document.head.firstChild)
        })

        state.css.meta.libs = libs.css
      }

      if (libs.js && libs.js.length) {
        removeNodes(document.body.querySelectorAll('script'))

        const initScript = document.querySelector('#__papel-init-script')

        libs.js.forEach(lib => {
          console.log('inserting', lib)
          const elem = document.createElement('script')
          elem.setAttribute('src', lib.url)
          elem.dataset.papelExternalLib = true

          initScript.parentNode.appendChild(elem)
        })

        state.js.meta.libs = libs.js
      }

      setReady()
    }

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
        setReady()
        return
      }

      update(type, opts)
    }
  }, false)
})()
