/* eslint-env browser */
/* global window, document, localStorage */
;(function () {
  const STORAGE_KEY = 'nimbus_a11y_prefs'
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
    const btnMotion = document.getElementById('a11y-motion')
    if (btnContrast) {
      btnContrast.setAttribute('aria-pressed', !!prefs.contrast)
      btnContrast.classList.toggle('is-active', !!prefs.contrast)
    }
    if (btnLarge) {
      btnLarge.setAttribute('aria-pressed', !!prefs.large)
      btnLarge.classList.toggle('is-active', !!prefs.large)
    }
    if (btnDys) {
      btnDys.setAttribute('aria-pressed', !!prefs.dyslexic)
      btnDys.classList.toggle('is-active', !!prefs.dyslexic)
    }
    if (btnMotion) {
      btnMotion.setAttribute('aria-pressed', !!prefs.reduceMotion)
      btnMotion.classList.toggle('is-active', !!prefs.reduceMotion)
    }
  }

  function hapticPulse() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!prefersReduced && navigator?.vibrate) {
      navigator.vibrate(12)
    }
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
  window.NIMBUS_A11Y = {
    getPrefs,
    setPrefs,
    reset,
    apply,
    toggle,
  }

  document.addEventListener('DOMContentLoaded', function () {
    const prefs = load()
    apply(prefs)

    const toggleBtn = document.getElementById('a11y-toggle')
    const menu = document.getElementById('a11y-menu')
    function setMenu(open) {
      if (!menu || !toggleBtn) return
      if (open) {
        menu.removeAttribute('hidden')
        toggleBtn.setAttribute('aria-expanded', 'true')
      } else {
        menu.setAttribute('hidden', 'true')
        toggleBtn.setAttribute('aria-expanded', 'false')
      }
    }

    if (toggleBtn && menu) {
      setMenu(false)
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true'
        setMenu(!isOpen)
      })

      document.addEventListener('click', (e) => {
        if (menu.contains(e.target) || toggleBtn.contains(e.target)) return
        setMenu(false)
      })
    }

    const btnContrast = document.getElementById('a11y-contrast')
    const btnLarge = document.getElementById('a11y-large')
    const btnDys = document.getElementById('a11y-dyslexic')
    const btnMotion = document.getElementById('a11y-motion')
    const btnReset = document.getElementById('a11y-reset')
    if (btnContrast)
      btnContrast.addEventListener('click', function () {
        toggle('contrast')
        hapticPulse()
      })
    if (btnLarge)
      btnLarge.addEventListener('click', function () {
        toggle('large')
        hapticPulse()
      })
    if (btnDys)
      btnDys.addEventListener('click', function () {
        toggle('dyslexic')
        hapticPulse()
      })
    if (btnMotion)
      btnMotion.addEventListener('click', function () {
        toggle('reduceMotion')
        hapticPulse()
      })
    if (btnReset)
      btnReset.addEventListener('click', function () {
        reset()
        hapticPulse()
      })
  })
})()
