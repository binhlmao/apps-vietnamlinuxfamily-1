import { IconStar } from '../icons'

export default function StarRating({ rating = 0, size = 16 }) {
  const stars = []
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.3

  for (let i = 0; i < 5; i++) {
    const filled = i < full || (i === full && hasHalf)
    stars.push(
      <IconStar
        key={i}
        style={{
          width: size,
          height: size,
          color: filled ? 'var(--star-filled, #f59e0b)' : 'var(--text-muted, #ccc)',
          fill: filled ? 'var(--star-filled, #f59e0b)' : 'none',
        }}
      />
    )
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {stars}
      {rating > 0 && <span style={{ marginLeft: 4, fontSize: size * 0.85, color: 'var(--text-secondary)' }}>{rating.toFixed(1)}</span>}
    </span>
  )
}
