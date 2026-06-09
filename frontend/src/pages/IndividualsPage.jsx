import { useState, useEffect } from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Alert, FormControlLabel, Checkbox, MenuItem
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import api from '../services/api'

const empty = { name: '', role: '', team_id: '', location: '', is_direct: true }

export default function IndividualsPage({ user }) {
  const isViewer = user?.role === 'Viewer'
  const isManager = user?.role === 'Manager'

  const [individuals, setIndividuals] = useState([])
  const [teams, setTeams] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  useEffect(() => { loadIndividuals(); loadTeams() }, [])

  const loadIndividuals = async () => {
    try {
      const data = await api.getIndividuals()
      setIndividuals(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('Failed to load individuals')
    }
  }

  const loadTeams = async () => {
    try {
      const data = await api.getTeams()
      setTeams(Array.isArray(data) ? data : [])
    } catch (e) {}
  }

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true) }
  const openEdit = (ind) => {
    setEditing(ind)
    setForm({ name: ind.name, role: ind.role, team_id: ind.team_id || '', location: ind.location || '', is_direct: ind.is_direct })
    setOpen(true)
  }
  const handleClose = () => { setOpen(false); setError('') }

  const handleSave = async () => {
    if (!form.name || !form.role) { setError('Name and role are required'); return }
    try {
      const data = {
        name: form.name,
        role: form.role,
        location: form.location || null,
        team_id: form.team_id || null,
        is_direct: form.is_direct
      }
      if (editing) {
        await api.updateIndividual(editing.id, data)
      } else {
        await api.createIndividual(data)
      }
      handleClose()
      loadIndividuals()
    } catch (e) {
      setError('Failed to save individual')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this individual?')) return
    await api.deleteIndividual(id)
    loadIndividuals()
  }

  const getTeamName = (team_id) => {
    const team = teams.find(t => t.id === team_id)
    return team ? team.name : '-'
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Individuals</Typography>
        {!isViewer && (
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Individual</Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Direct</TableCell>
              {!isViewer && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {individuals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No individuals yet</TableCell>
              </TableRow>
            ) : (
              individuals.map(ind => (
                <TableRow key={ind.id}>
                  <TableCell>{ind.id}</TableCell>
                  <TableCell>{ind.name}</TableCell>
                  <TableCell>{ind.role}</TableCell>
                  <TableCell>{getTeamName(ind.team_id)}</TableCell>
                  <TableCell>{ind.location || '-'}</TableCell>
                  <TableCell>{ind.is_direct ? 'Yes' : 'No'}</TableCell>
                  {!isViewer && (
                    <TableCell>
                      <IconButton onClick={() => openEdit(ind)} color="primary"><Edit /></IconButton>
                      {!isManager && (
                        <IconButton onClick={() => handleDelete(ind.id)} color="error"><Delete /></IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Individual' : 'Add Individual'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} fullWidth />
          <TextField label="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} fullWidth />
          <TextField
            select label="Team (optional)" value={form.team_id}
            onChange={e => setForm({ ...form, team_id: e.target.value })} fullWidth
          >
            <MenuItem value="">None</MenuItem>
            {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </TextField>
          <FormControlLabel
            control={<Checkbox checked={form.is_direct} onChange={e => setForm({ ...form, is_direct: e.target.checked })} />}
            label="Direct Staff"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}