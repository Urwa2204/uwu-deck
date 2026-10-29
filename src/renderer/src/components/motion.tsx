import { ReactNode } from 'react'
import { motion, Variants } from 'motion/react'

/*
 * Small animation primitives built on the `motion` package, following the same patterns as
 * Motion Primitives' "animated-group" and "text-effect". They are plain CSS-friendly (no Tailwind)
 * and never animate `filter`, which would break the glass backdrop blur on cards.
 */

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } }
}
const item: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', bounce: 0.2, duration: 0.55 } }
}

export function AnimatedGroup({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <motion.div className={className} variants={container} initial="hidden" animate="visible">
      {children}
    </motion.div>
  )
}

export function AnimatedItem({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  )
}

const word: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }

/** Reveals text word by word. Screen readers get the full sentence immediately. */
export function TextEffect({ children, className }: { children: string; className?: string }): JSX.Element {
  const words = children.split(' ')
  return (
    <motion.span
      className={className}
      aria-label={children}
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
    >
      {words.map((w, i) => (
        <motion.span key={i} aria-hidden style={{ display: 'inline-block', whiteSpace: 'pre' }} variants={word}>
          {w + (i < words.length - 1 ? ' ' : '')}
        </motion.span>
      ))}
    </motion.span>
  )
}
