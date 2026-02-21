import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/useLocale.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { api } from '../lib/api'
import { categories as localCategories, allTags } from '../data/apps'
import { IconPlus, IconX, IconCheck, IconArrowLeft, IconChevronRight } from '../components/icons'
import './SubmitApp.css'

const STEPS = ['info', 'media', 'tags', 'preview']

export default function SubmitApp() {
  const { t, locale } = useLocale()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [categories, setCategories] = useState(localCategories)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    api.getCategories()
      .then(data => { if (data?.length) setCategories(data) })
      .catch(() => { })
  }, [])

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    shortDesc: '',
    description: '',
    categoryId: '',
    websiteUrl: '',
    downloadUrl: '',
    sourceCodeUrl: '',
    installCommand: '',
    license: '',
    packageTypes: [],
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [iconFile, setIconFile] = useState(null)
  const [iconPreview, setIconPreview] = useState(null)
  const [screenshots, setScreenshots] = useState([])
  const [screenshotPreviews, setScreenshotPreviews] = useState([])

  const processIconFile = (file) => {
    if (!file) return
    if (file.size > 200 * 1024) {
      alert(locale === 'vi' ? 'Icon tối đa 200KB' : 'Icon max 200KB')
      return
    }
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg']
    if (!validTypes.includes(file.type)) {
      alert(locale === 'vi' ? 'Chỉ chấp nhận SVG, PNG, JPG' : 'Only SVG, PNG, JPG accepted')
      return
    }
    setIconFile(file)
    setIconPreview(URL.createObjectURL(file))
  }

  const handleIconChange = (e) => processIconFile(e.target.files[0])

  const handleIconDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    processIconFile(e.dataTransfer.files[0])
  }

  const removeIcon = () => {
    setIconFile(null)
    if (iconPreview) URL.revokeObjectURL(iconPreview)
    setIconPreview(null)
  }

  const processScreenshotFiles = (files) => {
    const remaining = 5 - screenshots.length
    const validTypes = ['image/png', 'image/jpeg', 'image/webp']
    const valid = files.filter(f => f.size <= 2 * 1024 * 1024 && validTypes.includes(f.type)).slice(0, remaining)
    if (valid.length < files.length) {
      alert(locale === 'vi' ? 'Một số ảnh quá 2MB hoặc vượt giới hạn 5 ảnh' : 'Some images exceed 2MB or the 5 image limit')
    }
    setScreenshots(prev => [...prev, ...valid])
    setScreenshotPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))])
  }

  const handleScreenshots = (e) => processScreenshotFiles(Array.from(e.target.files))

  const handleScreenshotDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    processScreenshotFiles(Array.from(e.dataTransfer.files))
  }

  const removeScreenshot = (idx) => {
    URL.revokeObjectURL(screenshotPreviews[idx])
    setScreenshots(prev => prev.filter((_, i) => i !== idx))
    setScreenshotPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const togglePkg = (pkg) => {
    update('packageTypes', form.packageTypes.includes(pkg)
      ? form.packageTypes.filter(p => p !== pkg)
      : [...form.packageTypes, pkg]
    )
  }

  const addTag = (tag) => {
    const cleaned = tag.toLowerCase().trim().replace(/\s+/g, '-')
    if (cleaned && !form.tags.includes(cleaned) && form.tags.length < 10) {
      update('tags', [...form.tags, cleaned])
    }
    setTagInput('')
  }

  const removeTag = (tag) => {
    update('tags', form.tags.filter(t => t !== tag))
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  const suggestedTags = tagInput
    ? allTags.filter(t => t.name.includes(tagInput.toLowerCase())).slice(0, 5)
    : []

  if (!isLoggedIn) {
    return (
      <div className="submit-app">
        <div className="container">
          <div className="submit-login-prompt">
            <h2>{t('loginToReview')}</h2>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>{t('login')}</button>
          </div>
        </div>
      </div>
    )
  }

  const cat = categories.find(c => c.id === Number(form.categoryId))

  return (
    <div className="submit-app">
      <div className="container">
        <h1 className="submit-title">{t('submitAppTitle')}</h1>

        {/* Steps indicator */}
        <div className="steps-indicator">
          {STEPS.map((s, i) => (
            <div key={s} className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              {i < step ? <IconCheck style={{ width: 14, height: 14 }} /> : i + 1}
            </div>
          ))}
        </div>

        <div className="submit-card card">
          {/* Step 1: Basic Info */}
          {step === 0 && (
            <div className="submit-step">
              <h2>{t('step')} 1 — {locale === 'vi' ? 'Thông tin cơ bản' : 'Basic Info'}</h2>

              <div className="input-group">
                <label>{t('appName_field')} *</label>
                <input className="input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Firefox, GIMP, OBS..." />
              </div>

              <div className="input-group">
                <label>{t('shortDesc')} *</label>
                <input className="input" value={form.shortDesc} onChange={e => update('shortDesc', e.target.value)} maxLength={120} placeholder={t('shortDescHint')} />
                <span className="char-count">{form.shortDesc.length}/120</span>
              </div>

              <div className="input-group">
                <label>{t('fullDesc')} *</label>
                <textarea className="input" value={form.description} onChange={e => update('description', e.target.value)} rows={6} placeholder={t('fullDescHint')} />
              </div>

              <div className="input-group">
                <label>{t('category')} *</label>
                <select className="input" value={form.categoryId} onChange={e => update('categoryId', e.target.value)}>
                  <option value="">{t('selectCategory')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {t('category', cat.name_vi, cat.name_en)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>{t('website')}</label>
                  <input className="input" value={form.websiteUrl} onChange={e => update('websiteUrl', e.target.value)} placeholder="https://..." />
                </div>
                <div className="input-group">
                  <label>{t('download')}</label>
                  <input className="input" value={form.downloadUrl} onChange={e => update('downloadUrl', e.target.value)} placeholder="https://..." />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>{t('sourceCode')}</label>
                  <input className="input" value={form.sourceCodeUrl} onChange={e => update('sourceCodeUrl', e.target.value)} placeholder="https://github.com/..." />
                </div>
                <div className="input-group">
                  <label>{t('license')}</label>
                  <input className="input" value={form.license} onChange={e => update('license', e.target.value)} placeholder="GPL-3.0, MIT, Apache-2.0..." />
                </div>
              </div>

              <div className="input-group">
                <label>{t('installCommand')}</label>
                <input className="input" value={form.installCommand} onChange={e => update('installCommand', e.target.value)} placeholder="sudo apt install ..." style={{ fontFamily: 'monospace' }} />
              </div>

              <div className="input-group">
                <label>{t('packageTypes')}</label>
                <div className="pkg-toggles">
                  {['deb', 'flatpak', 'snap', 'appimage', 'source'].map(pkg => (
                    <button
                      key={pkg}
                      type="button"
                      className={`pkg-toggle ${form.packageTypes.includes(pkg) ? 'active' : ''}`}
                      onClick={() => togglePkg(pkg)}
                    >
                      {pkg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Media */}
          {step === 1 && (
            <div className="submit-step">
              <h2>{t('step')} 2 — {locale === 'vi' ? 'Hình ảnh' : 'Media'}</h2>

              <div className="input-group">
                <label>{t('iconUpload')}</label>
                {iconPreview ? (
                  <div className="upload-preview-single">
                    <img src={iconPreview} alt="Icon" className="icon-preview" />
                    <div className="upload-preview-info">
                      <span>{iconFile.name}</span>
                      <span className="upload-hint">{(iconFile.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button type="button" className="upload-remove" onClick={removeIcon}>
                      <IconX style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                ) : (
                  <label className="upload-zone" onDrop={handleIconDrop} onDragOver={e => e.preventDefault()} onDragEnter={e => e.preventDefault()}>
                    <input type="file" accept="image/svg+xml,image/png,image/jpeg" onChange={handleIconChange} hidden />
                    <IconPlus style={{ width: 32, height: 32, color: 'var(--text-muted)' }} />
                    <p>{t('dragOrClick')}</p>
                    <span className="upload-hint">{locale === 'vi' ? 'SVG, PNG hoặc JPG — tối đa 200KB' : 'SVG, PNG or JPG — max 200KB'}</span>
                  </label>
                )}
              </div>

              <div className="input-group">
                <label>{t('screenshotUpload')} ({screenshots.length}/5)</label>
                {screenshotPreviews.length > 0 && (
                  <div className="screenshot-grid">
                    {screenshotPreviews.map((src, i) => (
                      <div key={i} className="screenshot-thumb">
                        <img src={src} alt={`Screenshot ${i + 1}`} />
                        <button type="button" className="screenshot-remove" onClick={() => removeScreenshot(i)}>
                          <IconX style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {screenshots.length < 5 && (
                  <label className="upload-zone upload-zone-sm" onDrop={handleScreenshotDrop} onDragOver={e => e.preventDefault()} onDragEnter={e => e.preventDefault()}>
                    <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleScreenshots} hidden />
                    <IconPlus style={{ width: 24, height: 24, color: 'var(--text-muted)' }} />
                    <p>{t('dragOrClick')}</p>
                    <span className="upload-hint">{locale === 'vi' ? 'PNG/JPG/WebP, tối đa 2MB mỗi ảnh' : 'PNG/JPG/WebP, max 2MB each'}</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Tags */}
          {step === 2 && (
            <div className="submit-step">
              <h2>{t('step')} 3 — Tags</h2>

              <div className="input-group">
                <label>{t('tags')}</label>
                <div className="tag-input-wrapper">
                  <div className="tag-input-tags">
                    {form.tags.map(tag => (
                      <span key={tag} className="badge badge-tag active">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="tag-remove">
                          <IconX style={{ width: 12, height: 12 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    className="input"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={t('tagsHint')}
                    disabled={form.tags.length >= 10}
                  />
                  {suggestedTags.length > 0 && (
                    <div className="tag-suggestions">
                      {suggestedTags.map(tag => (
                        <button key={tag.name} type="button" className="tag-suggestion" onClick={() => addTag(tag.name)}>
                          {tag.name} <span className="tag-count">({tag.count})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="char-count">{form.tags.length}/10 tags</span>
              </div>

              <div className="popular-tags">
                <h4>{locale === 'vi' ? 'Tags phổ biến' : 'Popular tags'}</h4>
                <div className="tag-cloud">
                  {allTags.sort((a, b) => b.count - a.count).slice(0, 15).map(tag => (
                    <button
                      key={tag.name}
                      type="button"
                      className={`badge badge-tag ${form.tags.includes(tag.name) ? 'active' : ''}`}
                      onClick={() => form.tags.includes(tag.name) ? removeTag(tag.name) : addTag(tag.name)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 3 && (
            <div className="submit-step">
              <h2>{t('step')} 4 — {t('preview')}</h2>

              <div className="preview-card">
                <div className="preview-header">
                  {iconPreview ? (
                    <img src={iconPreview} alt="Icon" className="preview-icon-img" />
                  ) : (
                    <div className="preview-icon" style={{ background: form.name ? `hsl(${Math.abs([...form.name].reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0) % 360)}, 45%, 45%)` : '#999' }}>
                      {form.name ? form.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'}
                    </div>
                  )}
                  <div>
                    <h3>{form.name || (locale === 'vi' ? 'Tên ứng dụng' : 'App Name')}</h3>
                    {cat && (
                      <span className="app-card-category" style={{ background: cat.color }}>
                        {t('category', cat.name_vi, cat.name_en)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="preview-desc">{form.shortDesc || (locale === 'vi' ? 'Mô tả ngắn...' : 'Short description...')}</p>
                {form.packageTypes.length > 0 && (
                  <div className="preview-pkgs">
                    {form.packageTypes.map(pkg => (
                      <span key={pkg} className="badge badge-pkg" style={{ background: `var(--pkg-${pkg})` }}>{pkg}</span>
                    ))}
                  </div>
                )}
                {form.tags.length > 0 && (
                  <div className="preview-tags">
                    {form.tags.map(tag => <span key={tag} className="badge badge-tag">{tag}</span>)}
                  </div>
                )}
                {form.installCommand && (
                  <div className="preview-install">
                    <code>{form.installCommand}</code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="submit-nav">
            {step > 0 && (
              <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>
                <IconArrowLeft /> {t('back')}
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
                {t('next')} <IconChevronRight />
              </button>
            ) : (
              <button className="btn btn-primary" disabled={submitting} onClick={async () => {
                setSubmitting(true)
                setSubmitError('')
                try {
                  const appData = {
                    name: form.name,
                    short_desc: form.shortDesc,
                    description: form.description,
                    category_id: Number(form.categoryId),
                    website_url: form.websiteUrl,
                    download_url: form.downloadUrl,
                    source_code_url: form.sourceCodeUrl,
                    install_command: form.installCommand,
                    license: form.license,
                    package_types: form.packageTypes,
                    tags: form.tags,
                  }
                  const result = await api.createApp(appData)
                  // Upload icon
                  if (iconFile) {
                    await api.uploadIcon(result.id, iconFile).catch(() => { })
                  }
                  // Upload screenshots
                  for (const ss of screenshots) {
                    await api.uploadScreenshot(result.id, ss).catch(() => { })
                  }
                  navigate(`/app/${result.slug}`)
                } catch (err) {
                  setSubmitError(err.error || 'Submit failed')
                  setSubmitting(false)
                }
              }}>
                <IconCheck /> {submitting ? t('loading') : t('submit')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
