import { useState, useEffect } from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Alert
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import api from '../services/api'

const empty = { name: '', location: '', leader_id: '' }

export default function TeamsPage({ user }) {
  const isViewer = user?.role === 'Viewer'
  const isManager = user?.role === 'Manager'

  const [teams, setTeams] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  useEffect(() => { loadTeams() }, [])

  const loadTeams = async () => {
    try {
      const data = await api.getTeams()
      setTeams(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('Failed to load teams')
    }
  }

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true) }
  const openEdit = (team) => { setEditing(team); setForm({ name: team.name, location: team.location, leader_id: team.leader_id || '' }); setOpen(true) }
  const handleClose = () => { setOpen(false); setError('') }

  const handleSave = async () => {
    if (!form.name || !form.location) { setError('Name and location are required'); return }
    try {
      const data = {
        name: form.name,
        location: form.location,
        leader_id: form.leader_id || null
      }
      if (editing) {
        await api.updateTeam(editing.id, data)
      } else {
        await api.createTeam(data)
      }
      handleClose()
      loadTeams()
    } catch (e) {
      setError('Failed to save team')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this team?')) return
    await api.deleteTeam(id)
    loadTeams()
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Teams</Typography>
        {!isViewer && (
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Team</Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Leader ID</TableCell>
              {!isViewer && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No teams yet</TableCell>
              </TableRow>
            ) : (
              teams.map(team => (
                <TableRow key={team.id}>
                  <TableCell>{team.id}</TableCell>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>{team.location}</TableCell>
                  <TableCell>{team.leader_id || '-'}</TableCell>
                  {!isViewer && (
                    <TableCell>
                      <IconButton onClick={() => openEdit(team)} color="primary"><Edit /></IconButton>
                      {!isManager && (
                        <IconButton onClick={() => handleDelete(team.id)} color="error"><Delete /></IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" 
        PaperProps={{ sx: { m: { xs: 1, sm: 2 }, width: '100%' } }}>
        <DialogTitle>{editing ? 'Edit Team' : 'Add Team'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} fullWidth />
          <TextField label="Leader ID (optional)" value={form.leader_id} onChange={e => setForm({ ...form, leader_id: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}