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

  const setReady = () => {
    const { html, css, js } = state
    // TODO: title, head
    const htmlReady = html.loaded && html.meta
    const cssReady = css.loaded && css.meta.libs
    const jsReady = js.loaded && js.meta.libs

    const ready = !!(htmlReady && cssReady && jsReady)

    if (ready) {
      const cssLibs = css.meta.libs
      const jsLibs = js.meta.libs

      if (cssLibs && cssLibs.length) {
        removeNodes(document.head.childNodes)

        cssLibs.reverse().forEach(lib => {
          const elem = document.createElement('link')
          elem.setAttribute('rel', 'stylesheet')
          elem.setAttribute('href', lib.url)

          document.head.insertBefore(elem, document.head.firstChild)
        })
      }

      // Add styles first (prevent FOUC)
      update('css')
      update('html')

      if (jsLibs && jsLibs.length) {
        removeNodes(document.body.querySelectorAll('script'))

        const initScript = document.querySelector('#__papel-init-script')

        jsLibs.forEach(lib => {
          const elem = document.createElement('script')
          elem.setAttribute('src', lib.url)
          elem.async = false
          elem.dataset.papelExternalLib = true

          initScript.parentNode.appendChild(elem)
        })
      }

      update('js')
    }

    state.ready = ready
  }

  const removeNodes = (nodes, exclude) => {
    if (!nodes) throw Error('No nodes provided')
    const filter = exclude || (node =>
      node.dataset && node.dataset.papelDoNotRemove
    )

    return Array.from(nodes).map(node => !(filter(node)) && node.remove(node))
  }

  const update = type => {
    switch (type) {
      case 'html':
        // Remove all DOM elements, including textNodes
        removeNodes(document.body.childNodes, node => {
          const { dataset } = node
          if (!dataset) return false
          return dataset.papelDoNotRemove || dataset.papelExternalLib
        })

        const fakeElem = document.createElement('div')
        fakeElem.innerHTML = state.html.code

        Array.from(fakeElem.childNodes).reverse().forEach(node => {
          let elem = node

          if (node.nodeName === 'SCRIPT') {
            elem = document.createElement('script')
            elem.async = node.async || false
            elem.appendChild(document.createTextNode(node.innerHTML))
          }
          document.body.insertBefore(elem, document.body.firstChild)
        })
        break
      case 'css':
        let styleElem = document.head.querySelector('#__papel-preview-style')

        if (!styleElem) {
          styleElem = document.createElement('style')
          styleElem.dataset.papelDoNotRemove = true
          styleElem.id = '__papel-preview-style'
          document.head.appendChild(styleElem)
        }

        styleElem.innerHTML = state.css.code
        break
      case 'js':
        let scriptElem = document.querySelector('#__papel-preview-script')
        if (scriptElem) scriptElem.parentNode.removeChild(scriptElem)

        scriptElem = document.createElement('script')
        const inlineScript = document.createTextNode(state.js.code)
        scriptElem.appendChild(inlineScript)
        scriptElem.id = '__papel-preview-script'
        scriptElem.dataset.papelDoNotRemove = true
        scriptElem.async = false

        document.body.appendChild(scriptElem)
        break
    }
  }

  window.addEventListener('message', event => {
    const { data, origin } = event

    if (acceptedOrigins.indexOf(origin) < 0) return
    if (!data && !data.type) return

    if (data.type === 'papel:metaupdate') {
      const { libs, title, head, htmlClasses } = data.event
      document.title = title || 'Papel Preview'

      state.css.meta.libs = libs.css
      state.js.meta.libs = libs.js

      setReady()
    }

    if (data.type === 'papel:codeupdate') {
      const { output, error, type, opts = {} } = data.event
      if (error) return

      state[type].code = output
      state[type].loaded = true

      if (!state.ready) return setReady()

      update(type)
    }
  }, false)
})()
