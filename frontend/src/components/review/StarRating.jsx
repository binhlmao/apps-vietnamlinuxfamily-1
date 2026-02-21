import { IconStar, IconStarOutline } from '../icons'

export default function StarRating({ rating, count, size = 'sm', interactive = false, onChange }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (interactive) {
      stars.push(
        <span
          key={i}
          onClick={() => onChange?.(i)}
          className={i <= rating ? 'star-filled' : 'star-empty'}
        >
          {i <= rating ? <IconStar /> : <IconStarOutline />}
        </span>
      )
    } else {
      stars.push(
        <span key={i} className={i <= rating ? 'star-filled' : 'star-empty'}>
          {i <= Math.round(rating) ? <IconStar /> : <IconStarOutline />}
        </span>
      )
    }
  }

  return (
    <span className={`stars ${interactive ? 'stars-interactive' : ''} ${size === 'lg' ? 'stars-lg' : ''}`}>
      {stars}
      {count !== undefined && <span className="rating-value">{rating.toFixed(1)} ({count})</span>}
    </span>
  )
}
