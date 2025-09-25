import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Axios from '../config/axios'
import { useUser } from '../context/User.context.jsx'
import { motion } from 'framer-motion'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { setUser } = useUser()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await Axios.post('/users/login', { email, password })
      .then((res) => {
        localStorage.setItem('token', res.data.token)
        setUser(res.data.user)
        navigate('/')
      })
      .catch((err) => console.log(err.response.data))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black relative overflow-hidden">
      {/* Floating animated mechanical gears */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
        className="absolute top-10 left-10 w-32 h-32 border-4 border-blue-500 rounded-full border-dashed opacity-20"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 45, ease: 'linear' }}
        className="absolute bottom-10 right-16 w-48 h-48 border-4 border-blue-400 rounded-full border-dashed opacity-15"
      />

      {/* Glassmorphic Login Card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        className="relative bg-white/10 backdrop-blur-xl border border-slate-600 rounded-3xl p-10 w-full max-w-md shadow-2xl text-white"
      >
        <h2 className="text-3xl font-bold text-center mb-8 tracking-wide">Sign in</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block mb-2 text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
              placeholder="your@email.com"
            />
          </div>
          <div className="relative">
            <label className="block mb-2 text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
              placeholder="********"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05, rotateZ: 2 }}
            whileTap={{ scale: 0.95, rotateZ: -2 }}
            type="submit"
            className="w-full py-3 bg-blue-900 hover:bg-slate-400 rounded-xl font-semibold text-white shadow-lg shadow-slate-400/50 transition-all"
          >
            Login
          </motion.button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:underline">
            Create one
          </Link>
        </p>

        {/* Floating small animated particles (mechanical effect) */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute -top-5 -left-5 w-5 h-5 rounded-full bg-blue-500 opacity-60"
        />
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="absolute -bottom-5 -right-5 w-4 h-4 rounded-full bg-blue-400 opacity-50"
        />
      </motion.div>
    </div>
  )
}

export default Login
