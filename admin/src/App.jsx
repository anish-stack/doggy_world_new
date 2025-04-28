
import { Route, Routes } from 'react-router-dom'
import './App.css'

import SignInPage from './Pages/SignInPage'
import DashboardPage from './Pages/DashboardPage'
import NotFoundPage from './Pages/NotFoundPage'

function App() {

  return (
    <Routes>
      <Route path="/" Component={DashboardPage} />
      <Route path="/signin" Component={SignInPage} />
 
      <Route path="/dashboard/*" element={<DashboardPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
