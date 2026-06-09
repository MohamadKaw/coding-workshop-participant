import { useState, useEffect } from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Alert, MenuItem
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import api from '../services/api'

const empty = { title: '', description: '', team_id: '', month: '', year: '' }

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([])
  const [teams, setTeams] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  useEffect(() => { loadAchievements(); loadTeams() }, [])

  const loadAchievements = async () => {
    try {
      const data = await api.getAchievements()
      setAchievements(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('Failed to load achievements')
    }
  }

  const loadTeams = async () => {
    try {
      const data = await api.getTeams()
      setTeams(Array.isArray(data) ? data : [])
    } catch (e) {}
  }

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true) }
  const openEdit = (a) => {
    setEditing(a)
    setForm({ title: a.title, description: a.description || '', team_id: a.team_id || '', month: a.month, year: a.year })
    setOpen(true)
  }
  const handleClose = () => { setOpen(false); setError('') }

  const handleSave = async () => {
    if (!form.title || !form.team_id || !form.month || !form.year) {
      setError('Title, team, month and year are required'); return
    }
    try {
      if (editing) {
        await api.updateAchievement(editing.id, form)
      } else {
        await api.createAchievement(form)
      }
      handleClose()
      loadAchievements()
    } catch (e) {
      setError('Failed to save achievement')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this achievement?')) return
    await api.deleteAchievement(id)
    loadAchievements()
  }

  const getTeamName = (team_id) => {
    const team = teams.find(t => t.id === team_id)
    return team ? team.name : '-'
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Achievements</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Achievement</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Month</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {achievements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No achievements yet</TableCell>
              </TableRow>
            ) : (
              achievements.map(a => (
                <TableRow key={a.id}>
                  <TableCell>{a.id}</TableCell>
                  <TableCell>{a.title}</TableCell>
                  <TableCell>{getTeamName(a.team_id)}</TableCell>
                  <TableCell>{months[a.month - 1]}</TableCell>
                  <TableCell>{a.year}</TableCell>
                  <TableCell>{a.description || '-'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => openEdit(a)} color="primary"><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(a.id)} color="error"><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Achievement' : 'Add Achievement'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} fullWidth />
          <TextField label="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
          <TextField
            select label="Team" value={form.team_id}
            onChange={e => setForm({ ...form, team_id: e.target.value })} fullWidth
          >
            <MenuItem value="">Select a team</MenuItem>
            {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </TextField>
          <TextField
            select label="Month" value={form.month}
            onChange={e => setForm({ ...form, month: e.target.value })} fullWidth
          >
            <MenuItem value="">Select a month</MenuItem>
            {months.map((m, i) => <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>)}
          </TextField>
          <TextField label="Year" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}