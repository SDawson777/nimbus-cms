import React from 'react'
import {motion} from 'framer-motion'

/**
 * Card component revamped for 2025 award-winning UI.
 * Uses glassmorphism with gradient, blur, and subtle motion animations on hover.
 */
export default function Card({children, style = {}, ...rest}) {
  return (
    <motion.div
      initial={{opacity: 0.9, y: 12}}
      animate={{opacity: 1, y: 0}}
      whileHover={{scale: 1.03, boxShadow: '0 12px 32px rgba(0,0,0,0.12)'}}
      transition={{duration: 0.4, ease: 'easeOut'}}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.6))',
        backdropFilter: 'blur(16px)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
