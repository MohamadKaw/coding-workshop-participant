import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material'
import TeamsPage from './pages/TeamsPage'
import IndividualsPage from './pages/IndividualsPage'
import AchievementsPage from './pages/AchievementsPage'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'

function NavBar({ user, onLogout }) {
  const location = useLocation()

  const navItems = [
    { label: 'Teams', path: '/' },
    { label: 'Individuals', path: '/individuals' },
    { label: 'Achievements', path: '/achievements' },
    { label: 'Projects', path: '/projects' },
  ]

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 0, mr: 4 }}>
          ACME Team Manager
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
          {navItems.map(item => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              color="inherit"
              variant={location.pathname === item.path ? 'outlined' : 'text'}
            >
              {item.label}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">
            {user.username} ({user.role})
          </Typography>
          <Button color="inherit" variant="outlined" size="small" onClick={onLogout}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (data) => {
    setUser(data)
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <BrowserRouter>
      <NavBar user={user} onLogout={handleLogout} />
      <Container maxWidth="lg" sx={{ mt: 4, px: { xs: 1, sm: 2, md: 3 } }}>
        <Routes>
      <Route path="/" element={<TeamsPage user={user} />} />
        <Route path="/individuals" element={<IndividualsPage user={user} />} />
        <Route path="/achievements" element={<AchievementsPage user={user} />} />
        <Route path="/projects" element={<ProjectsPage user={user} />} />
      </Routes>
      </Container>
    </BrowserRouter>
  )
}

export default App