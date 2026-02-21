import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../i18n/useLocale.jsx'
import { api } from '../lib/api'
import sampleApps, { categories as localCategories, allTags } from '../data/apps'
import AppCard from '../components/app/AppCard'
import { IconSearch, IconTrendingUp, IconAward, IconClock, IconStar, IconChevronRight } from '../components/icons'
import './Home.css'

export default function Home() {
  const { t, locale } = useLocale()
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [apps, setApps] = useState(sampleApps)
  const [categories, setCategories] = useState(localCategories)

  // Fetch from API, fall back to mock data
  useEffect(() => {
    api.getApps({ limit: '50' })
      .then(data => { if (data.apps?.length) setApps(data.apps) })
      .catch(() => { })
    api.getCategories()
      .then(data => { if (data?.length) setCategories(data) })
      .catch(() => { })
  }, [])

  const featured = apps.filter(a => a.is_featured)
  const trending = [...apps].sort((a, b) => (b.review_count || 0) - (a.review_count || 0)).slice(0, 4)
  const newest = [...apps].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 4)
  const topRated = [...apps].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 4)

  const filtered = useMemo(() => {
    let list = apps
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        (a.short_desc || '').toLowerCase().includes(q) ||
        (a.short_desc_en || '').toLowerCase().includes(q) ||
        a.tags?.some(t => t.includes(q))
      )
    }
    if (selectedTags.length > 0) {
      list = list.filter(a => selectedTags.some(tag => a.tags?.includes(tag)))
    }
    return list
  }, [search, selectedTags, apps])

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const isSearching = search || selectedTags.length > 0

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">{t('heroTitle')}</h1>
          <p className="hero-subtitle">{t('heroSubtitle')}</p>
          <div className="search-bar hero-search">
            <IconSearch />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container">
        <div className="category-pills">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/browse?category=${cat.slug}`}
              className="category-pill"
              style={{ '--pill-color': cat.color }}
            >
              {t('category', cat.name_vi, cat.name_en)}
            </Link>
          ))}
        </div>
      </section>

      {/* Tag Cloud */}
      <section className="container tag-section">
        <div className="tag-cloud">
          {allTags.sort((a, b) => b.count - a.count).slice(0, 15).map(tag => (
            <button
              key={tag.name}
              className={`badge badge-tag ${selectedTags.includes(tag.name) ? 'active' : ''}`}
              onClick={() => toggleTag(tag.name)}
            >
              {locale === 'vi' ? (tag.name_vi || tag.name) : tag.name}
            </button>
          ))}
        </div>
      </section>

      <div className="container">
        {isSearching ? (
          <section className="section">
            <div className="section-title">
              <h2>{filtered.length} {t('appFound')}</h2>
            </div>
            {filtered.length > 0 ? (
              <div className="app-grid">{filtered.map(app => <AppCard key={app.id} app={app} />)}</div>
            ) : (
              <div className="empty-state">
                <IconSearch style={{ width: 48, height: 48, color: 'var(--text-muted)' }} />
                <h3>{t('noResults')}</h3>
                <p>{t('tryDifferent')}</p>
              </div>
            )}
          </section>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="section">
                <div className="section-title">
                  <h2><IconAward style={{ width: 24, height: 24, color: 'var(--accent)' }} /> {t('featured')}</h2>
                  <Link to="/browse?sort=featured" className="btn btn-secondary btn-sm">
                    {t('viewAll')} <IconChevronRight />
                  </Link>
                </div>
                <div className="app-grid">{featured.map(app => <AppCard key={app.id} app={app} />)}</div>
              </section>
            )}

            <section className="section">
              <div className="section-title">
                <h2><IconTrendingUp style={{ width: 24, height: 24, color: 'var(--accent)' }} /> {t('trending')}</h2>
                <Link to="/browse?sort=trending" className="btn btn-secondary btn-sm">
                  {t('viewAll')} <IconChevronRight />
                </Link>
              </div>
              <div className="app-grid">{trending.map(app => <AppCard key={app.id} app={app} />)}</div>
            </section>

            <section className="section">
              <div className="section-title">
                <h2><IconClock style={{ width: 24, height: 24, color: 'var(--accent)' }} /> {t('newest')}</h2>
                <Link to="/browse?sort=newest" className="btn btn-secondary btn-sm">
                  {t('viewAll')} <IconChevronRight />
                </Link>
              </div>
              <div className="app-grid">{newest.map(app => <AppCard key={app.id} app={app} />)}</div>
            </section>

            <section className="section">
              <div className="section-title">
                <h2><IconStar style={{ width: 24, height: 24, color: 'var(--star-filled)' }} /> {t('topRated')}</h2>
                <Link to="/browse?sort=top-rated" className="btn btn-secondary btn-sm">
                  {t('viewAll')} <IconChevronRight />
                </Link>
              </div>
              <div className="app-grid">{topRated.map(app => <AppCard key={app.id} app={app} />)}</div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
