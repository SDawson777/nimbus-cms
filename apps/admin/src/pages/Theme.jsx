import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {csrfFetch} from '../lib/csrf'
import {useAdmin} from '../lib/adminContext'
import {safeJson} from '../lib/safeJson'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
const ALLOWED_LOGO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'webp']

function formatBytes(count) {
  if (count >= 1024 * 1024) return `${Math.round(count / (1024 * 1024))}MB`
  if (count >= 1024) return `${Math.round(count / 1024)}KB`
  return `${count}B`
}

export default function ThemePage() {
  const {capabilities} = useAdmin()
  const brandScope = capabilities?.scopes?.brandSlug || ''
  const canEditTheme = !!capabilities?.canEditTheme
  const canDeleteThemeConfig = !!capabilities?.canDeleteThemeConfig
  const canUploadThemeAssets = !!capabilities?.canUploadThemeAssets
  const [theme, setTheme] = useState(null)
  const [brand, setBrand] = useState('')
  const [configsPage, setConfigsPage] = useState({items: [], total: 0, page: 1, perPage: 10})
  const [storeFilter, setStoreFilter] = useState('')
  const [editing, setEditing] = useState(false)
  const [themeLoading, setThemeLoading] = useState(false)
  const [themeError, setThemeError] = useState(null)
  const [configsLoading, setConfigsLoading] = useState(false)
  const [configsError, setConfigsError] = useState(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [form, setForm] = useState({
    id: undefined,
    brand: '',
    store: '',
    accentColor: '',
    surfaceColor: '',
    mutedTextColor: '',
    darkModeEnabled: false,
    cornerRadius: '',
    elevationStyle: '',
    logoUrl: '',
    logoAssetId: '',
  })
  const [errors, setErrors] = useState({})
  const modalRef = useRef(null)
  const lastActiveRef = useRef(null)
  const scopeAutoloadRef = useRef(false)
  const brandRef = useRef('')
  const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
  const updateBrand = useCallback((value) => {
    const next = (value || '').trim()
    brandRef.current = next
    setBrand(next)
  }, [])

  useEffect(() => {
    if (brandScope && brandScope !== brand) {
      updateBrand(brandScope)
    }
  }, [brandScope, brand, updateBrand])

  // live validate color fields when they change so UI shows inline errors
  useEffect(() => {
    const newErrors = {...errors}
    if (form.accentColor && !hexRegex.test(form.accentColor))
      newErrors.accentColor = 'Must be a hex color like #RRGGBB'
    else delete newErrors.accentColor
    if (form.surfaceColor && !hexRegex.test(form.surfaceColor))
      newErrors.surfaceColor = 'Must be a hex color like #RRGGBB'
    else delete newErrors.surfaceColor
    if (form.mutedTextColor && !hexRegex.test(form.mutedTextColor))
      newErrors.mutedTextColor = 'Must be a hex color like #RRGGBB'
    else delete newErrors.mutedTextColor
    const global = errors && errors._global
    if (global) newErrors._global = global
    setErrors(newErrors)
  }, [form.accentColor, form.surfaceColor, form.mutedTextColor])

  const fieldErrorIds = useMemo(
    () => ({
      accentColor: 'theme-accent-error',
      surfaceColor: 'theme-surface-error',
      mutedTextColor: 'theme-muted-error',
    }),
    [],
  )

  const pendingFieldErrors = useMemo(
    () =>
      Object.entries(errors)
        .filter(([key, value]) => key !== '_global' && key !== 'logoUpload' && Boolean(value))
        .map(([key]) => key),
    [errors],
  )

  useEffect(() => {
    // noop
  }, [])

  const loadTheme = useCallback(async () => {
    const scopedBrand = (brandScope || brandRef.current || brand || '').trim()
    if (!scopedBrand) {
      setTheme(null)
      setThemeError('Enter a brand slug to load theme settings')
      return
    }
    setThemeLoading(true)
    setThemeError(null)
    try {
      const res = await fetch(`/content/theme?brand=${encodeURIComponent(scopedBrand)}`)
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || 'Theme not found for this brand')
      }
      const j = await safeJson(res, {})
      setTheme(j)
      if (!editing) {
        setForm((prev) => ({
          ...prev,
          id: j.id,
          brand: j.brand || scopedBrand,
          store: j.store || '',
          accentColor: j.accentColor || j.primaryColor || '',
          surfaceColor: j.surfaceColor || j.backgroundColor || '',
          mutedTextColor: j.mutedTextColor || j.textColor || '',
          darkModeEnabled: !!j.darkModeEnabled,
          cornerRadius: j.cornerRadius || '',
          elevationStyle: j.elevationStyle || '',
          logoUrl: j.logoUrl || '',
          logoAssetId: j.logoAssetId || j.logoAsset || '',
        }))
      }
    } catch (err) {
      console.error('load theme failed', err)
      setTheme(null)
      setThemeError(err?.message || 'Failed to load theme')
    } finally {
      setThemeLoading(false)
    }
  }, [brand, brandScope, editing])

  const loadConfigs = useCallback(
    async (options = {}) => {
      const page = options.page ?? configsPage.page ?? 1
      const perPage = options.perPage ?? configsPage.perPage ?? 10
      const brandOverride = typeof options.brand === 'string' ? options.brand.trim() : undefined
      const storeOverride = typeof options.store === 'string' ? options.store.trim() : undefined
      const brandFilter = (brandOverride || brandScope || brandRef.current || brand || '').trim()
      const storeFilterOpt = (storeOverride || storeFilter || '').trim()

      if (!brandFilter) {
        setConfigsPage({items: [], total: 0, page: 1, perPage})
        setConfigsError('Enter a brand to list configs')
        return
      }

      setConfigsLoading(true)
      setConfigsError(null)
      try {
        const qs = new URLSearchParams()
        qs.set('page', String(page))
        qs.set('perPage', String(perPage))
        qs.set('brand', brandFilter)
        if (storeFilterOpt) qs.set('store', storeFilterOpt)
        const res = await fetch(`/api/admin/theme/configs?${qs.toString()}`, {
          credentials: 'include',
        })
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(text || 'Failed to load configs')
        }
        const j = await safeJson(res, {})
        setConfigsPage({
          items: Array.isArray(j.items) ? j.items : [],
          total: j.total || 0,
          page: j.page || page,
          perPage: j.perPage || perPage,
        })
      } catch (err) {
        console.error('failed load configs', err)
        setConfigsError(err?.message || 'Failed to load configs')
        setConfigsPage({items: [], total: 0, page: 1, perPage})
      } finally {
        setConfigsLoading(false)
      }
    },
    [brand, brandScope, storeFilter, configsPage.page, configsPage.perPage],
  )

  useEffect(() => {
    if (!brandScope || scopeAutoloadRef.current) return
    scopeAutoloadRef.current = true
    loadTheme()
    loadConfigs({page: 1, brand: brandScope})
  }, [brandScope, loadTheme, loadConfigs])

  async function save() {
    if (!canEditTheme) {
      setErrors({_global: 'You do not have permission to edit this theme.'})
      return
    }
    const newErrors = {}
    if (form.accentColor && !hexRegex.test(form.accentColor))
      newErrors.accentColor = 'Must be a hex color like #RRGGBB'
    if (form.surfaceColor && !hexRegex.test(form.surfaceColor))
      newErrors.surfaceColor = 'Must be a hex color like #RRGGBB'
    if (form.mutedTextColor && !hexRegex.test(form.mutedTextColor))
      newErrors.mutedTextColor = 'Must be a hex color like #RRGGBB'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      const payload = {...form}
      if (!payload.brand) payload.brand = brandScope || brand
      const res = await csrfFetch('/api/admin/theme/config', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const j = await safeJson(res, {})
        setTheme(j.theme || j)
        setEditing(false)
        await loadTheme()
        await loadConfigs({page: configsPage.page, perPage: configsPage.perPage})
      } else {
        const err = await safeJson(res, {})
        setErrors({_global: err.error || 'Failed to save'})
      }
    } catch (e) {
      console.error(e)
      setErrors({_global: 'Failed to save'})
    }
  }

  function openEditor(item) {
    if (!canEditTheme) return
    setErrors({})
    if (!item) {
      setForm({
        id: undefined,
        brand: brand || brandScope || '',
        store: '',
        accentColor: '',
        surfaceColor: '',
        mutedTextColor: '',
        darkModeEnabled: false,
        cornerRadius: '',
        elevationStyle: '',
        logoUrl: '',
        logoAssetId: '',
      })
      setEditing(true)
      return
    }
    setForm({
      id: item.id,
      brand: item.brand || item.brandSlug || brand || brandScope || '',
      store: item.store || '',
      accentColor: item.accentColor || item.primaryColor || '',
      surfaceColor: item.surfaceColor || item.backgroundColor || '',
      mutedTextColor: item.mutedTextColor || item.textColor || '',
      darkModeEnabled: !!item.darkModeEnabled,
      cornerRadius: item.cornerRadius || '',
      elevationStyle: item.elevationStyle || '',
      logoUrl: item.logoUrl || '',
      logoAssetId: item.logoAssetId || item.logoAsset || '',
    })
    setEditing(true)
  }

  // focus trap & keyboard handling for modal
  useEffect(() => {
    if (!editing) {
      // restore focus to previous element
      try {
        if (lastActiveRef.current && lastActiveRef.current.focus) lastActiveRef.current.focus()
      } catch (e) {
        /* ignore */
      }
      return
    }

    // save active element
    lastActiveRef.current = document.activeElement
    const modal = modalRef.current
    if (!modal) return

    // find focusable elements inside modal
    const focusable = modal.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const focusFirst = () => {
      if (focusable.length > 0) {
        try {
          focusable[0].focus()
        } catch (e) {
          /* ignore */
        }
      }
    }
    focusFirst()

    function onKey(e) {
      if (e.key === 'Escape') {
        setEditing(false)
        setErrors({})
        return
      }
      if (e.key === 'Tab') {
        // basic tab trap
        const focusArray = Array.from(focusable)
        if (focusArray.length === 0) return
        const idx = focusArray.indexOf(document.activeElement)
        if (e.shiftKey) {
          if (idx === 0) {
            e.preventDefault()
            focusArray[focusArray.length - 1].focus()
          }
        } else {
          if (idx === focusArray.length - 1) {
            e.preventDefault()
            focusArray[0].focus()
          }
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [editing])

  async function deleteConfig(id) {
    if (!id || !canDeleteThemeConfig) return
    if (!confirm('Delete this theme config?')) return
    try {
      const res = await csrfFetch(`/api/admin/theme/config/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await loadConfigs({page: configsPage.page, perPage: configsPage.perPage})
      } else {
        console.error('delete failed')
      }
    } catch (e) {
      console.error(e)
    }
  }

  function validateLogoFile(file) {
    if (!file) return ['No file selected']
    const ext = (file.name || '').toLowerCase().split('.').pop()
    const hasAllowedExt = ext ? ALLOWED_LOGO_EXTENSIONS.includes(ext) : false
    const hasAllowedMime = file.type ? ALLOWED_LOGO_TYPES.includes(file.type) : false
    const errorsList = []
    if (!hasAllowedExt && !hasAllowedMime) errorsList.push('Logo must be PNG, JPG, SVG, or WebP.')
    if (file.size > MAX_LOGO_BYTES)
      errorsList.push(`Logo must be ${formatBytes(MAX_LOGO_BYTES)} or smaller.`)
    return errorsList
  }

  function friendlyUploadError(code) {
    if (code === 'UNSUPPORTED_FILE_TYPE') return 'Only PNG, JPG, SVG, or WebP logos are allowed.'
    if (code === 'FILE_TOO_LARGE') return `Logo must be ${formatBytes(MAX_LOGO_BYTES)} or smaller.`
    if (code === 'MISSING_FILE') return 'Select a file before uploading.'
    return typeof code === 'string' ? code : 'Upload failed'
  }

  function setLogoError(message) {
    setErrors((prev) => ({...prev, logoUpload: message, _global: message}))
  }

  function clearLogoError() {
    setErrors((prev) => {
      const previousLogoError = prev.logoUpload
      const next = {...prev}
      delete next.logoUpload
      if (previousLogoError && next._global === previousLogoError) delete next._global
      return next
    })
  }

  async function uploadLogo(dataUrl, filename) {
    if (!canUploadThemeAssets) {
      setLogoError('You do not have permission to upload logos.')
      return null
    }
    // Accept either a File/Blob or a dataURL string. Try multipart first for better UX; fall back to JSON dataURL.
    try {
      setLogoUploading(true)
      if (
        typeof dataUrl === 'object' &&
        dataUrl !== null &&
        (dataUrl instanceof Blob || dataUrl.buffer)
      ) {
        // file/blob provided -> attempt multipart upload
        try {
          const fd = new FormData()
          fd.append('file', dataUrl, filename)
          const res = await csrfFetch('/api/admin/upload-logo-multipart', {
            method: 'POST',
            body: fd,
          })
          if (res.ok) {
            const j = await safeJson(res, {})
            if (j.assetId)
              setForm((prev) => ({...prev, logoUrl: j.url || prev.logoUrl, logoAssetId: j.assetId}))
            clearLogoError()
            return j.url || j.assetId || null
          }
          // if multipart not supported or failed, fall through to JSON flow
        } catch (multipartErr) {
          // try JSON fallback below
          console.warn('multipart upload failed, falling back to JSON upload', multipartErr)
        }
      }

      // If we reach here, either dataUrl is a dataURL string or multipart failed. If passed a File, convert to dataURL.
      let dataStr = dataUrl
      if (
        typeof dataUrl === 'object' &&
        dataUrl !== null &&
        (dataUrl instanceof Blob || dataUrl.buffer)
      ) {
        dataStr = await new Promise((resolve, reject) => {
          try {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = (err) => reject(err)
            reader.readAsDataURL(dataUrl)
          } catch (e) {
            reject(e)
          }
        })
      }

      const res2 = await csrfFetch('/api/admin/upload-logo', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({filename, data: dataStr}),
      })
      if (!res2.ok) {
        const err = await safeJson(res2, {})
        setLogoError(friendlyUploadError(err.error))
        return null
      }
      const j2 = await safeJson(res2, {})
      if (j2.assetId)
        setForm((prev) => ({...prev, logoUrl: j2.url || prev.logoUrl, logoAssetId: j2.assetId}))
      clearLogoError()
      return j2.url || j2.assetId || null
    } catch (e) {
      console.error('uploadLogo failed', e)
      setLogoError('Upload failed')
      return null
    } finally {
      setLogoUploading(false)
    }
  }

  return (
    <div style={{padding: 20}}>
      <h1>Theme Viewer</h1>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'flex-end',
        }}
      >
        <label style={{display: 'flex', flexDirection: 'column', minWidth: 220}}>
          Brand slug
          <input
            placeholder="brand slug"
            value={brand}
            onChange={(e) => updateBrand(e.target.value)}
            onInput={(e) => updateBrand(e.target.value)}
            disabled={!!brandScope}
          />
        </label>
        {brandScope && (
          <div style={{fontSize: 12, color: '#6b7280'}}>
            Scope locked to brand <strong>{brandScope}</strong>
          </div>
        )}
        <label style={{display: 'flex', flexDirection: 'column', minWidth: 220}}>
          Store slug (optional)
          <input
            placeholder="store slug (optional)"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value.trim())}
          />
        </label>
        <div style={{display: 'flex', gap: 8}}>
          <button onClick={loadTheme} disabled={themeLoading}>
            {themeLoading ? 'Loading…' : 'Load theme'}
          </button>
          <button
            onClick={() => loadConfigs({page: 1, brand, store: storeFilter})}
            disabled={configsLoading}
          >
            {configsLoading ? 'Loading configs…' : 'List configs'}
          </button>
        </div>
        <label style={{display: 'flex', alignItems: 'center', gap: 6}}>
          Per page
          <select
            value={configsPage.perPage}
            onChange={(e) => {
              const v = Number(e.target.value)
              setConfigsPage((p) => ({...p, perPage: v}))
              loadConfigs({page: 1, perPage: v, brand, store: storeFilter})
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
        <button
          onClick={() => openEditor(null)}
          disabled={!canEditTheme}
          title={canEditTheme ? 'Create theme config' : 'Editor role required'}
        >
          New config
        </button>
      </div>

      <section style={{marginTop: 12}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h3 style={{margin: 0}}>Theme Configs (total: {configsPage.total})</h3>
          <button
            type="button"
            onClick={() => loadConfigs({page: configsPage.page, brand, store: storeFilter})}
            disabled={configsLoading}
          >
            {configsLoading ? 'Refreshing…' : 'Reload configs'}
          </button>
        </div>
        {configsError && (
          <div
            role="alert"
            style={{marginTop: 12, padding: 12, background: '#fee2e2', color: '#b91c1c'}}
          >
            Failed to load configs: {configsError}{' '}
            <button type="button" onClick={() => loadConfigs({page: 1, brand, store: storeFilter})}>
              Retry
            </button>
          </div>
        )}
        {!configsError && configsLoading && (
          <div role="status" style={{marginTop: 12}}>
            Loading configs…
          </div>
        )}
        {!configsError &&
          !configsLoading &&
          (!Array.isArray(configsPage.items) || configsPage.items.length === 0) && (
            <div style={{marginTop: 12}}>No configs found for this scope.</div>
          )}
        {!configsError && Array.isArray(configsPage.items) && configsPage.items.length > 0 && (
          <>
            <table style={{width: '100%', borderCollapse: 'collapse', marginTop: 12}}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Brand</th>
                  <th>Store</th>
                  <th>Accent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {configsPage.items.map((c) => (
                  <tr key={c.id}>
                    <td style={{padding: 6, borderBottom: '1px solid #eee'}}>{c.id}</td>
                    <td style={{padding: 6, borderBottom: '1px solid #eee'}}>
                      {c.brandName || c.brand || 'GLOBAL'}
                    </td>
                    <td style={{padding: 6, borderBottom: '1px solid #eee'}}>
                      {c.storeName || c.store || '—'}
                    </td>
                    <td style={{padding: 6, borderBottom: '1px solid #eee'}}>
                      {c.accentColor || '—'}
                    </td>
                    <td style={{padding: 6, borderBottom: '1px solid #eee'}}>
                      <button
                        onClick={() => openEditor(c)}
                        disabled={!canEditTheme}
                        title={canEditTheme ? 'Edit config' : 'Editor role required'}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteConfig(c.id)}
                        style={{marginLeft: 8}}
                        disabled={!canDeleteThemeConfig}
                        title={canDeleteThemeConfig ? 'Delete config' : 'Editor role required'}
                      >
                        Delete
                      </button>
                      {c.studioUrl ? (
                        <a
                          href={c.studioUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{marginLeft: 8}}
                        >
                          Open in Studio
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{marginTop: 8, display: 'flex', gap: 8, alignItems: 'center'}}>
              <button
                disabled={configsPage.page <= 1 || configsLoading}
                onClick={() =>
                  loadConfigs({
                    page: configsPage.page - 1,
                    perPage: configsPage.perPage,
                    brand,
                    store: storeFilter,
                  })
                }
              >
                Prev
              </button>
              <span>
                Page {configsPage.page} • Showing {configsPage.perPage} per page
              </span>
              <button
                disabled={
                  configsPage.page * configsPage.perPage >= configsPage.total || configsLoading
                }
                onClick={() =>
                  loadConfigs({
                    page: configsPage.page + 1,
                    perPage: configsPage.perPage,
                    brand,
                    store: storeFilter,
                  })
                }
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>

      <section style={{marginTop: 32}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={{margin: 0}}>Theme details</h2>
          <button type="button" onClick={loadTheme} disabled={themeLoading}>
            {themeLoading ? 'Refreshing…' : 'Reload theme'}
          </button>
        </div>
        {themeError && (
          <div
            role="alert"
            style={{marginTop: 12, padding: 12, background: '#fee2e2', color: '#b91c1c'}}
          >
            Failed to load theme: {themeError}{' '}
            <button type="button" onClick={loadTheme}>
              Retry
            </button>
          </div>
        )}
        {themeLoading && (
          <div role="status" style={{marginTop: 12}}>
            Loading theme…
          </div>
        )}
        {theme && (
          <>
            <div style={{marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap'}}>
              <div>
                <strong>Brand:</strong> {theme.brand}
              </div>
              <div>
                <strong>Accent:</strong> {theme.accentColor || '—'}
              </div>
              <div>
                <strong>Surface:</strong> {theme.surfaceColor || '—'}
              </div>
              <div>
                <strong>Muted text:</strong> {theme.mutedTextColor || '—'}
              </div>
              <div>
                <strong>Dark mode:</strong> {theme.darkModeEnabled ? 'Yes' : 'No'}
              </div>
              <button
                onClick={() => openEditor(theme)}
                disabled={!canEditTheme}
                title={canEditTheme ? 'Edit theme' : 'Editor role required'}
              >
                Edit theme
              </button>
            </div>
            {theme.logoUrl && (
              <div style={{marginTop: 12}}>
                <img src={theme.logoUrl} alt="Brand logo" style={{maxWidth: 200}} />
              </div>
            )}
          </>
        )}
        {!theme && !themeLoading && !themeError && (
          <div style={{marginTop: 12}}>Load a brand theme to preview settings.</div>
        )}
      </section>

      {editing && (
        <div>
          <div
            style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1200}}
            onClick={() => {
              setEditing(false)
              setErrors({})
            }}
          />
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Edit theme configuration"
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1300,
              background: '#fff',
              padding: 20,
              borderRadius: 8,
              width: 900,
              maxWidth: '95%',
              maxHeight: '90%',
              overflow: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <h2 style={{margin: 0}}>Edit Theme Config</h2>
              <button
                onClick={() => {
                  setEditing(false)
                  setErrors({})
                }}
              >
                Close
              </button>
            </div>
            <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
              <div style={{minWidth: 220}}>
                <label style={{display: 'block'}}>Accent</label>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <input
                    type="color"
                    value={form.accentColor || '#000000'}
                    onChange={(e) => setForm({...form, accentColor: e.target.value})}
                    aria-label="Accent color"
                  />
                  <input
                    style={{flex: 1}}
                    value={form.accentColor}
                    placeholder="#RRGGBB"
                    onChange={(e) => setForm({...form, accentColor: e.target.value})}
                    aria-invalid={Boolean(errors.accentColor)}
                    aria-describedby={errors.accentColor ? fieldErrorIds.accentColor : undefined}
                  />
                </div>
                {errors.accentColor && (
                  <div id={fieldErrorIds.accentColor} role="alert" style={{color: 'red'}}>
                    {errors.accentColor}
                  </div>
                )}
              </div>

              <div style={{minWidth: 220}}>
                <label style={{display: 'block'}}>Surface</label>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <input
                    type="color"
                    value={form.surfaceColor || '#ffffff'}
                    onChange={(e) => setForm({...form, surfaceColor: e.target.value})}
                    aria-label="Surface color"
                  />
                  <input
                    style={{flex: 1}}
                    value={form.surfaceColor}
                    placeholder="#RRGGBB"
                    onChange={(e) => setForm({...form, surfaceColor: e.target.value})}
                    aria-invalid={Boolean(errors.surfaceColor)}
                    aria-describedby={errors.surfaceColor ? fieldErrorIds.surfaceColor : undefined}
                  />
                </div>
                {errors.surfaceColor && (
                  <div id={fieldErrorIds.surfaceColor} role="alert" style={{color: 'red'}}>
                    {errors.surfaceColor}
                  </div>
                )}
              </div>

              <div style={{minWidth: 220}}>
                <label style={{display: 'block'}}>Muted text</label>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <input
                    type="color"
                    value={form.mutedTextColor || '#666666'}
                    onChange={(e) => setForm({...form, mutedTextColor: e.target.value})}
                    aria-label="Muted text color"
                  />
                  <input
                    style={{flex: 1}}
                    value={form.mutedTextColor}
                    placeholder="#RRGGBB"
                    onChange={(e) => setForm({...form, mutedTextColor: e.target.value})}
                    aria-invalid={Boolean(errors.mutedTextColor)}
                    aria-describedby={
                      errors.mutedTextColor ? fieldErrorIds.mutedTextColor : undefined
                    }
                  />
                </div>
                {errors.mutedTextColor && (
                  <div id={fieldErrorIds.mutedTextColor} role="alert" style={{color: 'red'}}>
                    {errors.mutedTextColor}
                  </div>
                )}
              </div>

              <div style={{minWidth: 220}}>
                <label style={{display: 'block'}}>Dark mode</label>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={!!form.darkModeEnabled}
                      onChange={(e) => setForm({...form, darkModeEnabled: e.target.checked})}
                    />{' '}
                    Enable dark mode
                  </label>
                </div>
              </div>

              <div style={{minWidth: 220}}>
                <label style={{display: 'block'}}>Corner radius</label>
                <input
                  value={form.cornerRadius || ''}
                  onChange={(e) => setForm({...form, cornerRadius: e.target.value})}
                  placeholder="e.g. 6px or 8"
                />
              </div>

              <div style={{minWidth: 220}}>
                <label style={{display: 'block'}}>Elevation style</label>
                <input
                  value={form.elevationStyle || ''}
                  onChange={(e) => setForm({...form, elevationStyle: e.target.value})}
                  placeholder="e.g. soft, flat"
                />
              </div>
            </div>

            <div style={{marginTop: 12}}>
              <label>
                Logo URL:{' '}
                <input
                  value={form.logoUrl}
                  onChange={(e) => setForm({...form, logoUrl: e.target.value})}
                  aria-label="Logo URL"
                />
              </label>
              <div style={{marginTop: 6}}>
                <label>
                  Logo alt text:{' '}
                  <input
                    value={form.logoAlt || ''}
                    onChange={(e) => setForm({...form, logoAlt: e.target.value})}
                    placeholder="Alt text for accessibility"
                  />
                </label>
              </div>
              <div style={{marginTop: 6}}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  disabled={!canUploadThemeAssets || logoUploading}
                  onChange={async (e) => {
                    const f = e.target.files && e.target.files[0]
                    if (!f) return
                    const validationErrors = validateLogoFile(f)
                    if (validationErrors.length) {
                      setLogoError(validationErrors.join(' '))
                      e.target.value = ''
                      return
                    }
                    clearLogoError()
                    const url = await uploadLogo(f, f.name)
                    if (url) setForm((prev) => ({...prev, logoUrl: url}))
                  }}
                />
                <div style={{fontSize: 12, opacity: 0.8}}>
                  Allowed: PNG, JPG, SVG, WebP · Max {formatBytes(MAX_LOGO_BYTES)}
                </div>
                {!canUploadThemeAssets && (
                  <div style={{fontSize: 12, color: '#b91c1c'}}>
                    Org/Brand editor role required to upload logos.
                  </div>
                )}
                {logoUploading && <div style={{fontSize: 12}}>Uploading logo…</div>}
              </div>
              {errors.logoUpload && (
                <div role="alert" style={{color: 'red'}}>
                  {errors.logoUpload}
                </div>
              )}
              {!errors.logoUpload && errors._global && (
                <div role="alert" style={{color: 'red'}}>
                  {errors._global}
                </div>
              )}
            </div>

            <div style={{marginTop: 8, display: 'flex', gap: 8}}>
              <button onClick={save} disabled={pendingFieldErrors.length > 0 || !canEditTheme}>
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setErrors({})
                }}
              >
                Cancel
              </button>
            </div>

            <div style={{marginTop: 16}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <h3 style={{margin: 0}}>Preview</h3>
                <span
                  style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#e0f2fe',
                    color: '#0369a1',
                  }}
                  aria-live="polite"
                >
                  Unsaved changes preview
                </span>
              </div>
              <div
                style={{
                  padding: 12,
                  borderRadius: 6,
                  background: form.surfaceColor || '#fff',
                  color: form.mutedTextColor || '#000',
                  border: '1px solid #ddd',
                  marginTop: 8,
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      background: form.accentColor || '#000',
                      borderRadius: form.cornerRadius || 6,
                    }}
                  />
                  <div>
                    <div style={{fontSize: 18, fontWeight: 600}}>
                      {form.brand || brand || 'Brand name'}
                    </div>
                    <div style={{fontSize: 13, color: form.mutedTextColor || '#666'}}>
                      Sample subtitle / navigation
                    </div>
                  </div>
                </div>
                <p style={{marginTop: 12}}>
                  This is a sample paragraph to preview text color and background.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
