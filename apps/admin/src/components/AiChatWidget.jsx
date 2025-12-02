import {useState} from 'react'
import Button from '../design-system/Button'
import Input from '../design-system/Input'

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage('')
    setMessages((prev) => [...prev, {role: 'user', content: userMessage}])
    setIsLoading(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_NIMBUS_API_URL}/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({message: userMessage}),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      setMessages((prev) => [...prev, {role: 'assistant', content: data.reply}])
    } catch (error) {
      console.error('AI chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again or contact support.',
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
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#3F7AFC',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        aria-label="Open AI chat"
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
            width: '400px',
            height: '600px',
            zIndex: 9998,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: '#3F7AFC',
              color: 'white',
              padding: '16px',
              fontWeight: 600,
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
              backgroundColor: '#F9FAFB',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.length === 0 && (
              <div style={{textAlign: 'center', color: '#6B7280', marginTop: '40px'}}>
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
                    backgroundColor: msg.role === 'user' ? '#3F7AFC' : '#E5E7EB',
                    color: msg.role === 'user' ? 'white' : '#111827',
                    wordWrap: 'break-word',
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
                    backgroundColor: '#E5E7EB',
                    color: '#6B7280',
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
              borderTop: '1px solid #E5E7EB',
              backgroundColor: 'white',
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
