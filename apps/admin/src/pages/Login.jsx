import React, {useState} from 'react'
import {useNavigate} from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/admin/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error || 'Login failed')
        return
      }
      // fetch /admin/me to bootstrap user
      await fetch('/admin/me', {credentials: 'include'})
      nav('/dashboard')
    } catch (err) {
      setError('Network error')
    }
  }

  return (
    <div style={{maxWidth: 420, margin: '4rem auto'}}>
      <h2>Admin Login</h2>
      <form onSubmit={submit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <button type="submit">Sign in</button>
        </div>
        {error && <div style={{color: 'red'}}>{error}</div>}
      </form>
    </div>
  )
}
