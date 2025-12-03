import {useEffect, useState} from 'react'
import Button from '../design-system/Button'
import Input from '../design-system/Input'
import {apiBaseUrl, apiFetch} from '../lib/api'
import {safeJson} from '../lib/safeJson'

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const haptic = () => {
    if (document.body.classList.contains('a11y-reduce-motion')) return
    if (navigator?.vibrate) navigator.vibrate(10)
  }

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Welcome to Nimbus Concierge. I can summarize performance, suggest optimizations, or walk you through workflows.',
      },
    ])
  }, [])

  const handleSend = async () => {
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage('')
    setMessages((prev) => [...prev, {role: 'user', content: userMessage}])
    setIsLoading(true)

    const endpoint = apiBaseUrl()
    if (!endpoint) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm running in preview mode. Connect the Nimbus API URL to enable live answers. Meanwhile, I can summarize dashboards, outline workflows, or prep rollout checklists.",
        },
      ])
      setIsLoading(false)
      return
    }

    try {
      const response = await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({message: userMessage}),
      })

      const data = await safeJson(response, {})
      const reply = data?.reply
      const friendlyFallback =
        'I’m on it. If you need quick wins: review analytics > pipeline health, confirm compliance attestations, and refresh personalization to boost conversions.'

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply || friendlyFallback,
        },
      ])
    } catch (error) {
      console.error('AI chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I hit a snag talking to the concierge service. Try again shortly—here’s a quick playbook: check today’s metrics, review open deals, and publish any pending content.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => {
          haptic()
          setIsOpen(!isOpen)
        }}
        className="ai-launcher"
        aria-label="Open AI chat"
        aria-expanded={isOpen}
        aria-controls="ai-chat-panel"
      >
        💬
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '92px',
            right: '24px',
            width: '420px',
            height: '600px',
            zIndex: 9998,
            boxShadow: '0 22px 60px rgba(4, 6, 20, 0.5)',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(9,14,28,0.92), rgba(7,11,22,0.96))',
            display: 'flex',
            flexDirection: 'column',
          }}
          id="ai-chat-panel"
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #312e81 0%, #0ea5e9 100%)',
              color: 'white',
              padding: '16px',
              fontWeight: 700,
              letterSpacing: '0.01em',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Nimbus AI Assistant</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 4px',
              }}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              background: 'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.12), transparent 35%), rgba(4,7,15,0.85)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.length === 0 && (
              <div style={{textAlign: 'center', color: '#a5b4fc', marginTop: '40px'}}>
                <p style={{fontSize: '18px', marginBottom: '8px'}}>👋 Hello!</p>
                <p>I'm your Nimbus CMS assistant. Ask me anything about managing your content.</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #7c3aed, #22d3ee)'
                      : 'rgba(255,255,255,0.08)',
                    color: msg.role === 'user' ? 'white' : '#e5e7eb',
                    wordWrap: 'break-word',
                    border: msg.role === 'user'
                      ? '1px solid rgba(255,255,255,0.18)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{alignSelf: 'flex-start', maxWidth: '80%'}}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#c7d2fe',
                  }}
                >
                  Typing...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(8,12,20,0.96)',
              display: 'flex',
              gap: '8px',
            }}
          >
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              style={{flex: 1}}
            />
            <Button onClick={handleSend} disabled={!message.trim() || isLoading}>
              Send
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
