import React from 'react'

type Props = {
  children: React.ReactNode
  variant?: 'primary'|'secondary'|'ghost'
  size?: 'sm'|'md'|'lg'
  disabled?: boolean
  onClick?: () => void
  type?: 'button'|'submit'|'reset'
}

export default function Button({children, variant='primary', size='md', disabled, onClick, type='button'}:Props){
  const bg = variant==='primary' ? '#3F7AFC' : variant==='secondary' ? '#E5E7EB' : 'transparent'
  const color = variant==='ghost' ? '#374151' : variant==='secondary' ? '#374151' : 'white'
  const pad = size==='sm' ? '6px 12px' : size==='lg' ? '12px 20px' : '8px 16px'
  const border = variant==='ghost' ? '1px solid #D1D5DB' : 'none'
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      background:bg,
      color,
      padding:pad,
      border,
      borderRadius:6,
      fontWeight:500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1
    }}>{children}</button>
  )
}
