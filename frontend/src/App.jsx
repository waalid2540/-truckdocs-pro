import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from './api/axios'

// Import pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AIAssistant from './pages/AIAssistant'
import ReceiptScanner from './pages/ReceiptScanner'
import SignaturePad from './pages/SignaturePad'
import Documents from './pages/Documents'
import Invoices from './pages/Invoices'
import Expenses from './pages/Expenses'
import IFTA from './pages/IFTA'
import Settings from './pages/Settings'
import Pricing from './pages/Pricing'
import Subscribe from './pages/Subscribe'
// Load Board pages
import LoadBoard from './pages/LoadBoard'
import LoadBoardComingSoon from './pages/LoadBoardComingSoon'
import PostLoad from './pages/PostLoad'
import MyBookings from './pages/MyBookings'

// Components
import InstallPrompt from './components/InstallPrompt'

// Context for auth
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* PWA Install Prompt */}
        <InstallPrompt />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
          <Route path="/receipt-scanner" element={<ProtectedRoute><ReceiptScanner /></ProtectedRoute>} />
          <Route path="/signature" element={<ProtectedRoute><SignaturePad /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/ifta" element={<ProtectedRoute><IFTA /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
          {/* LOAD BOARD ROUTES */}
          <Route path="/load-board" element={<ProtectedRoute><LoadBoardComingSoon /></ProtectedRoute>} />
          <Route path="/post-load" element={<ProtectedRoute><LoadBoardComingSoon /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><LoadBoardComingSoon /></ProtectedRoute>} />

          {/* Catch-all route for 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default App
