import React, {useEffect, useState} from 'react'

export default function ThemePage() {
  const [theme, setTheme] = useState(null)
  const [brand, setBrand] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    primaryColor: '',
    secondaryColor: '',
    backgroundColor: '',
    textColor: '',
    logoUrl: '',
    store: '',
    logoAssetId: '',
  })
  const [errors, setErrors] = useState({})
  const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

  // live validate color fields when they change so UI shows inline errors
  useEffect(() => {
    const newErrors = {...errors}
    if (form.primaryColor && !hexRegex.test(form.primaryColor))
      newErrors.primaryColor = 'Must be a hex color like #RRGGBB'
    else delete newErrors.primaryColor
    if (form.secondaryColor && !hexRegex.test(form.secondaryColor))
      newErrors.secondaryColor = 'Must be a hex color like #RRGGBB'
    else delete newErrors.secondaryColor
    if (form.backgroundColor && !hexRegex.test(form.backgroundColor))
      newErrors.backgroundColor = 'Must be a hex color like #RRGGBB'
    else delete newErrors.backgroundColor
    if (form.textColor && !hexRegex.test(form.textColor))
      newErrors.textColor = 'Must be a hex color like #RRGGBB'
    else delete newErrors.textColor
    // preserve global error if present
    const global = errors && errors._global
    if (global) newErrors._global = global
  setErrors(newErrors)
  }, [form.primaryColor, form.secondaryColor, form.backgroundColor, form.textColor])

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
        setForm({
          primaryColor: j.primaryColor || '',
          secondaryColor: j.secondaryColor || '',
          backgroundColor: j.backgroundColor || '',
          textColor: j.textColor || '',
          logoUrl: j.logoUrl || j.logoUrl || '',
          store: j.store || '',
        })
      } else {
        setTheme(null)
      }
    } catch (err) {
      console.error(err)
      setTheme(null)
    }
  }

  async function save() {
    // client-side validation
    const newErrors = {}
    if (form.primaryColor && !hexRegex.test(form.primaryColor))
      newErrors.primaryColor = 'Must be a hex color like #RRGGBB'
    if (form.secondaryColor && !hexRegex.test(form.secondaryColor))
      newErrors.secondaryColor = 'Must be a hex color like #RRGGBB'
    if (form.backgroundColor && !hexRegex.test(form.backgroundColor))
      newErrors.backgroundColor = 'Must be a hex color like #RRGGBB'
    if (form.textColor && !hexRegex.test(form.textColor))
      newErrors.textColor = 'Must be a hex color like #RRGGBB'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      const payload = {brand, ...form}
      const res = await fetch('/api/admin/theme', {
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
      } else {
        const err = await res.json().catch(() => ({}))
        setErrors({_global: err.error || 'Failed to save'})
      }
    } catch (e) {
      console.error(e)
      setErrors({_global: 'Failed to save'})
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
      <div style={{marginBottom: 12}}>
        <input placeholder="brand slug" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <button onClick={load} style={{marginLeft: 8}}>
          Load
        </button>
      </div>
      {theme ? (
        <div>
          <div>
            <strong>Brand:</strong> {theme.brand}
          </div>
          {!editing ? (
            <>
              <div>
                <strong>Primary:</strong> {theme.primaryColor}
              </div>
              <div>
                <strong>Secondary:</strong> {theme.secondaryColor}
              </div>
              <div>
                <strong>Background:</strong> {theme.backgroundColor}
              </div>
              <div>
                <strong>Text:</strong> {theme.textColor}
              </div>
              {theme.logoUrl && (
                <div>
                  <img src={theme.logoUrl} alt="logo" style={{maxWidth: 200}} />
                </div>
              )}
              <div style={{marginTop: 8}}>
                <button onClick={() => setEditing(true)}>Edit</button>
              </div>
            </>
          ) : (
            <div style={{marginTop: 8}}>
              <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
                <div style={{minWidth: 220}}>
                  <label style={{display: 'block'}}>Primary</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <input
                      type="color"
                      value={form.primaryColor || '#000000'}
                      onChange={(e) => setForm({...form, primaryColor: e.target.value})}
                    />
                    <input
                      style={{flex: 1}}
                      value={form.primaryColor}
                      placeholder="#RRGGBB"
                      onChange={(e) => setForm({...form, primaryColor: e.target.value})}
                    />
                  </div>
                  {errors.primaryColor && <div style={{color: 'red'}}>{errors.primaryColor}</div>}
                </div>

                <div style={{minWidth: 220}}>
                  <label style={{display: 'block'}}>Secondary</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <input
                      type="color"
                      value={form.secondaryColor || '#000000'}
                      onChange={(e) => setForm({...form, secondaryColor: e.target.value})}
                    />
                    <input
                      style={{flex: 1}}
                      value={form.secondaryColor}
                      placeholder="#RRGGBB"
                      onChange={(e) => setForm({...form, secondaryColor: e.target.value})}
                    />
                  </div>
                  {errors.secondaryColor && (
                    <div style={{color: 'red'}}>{errors.secondaryColor}</div>
                  )}
                </div>

                <div style={{minWidth: 220}}>
                  <label style={{display: 'block'}}>Background</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <input
                      type="color"
                      value={form.backgroundColor || '#ffffff'}
                      onChange={(e) => setForm({...form, backgroundColor: e.target.value})}
                    />
                    <input
                      style={{flex: 1}}
                      value={form.backgroundColor}
                      placeholder="#RRGGBB"
                      onChange={(e) => setForm({...form, backgroundColor: e.target.value})}
                    />
                  </div>
                  {errors.backgroundColor && (
                    <div style={{color: 'red'}}>{errors.backgroundColor}</div>
                  )}
                </div>

                <div style={{minWidth: 220}}>
                  <label style={{display: 'block'}}>Text</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <input
                      type="color"
                      value={form.textColor || '#000000'}
                      onChange={(e) => setForm({...form, textColor: e.target.value})}
                    />
                    <input
                      style={{flex: 1}}
                      value={form.textColor}
                      placeholder="#RRGGBB"
                      onChange={(e) => setForm({...form, textColor: e.target.value})}
                    />
                  </div>
                  {errors.textColor && <div style={{color: 'red'}}>{errors.textColor}</div>}
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
                    background: form.backgroundColor || '#fff',
                    color: form.textColor || '#000',
                    border: '1px solid #ddd',
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        background: form.primaryColor || '#000',
                        borderRadius: 6,
                      }}
                    />
                    <div>
                      <div style={{fontSize: 18, fontWeight: 600}}>{brand || 'Brand name'}</div>
                      <div style={{fontSize: 13, color: form.textColor || '#000'}}>
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
          )}
        </div>
      ) : (
        <div>No theme loaded</div>
      )}
    </div>
  )
}
