import { Element } from '../types'

interface ElementIconProps {
  element: Element
  size?: number
  className?: string
}

export function ElementIcon({ element, size = 24, className = '' }: ElementIconProps) {
  if (element === 'normal') {
    return <span className={className} style={{ fontSize: size }}>⭐</span>
  }

  return (
    <img
      src={`/icons/elements/${element}.png`}
      alt={element}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}
