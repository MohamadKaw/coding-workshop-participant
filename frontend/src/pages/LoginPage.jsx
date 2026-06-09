import { useState } from 'react'
import {
  Box, Button, TextField, Typography, Paper, Alert
} from '@mui/material'
import api from '../services/api'

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      setError('Username and password are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await api.login(form)
      if (data.token) {
        onLogin(data)
      } else {
        setError(data.error || 'Invalid username or password')
      }
    } catch (e) {
      setError('Login failed, please try again')
    }
    setLoading(false)
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Paper sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>ACME Team Manager</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Sign in to continue</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          label="Username" fullWidth sx={{ mb: 2 }}
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <TextField
          label="Password" type="password" fullWidth sx={{ mb: 3 }}
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <Button
          variant="contained" fullWidth size="large"
          onClick={handleLogin} disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Demo credentials:<br />
            admin / admin123 (full access)<br />
            manager / manager123 (no delete)<br />
            viewer / viewer123 (read only)
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}