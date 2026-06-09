import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material'
import TeamsPage from './pages/TeamsPage'
import IndividualsPage from './pages/IndividualsPage'
import AchievementsPage from './pages/AchievementsPage'

function NavBar() {
  const location = useLocation()

  const navItems = [
    { label: 'Teams', path: '/' },
    { label: 'Individuals', path: '/individuals' },
    { label: 'Achievements', path: '/achievements' },
  ]

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 0, mr: 4 }}>
          ACME Team Manager
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
      </Toolbar>
    </AppBar>
  )
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<TeamsPage />} />
          <Route path="/individuals" element={<IndividualsPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
        </Routes>
      </Container>
    </BrowserRouter>
  )
}

export default App