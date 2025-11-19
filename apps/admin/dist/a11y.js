/* eslint-env browser */
/* global window, document, localStorage */
;(function () {
  const STORAGE_KEY = 'jars_a11y_prefs'
  const defaults = {contrast: false, large: false, dyslexic: false, reduceMotion: false}

  function load() {
    try {
      return Object.assign({}, defaults, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))
    } catch {
      return Object.assign({}, defaults)
    }
  }

  function save(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {}
  }

  function apply(prefs) {
    document.body.classList.toggle('a11y-high-contrast', !!prefs.contrast)
    document.body.classList.toggle('a11y-large-text', !!prefs.large)
    document.body.classList.toggle('a11y-dyslexic', !!prefs.dyslexic)
    document.body.classList.toggle('a11y-reduce-motion', !!prefs.reduceMotion)

    const btnContrast = document.getElementById('a11y-contrast')
    const btnLarge = document.getElementById('a11y-large')
    const btnDys = document.getElementById('a11y-dyslexic')
    if (btnContrast) btnContrast.setAttribute('aria-pressed', !!prefs.contrast)
    if (btnLarge) btnLarge.setAttribute('aria-pressed', !!prefs.large)
    if (btnDys) btnDys.setAttribute('aria-pressed', !!prefs.dyslexic)
  }

  function setPrefs(newPrefs) {
    const prefs = Object.assign({}, defaults, newPrefs || {})
    save(prefs)
    apply(prefs)
    return prefs
  }

  function reset() {
    save(defaults)
    apply(defaults)
    return defaults
  }

  function getPrefs() {
    return load()
  }

  function toggle(key) {
    const prefs = load()
    prefs[key] = !prefs[key]
    save(prefs)
    apply(prefs)
    return prefs
  }

  // expose a tiny API for programmatic control from other admin pages
  window.JARS_A11Y = {
    getPrefs,
    setPrefs,
    reset,
    apply,
    toggle,
  }

  document.addEventListener('DOMContentLoaded', function () {
    const prefs = load()
    apply(prefs)

    const btnContrast = document.getElementById('a11y-contrast')
    const btnLarge = document.getElementById('a11y-large')
    const btnDys = document.getElementById('a11y-dyslexic')
    if (btnContrast)
      btnContrast.addEventListener('click', function () {
        toggle('contrast')
      })
    if (btnLarge)
      btnLarge.addEventListener('click', function () {
        toggle('large')
      })
    if (btnDys)
      btnDys.addEventListener('click', function () {
        toggle('dyslexic')
      })
  })
})()
