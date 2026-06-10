import { useState, useEffect } from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Alert, MenuItem, Chip,
  Collapse, Select, OutlinedInput, FormControl, InputLabel
} from '@mui/material'
import { Add, Edit, Delete, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import api from '../services/api'

const emptyProject = { name: '', description: '', status: 'Green', user_ids: [] }
const emptyDeliverable = { title: '', description: '', assigned_to: '', status: 'Not Started', rag_status: 'Green', depends_on: '' }

const RAG_COLORS = { Green: '#4caf50', Amber: '#ff9800', Red: '#f44336' }
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'Blocked']
const RAG_OPTIONS = ['Green', 'Amber', 'Red']

function RagChip({ value }) {
  return (
    <Chip
      label={value}
      size="small"
      sx={{ bgcolor: RAG_COLORS[value] || '#ccc', color: 'white', fontWeight: 'bold' }}
    />
  )
}

function DeliverableRow({ deliverable, allDeliverables, users, isViewer, isManager, onEdit, onDelete }) {
  const dependsOn = allDeliverables.find(d => d.id === deliverable.depends_on)
  return (
    <TableRow sx={{ bgcolor: '#fafafa' }}>
      <TableCell sx={{ pl: 6 }}>{deliverable.title}</TableCell>
      <TableCell>{deliverable.description || '-'}</TableCell>
      <TableCell>{deliverable.assigned_username || '-'}</TableCell>
      <TableCell>{deliverable.status}</TableCell>
      <TableCell><RagChip value={deliverable.rag_status} /></TableCell>
      <TableCell>{dependsOn ? dependsOn.title : '-'}</TableCell>
      {!isViewer && (
        <TableCell>
          <IconButton size="small" onClick={() => onEdit(deliverable)} color="primary"><Edit fontSize="small" /></IconButton>
          {!isManager && <IconButton size="small" onClick={() => onDelete(deliverable.id)} color="error"><Delete fontSize="small" /></IconButton>}
        </TableCell>
      )}
    </TableRow>
  )
}

function ProjectRow({ project, users, isViewer, isManager, onEditProject, onDeleteProject, user }) {
  const [open, setOpen] = useState(false)
  const [deliverables, setDeliverables] = useState([])
  const [addDeliverable, setAddDeliverable] = useState(false)
  const [editingDeliverable, setEditingDeliverable] = useState(null)
  const [form, setForm] = useState(emptyDeliverable)
  const [error, setError] = useState('')

  const loadDeliverables = async () => {
    const data = await api.getDeliverables(project.id)
    setDeliverables(Array.isArray(data) ? data : [])
  }

  const handleToggle = () => {
    if (!open) loadDeliverables()
    setOpen(!open)
  }

  const handleSaveDeliverable = async () => {
    if (!form.title) { setError('Title is required'); return }
    try {
      const data = {
        title: form.title,
        description: form.description || '',
        assigned_to: form.assigned_to || null,
        status: form.status,
        rag_status: form.rag_status,
        depends_on: form.depends_on || null
      }
      if (editingDeliverable) {
        await api.updateDeliverable(editingDeliverable.id, data)
      } else {
        await api.createDeliverable(project.id, data)
      }
      setAddDeliverable(false)
      setEditingDeliverable(null)
      setForm(emptyDeliverable)
      setError('')
      loadDeliverables()
    } catch (e) {
      setError('Failed to save deliverable')
    }
  }

  const handleDeleteDeliverable = async (id) => {
    if (!window.confirm('Delete this deliverable?')) return
    await api.deleteDeliverable(id)
    loadDeliverables()
  }

  const handleEditDeliverable = (d) => {
    setEditingDeliverable(d)
    setForm({ title: d.title, description: d.description || '', assigned_to: d.assigned_to || '', status: d.status, rag_status: d.rag_status, depends_on: d.depends_on || '' })
    setAddDeliverable(true)
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={handleToggle}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{project.name}</TableCell>
        <TableCell>{project.description || '-'}</TableCell>
        <TableCell><RagChip value={project.status} /></TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {project.users?.map(u => (
              <Chip key={u.id} label={u.username} size="small" variant="outlined" />
            ))}
          </Box>
        </TableCell>
        {!isViewer && (
          <TableCell>
            <IconButton onClick={() => onEditProject(project)} color="primary"><Edit /></IconButton>
            {!isManager && <IconButton onClick={() => onDeleteProject(project.id)} color="error"><Delete /></IconButton>}
          </TableCell>
        )}
      </TableRow>

      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">Deliverables</Typography>
                {!isViewer && (
                  <Button size="small" variant="contained" startIcon={<Add />}
                    onClick={() => { setEditingDeliverable(null); setForm(emptyDeliverable); setAddDeliverable(true) }}>
                    Add Deliverable
                  </Button>
                )}
              </Box>

              {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

              <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>RAG</TableCell>
                      <TableCell>Depends On</TableCell>
                      {!isViewer && <TableCell>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deliverables.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No deliverables yet</TableCell>
                      </TableRow>
                    ) : (
                      deliverables.map(d => (
                        <DeliverableRow
                          key={d.id}
                          deliverable={d}
                          allDeliverables={deliverables}
                          users={users}
                          isViewer={isViewer}
                          isManager={isManager}
                          onEdit={handleEditDeliverable}
                          onDelete={handleDeleteDeliverable}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      <Dialog open={addDeliverable} onClose={() => { setAddDeliverable(false); setError('') }}
        fullWidth maxWidth="sm" PaperProps={{ sx: { m: { xs: 1, sm: 2 }, width: '100%' } }}>
        <DialogTitle>{editingDeliverable ? 'Edit Deliverable' : 'Add Deliverable'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} fullWidth />
          <TextField label="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
          <TextField select label="Assigned To (optional)" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} fullWidth>
            <MenuItem value="">None</MenuItem>
            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}
          </TextField>
          <TextField select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} fullWidth>
            {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select label="RAG Status" value={form.rag_status} onChange={e => setForm({ ...form, rag_status: e.target.value })} fullWidth>
            {RAG_OPTIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <TextField select label="Depends On (optional)" value={form.depends_on} onChange={e => setForm({ ...form, depends_on: e.target.value })} fullWidth>
            <MenuItem value="">None</MenuItem>
            {deliverables.filter(d => !editingDeliverable || d.id !== editingDeliverable.id).map(d => (
              <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddDeliverable(false); setError('') }}>Cancel</Button>
          <Button onClick={handleSaveDeliverable} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default function ProjectsPage({ user }) {
  const isViewer = user?.role === 'Viewer'
  const isManager = user?.role === 'Manager'

  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyProject)
  const [error, setError] = useState('')

  useEffect(() => { loadProjects(); loadUsers() }, [])

  const loadProjects = async () => {
    try {
      const data = await api.getProjects()
      setProjects(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('Failed to load projects')
    }
  }

  const loadUsers = async () => {
    try {
      const data = await api.getUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {}
  }

  const openAdd = () => { setEditing(null); setForm(emptyProject); setOpen(true) }
  const openEdit = (project) => {
    setEditing(project)
    setForm({ name: project.name, description: project.description || '', status: project.status, user_ids: project.users?.map(u => u.id) || [] })
    setOpen(true)
  }
  const handleClose = () => { setOpen(false); setError('') }

  const handleSave = async () => {
    if (!form.name) { setError('Name is required'); return }
    try {
      if (editing) {
        await api.updateProject(editing.id, form)
      } else {
        await api.createProject(form)
      }
      handleClose()
      loadProjects()
    } catch (e) {
      setError('Failed to save project')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return
    await api.deleteProject(id)
    loadProjects()
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Projects</Typography>
        {!isViewer && (
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Project</Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Users</TableCell>
              {!isViewer && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No projects yet</TableCell>
              </TableRow>
            ) : (
              projects.map(project => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  users={users}
                  isViewer={isViewer}
                  isManager={isManager}
                  onEditProject={openEdit}
                  onDeleteProject={handleDelete}
                  user={user}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm"
        PaperProps={{ sx: { m: { xs: 1, sm: 2 }, width: '100%' } }}>
        <DialogTitle>{editing ? 'Edit Project' : 'Add Project'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
          <TextField select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} fullWidth>
            {RAG_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <FormControl fullWidth>
            <InputLabel>Assign Users</InputLabel>
            <Select
              multiple
              value={form.user_ids}
              onChange={e => setForm({ ...form, user_ids: e.target.value })}
              input={<OutlinedInput label="Assign Users" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map(id => {
                    const u = users.find(u => u.id === id)
                    return <Chip key={id} label={u?.username || id} size="small" />
                  })}
                </Box>
              )}
            >
              {users.map(u => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}