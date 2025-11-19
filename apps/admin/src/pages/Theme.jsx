import React, {useEffect, useState, useRef} from 'react'

export default function ThemePage() {
  const [theme, setTheme] = useState(null)
  const [brand, setBrand] = useState('')
  const [configsPage, setConfigsPage] = useState({items: [], total: 0, page: 1, perPage: 10})
  const [storeFilter, setStoreFilter] = useState('')
  const [editing, setEditing] = useState(false)
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
  const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

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

  useEffect(() => {
    // noop
  }, [])

  async function load() {
    try {
      if (!brand) return
      const res = await fetch(`/content/theme?brand=${encodeURIComponent(brand)}`)
      if (res.ok) {
        const j = await res.json()
        setTheme(j)
        setForm((prev) => ({
          ...prev,
          id: j.id,
          brand: j.brand || brand,
          store: j.store || '',
          accentColor: j.accentColor || j.primaryColor || '',
          surfaceColor: j.surfaceColor || j.backgroundColor || '',
          mutedTextColor: j.mutedTextColor || j.textColor || '',
          darkModeEnabled: !!j.darkModeEnabled,
          cornerRadius: j.cornerRadius || '',
          elevationStyle: j.elevationStyle || '',
          logoUrl: j.logoUrl || '',
        }))
      } else {
        setTheme(null)
      }
    } catch (err) {
      console.error(err)
      setTheme(null)
    }
  }

  async function loadConfigs(options = {}) {
    try {
      const page = options.page || configsPage.page || 1
      const perPage = options.perPage || configsPage.perPage || 10
      const brandFilter = options.brand || brand || ''
      const storeFilterOpt = (options.store ?? storeFilter) || ''
      const qs = new URLSearchParams()
      qs.set('page', String(page))
      qs.set('perPage', String(perPage))
      if (brandFilter) qs.set('brand', brandFilter)
      if (storeFilterOpt) qs.set('store', storeFilterOpt)
      const res = await fetch(`/api/admin/theme/configs?${qs.toString()}`, {credentials: 'include'})
      if (!res.ok) return setConfigsPage({items: [], total: 0, page, perPage})
      const j = await res.json()
      setConfigsPage({
        items: j.items || [],
        total: j.total || 0,
        page: j.page || page,
        perPage: j.perPage || perPage,
      })
    } catch (e) {
      console.error('failed load configs', e)
      setConfigsPage({items: [], total: 0, page: 1, perPage: configsPage.perPage || 10})
    }
  }

  async function save() {
    // client-side validation
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
      if (!payload.brand) payload.brand = brand
      const res = await fetch('/api/admin/theme/config', {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const j = await res.json()
        // simple inline confirmation
        setTheme(j.theme || j)
        setEditing(false)
        // refresh list
        await loadConfigs({page: configsPage.page, perPage: configsPage.perPage})
      } else {
        const err = await res.json().catch(() => ({}))
        setErrors({_global: err.error || 'Failed to save'})
      }
    } catch (e) {
      console.error(e)
      setErrors({_global: 'Failed to save'})
    }
  }

  function openEditor(item) {
    if (!item) {
      // new
      setForm({
        id: undefined,
        brand: brand || '',
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
      brand: item.brand || item.brandSlug || brand || '',
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
    if (!id) return
    if (!confirm('Delete this theme config?')) return
    try {
      const res = await fetch(`/api/admin/theme/config/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
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

  async function uploadLogo(dataUrl, filename) {
    // Accept either a File/Blob or a dataURL string. Try multipart first for better UX; fall back to JSON dataURL.
    try {
      if (
        typeof dataUrl === 'object' &&
        dataUrl !== null &&
        (dataUrl instanceof Blob || dataUrl.buffer)
      ) {
        // file/blob provided -> attempt multipart upload
        try {
          const fd = new FormData()
          fd.append('file', dataUrl, filename)
          const res = await fetch('/api/admin/upload-logo-multipart', {
            method: 'POST',
            credentials: 'include',
            body: fd,
          })
          if (res.ok) {
            const j = await res.json()
            if (j.assetId)
              setForm((prev) => ({...prev, logoUrl: j.url || prev.logoUrl, logoAssetId: j.assetId}))
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

      const res2 = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({filename, data: dataStr}),
      })
      if (!res2.ok) {
        const err = await res2.json().catch(() => ({}))
        setErrors({_global: err.error || 'Upload failed'})
        return null
      }
      const j2 = await res2.json()
      if (j2.assetId)
        setForm((prev) => ({...prev, logoUrl: j2.url || prev.logoUrl, logoAssetId: j2.assetId}))
      return j2.url || j2.assetId || null
    } catch (e) {
      console.error('uploadLogo failed', e)
      setErrors({_global: 'Upload failed'})
      return null
    }
  }

  return (
    <div style={{padding: 20}}>
      <h1>Theme Viewer</h1>
      <div style={{marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center'}}>
        <input placeholder="brand slug" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <input
          placeholder="store slug (optional)"
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
        />
        <button onClick={load} style={{marginLeft: 8}}>
          Load
        </button>
        <button
          onClick={() => loadConfigs({page: 1, brand, store: storeFilter})}
          style={{marginLeft: 8}}
        >
          List configs
        </button>
        <label style={{display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8}}>
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
        <button onClick={() => openEditor(null)} style={{marginLeft: 8}}>
          New config
        </button>
      </div>

      {Array.isArray(configsPage.items) && configsPage.items.length > 0 && (
        <div style={{marginTop: 12}}>
          <h3>Theme Configs (total: {configsPage.total})</h3>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
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
                    <button onClick={() => openEditor(c)}>Edit</button>
                    <button onClick={() => deleteConfig(c.id)} style={{marginLeft: 8}}>
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
              disabled={configsPage.page <= 1}
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
              disabled={configsPage.page * configsPage.perPage >= configsPage.total}
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
        </div>
      )}
      {theme ? (
        <div>
          <div>
            <strong>Brand:</strong> {theme.brand}
          </div>
          {!editing ? (
            <>
              <div>
                <strong>Accent:</strong> {theme.accentColor}
              </div>
              <div>
                <strong>Surface:</strong> {theme.surfaceColor}
              </div>
              <div>
                <strong>Muted text:</strong> {theme.mutedTextColor}
              </div>
              <div>
                <strong>Dark mode:</strong> {theme.darkModeEnabled ? 'Yes' : 'No'}
              </div>
              {theme.logoUrl && (
                <div>
                  <img src={theme.logoUrl} alt="logo" style={{maxWidth: 200}} />
                </div>
              )}
              <div style={{marginTop: 8}}>
                <button onClick={() => openEditor(theme)}>Edit</button>
              </div>
            </>
          ) : (
            // editor modal
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
                      />
                      <input
                        style={{flex: 1}}
                        value={form.accentColor}
                        placeholder="#RRGGBB"
                        onChange={(e) => setForm({...form, accentColor: e.target.value})}
                      />
                    </div>
                    {errors.accentColor && <div style={{color: 'red'}}>{errors.accentColor}</div>}
                  </div>

                  <div style={{minWidth: 220}}>
                    <label style={{display: 'block'}}>Surface</label>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <input
                        type="color"
                        value={form.surfaceColor || '#ffffff'}
                        onChange={(e) => setForm({...form, surfaceColor: e.target.value})}
                      />
                      <input
                        style={{flex: 1}}
                        value={form.surfaceColor}
                        placeholder="#RRGGBB"
                        onChange={(e) => setForm({...form, surfaceColor: e.target.value})}
                      />
                    </div>
                    {errors.surfaceColor && <div style={{color: 'red'}}>{errors.surfaceColor}</div>}
                  </div>

                  <div style={{minWidth: 220}}>
                    <label style={{display: 'block'}}>Muted text</label>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <input
                        type="color"
                        value={form.mutedTextColor || '#666666'}
                        onChange={(e) => setForm({...form, mutedTextColor: e.target.value})}
                      />
                      <input
                        style={{flex: 1}}
                        value={form.mutedTextColor}
                        placeholder="#RRGGBB"
                        onChange={(e) => setForm({...form, mutedTextColor: e.target.value})}
                      />
                    </div>
                    {errors.mutedTextColor && (
                      <div style={{color: 'red'}}>{errors.mutedTextColor}</div>
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
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files && e.target.files[0]
                        if (!f) return
                        const url = await uploadLogo(f, f.name)
                        if (url) setForm((prev) => ({...prev, logoUrl: url}))
                      }}
                    />
                  </div>
                  {errors._global && <div style={{color: 'red'}}>{errors._global}</div>}
                </div>

                <div style={{marginTop: 8}}>
                  <button
                    onClick={save}
                    disabled={Object.keys(errors).filter((k) => k !== '_global').length > 0}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setErrors({})
                    }}
                    style={{marginLeft: 8}}
                  >
                    Cancel
                  </button>
                </div>

                <div style={{marginTop: 16}}>
                  <h3>Preview</h3>
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 6,
                      background: form.surfaceColor || '#fff',
                      color: form.mutedTextColor || '#000',
                      border: '1px solid #ddd',
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

                <div style={{marginTop: 12, display: 'flex', gap: 8}}>
                  <button
                    onClick={save}
                    disabled={Object.keys(errors).filter((k) => k !== '_global').length > 0}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setErrors({})
                    }}
                    style={{marginLeft: 8}}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>No theme loaded</div>
      )}
    </div>
  )
}
