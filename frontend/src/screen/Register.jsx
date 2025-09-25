import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Axios from '../config/axios.js'
import { useUser } from '../context/User.context.jsx'
import { motion } from 'framer-motion'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { setUser } = useUser()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await Axios.post('/users/register', { email, password })
      .then((res) => {
        localStorage.setItem('token', res.data.token)
        setUser(res.data.user)
        navigate('/')
      })
      .catch((err) => console.log(err.response.data))
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black overflow-hidden">

      {/* Celestial floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ x: [0, Math.random() * 20 - 10, 0], y: [0, Math.random() * 15 - 7, 0] }}
          transition={{ repeat: Infinity, duration: 2 + Math.random() * 3, ease: 'easeInOut' }}
          className={`absolute w-2 h-2 rounded-full bg-blue-400 opacity-40 top-${Math.random() * 100} left-${Math.random() * 100}`}
        />
      ))}

      {/* Rotating mechanical gears */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ repeat: Infinity, duration: 25 + i * 5, ease: 'linear' }}
          className={`absolute rounded-full border border-blue-500 opacity-20 w-${20 + i * 10} h-${20 + i * 10} top-${5 + i * 15} left-${10 + i * 20}`}
        />
      ))}

      {/* Glassmorphic 3D Register Card */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 120 }}
        className="relative bg-white/10 backdrop-blur-3xl border border-slate-500 rounded-3xl p-10 w-full max-w-md shadow-2xl shadow-blue-900/50 text-white z-10"
      >
        <h2 className="text-3xl font-bold text-center mb-8 tracking-wider text-slate-200">
          Create Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block mb-2 text-gray-300">Email</label>
            <motion.input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(59, 130, 246, 0.6)' }}
              className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner transition-all"
            />
          </div>
          <div className="relative">
            <label className="block mb-2 text-gray-300">Password</label>
            <motion.input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="********"
              whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(59, 130, 246, 0.6)' }}
              className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner transition-all"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05, rotateZ: 2, boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' }}
            whileTap={{ scale: 0.95, rotateZ: -2 }}
            type="submit"
            className="w-full py-3 bg-blue-900 hover:bg-slate-500 rounded-xl font-semibold text-white shadow-lg shadow-slate-400/50 transition-all"
          >
            Register
          </motion.button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>

        {/* Floating small mechanical particles */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute -top-5 -left-5 w-3 h-3 rounded-full bg-blue-500 opacity-60"
        />
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="absolute -bottom-5 -right-5 w-3 h-3 rounded-full bg-blue-400 opacity-50"
        />
      </motion.div>
    </div>
  )
}

export default Register
