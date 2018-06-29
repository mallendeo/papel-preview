import { acceptedOrigins } from './config'

const load = event => {
  const { data, origin } = event

  if (acceptedOrigins.indexOf(origin) < 0) return
  if (!data && !data.type) return

  if (data.type === 'papel:fullhtml') {
    window.removeEventListener('message', load, false)

    // rewrite DOM
    document.open()
    document.write(data.html)
    document.close()
  }
}

window.addEventListener('message', load, false)
window.parent.postMessage('papel:gethtml', '*')
