import React, { useState, useEffect } from 'react'
import { useUser } from '../context/User.context.jsx'
import axios from '../config/axios.js'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const Home = () => {
  const { user } = useUser()
  const [project, setProject] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showModal2, setShowModal2] = useState(false)
  const [projectName, setProjectName] = useState('')

  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    axios
      .post('/projects/create', { name: projectName })
      .then((res) => {
        setShowModal(false)
        setProjectName('')
        setProject([...project, res.data.project]) // instantly add new project
      })
      .catch((err) => {
        console.log(err)
      })
  }

  const LogoutHandleSubmit = () => {
    axios
      .get('/users/logout')
      .then(() => {
        setShowModal2(false)
        navigate('/login')
      })
      .catch((err) => {
        console.log(err)
      })
  }

  useEffect(() => {
    axios
      .post('/projects/my-projects')
      .then((res) => {
        setProject(res.data.projects)
      })
      .catch((error) => {
        console.log(error.message)
      })
  }, [])

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6 text-white overflow-hidden">
      
      {/* Floating New Project Button */}
      <motion.div
        whileHover={{ scale: 1.1, rotateY: 10 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="absolute top-4 left-4 cursor-pointer p-3 rounded-full border border-slate-600  backdrop-blur-lg shadow-lg flex items-center justify-center text-white hover:bg-blue-500 transition-all"
      >
        <i className="ri-add-line text-2xl"></i>
      </motion.div>



      {/* Floating Logout Button */}
      <motion.button
        whileHover={{ rotate: 180, scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-4 right-4 text-white"
        onClick={() => setShowModal2(true)}
      >
        <i className="ri-logout-box-line text-3xl"></i>
      </motion.button>

      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, type: "spring" }}
        className="text-5xl md:text-6xl font-extrabold text-center bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg mb-12"
      >
        Ideas in Motion
      </motion.h1>


      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-20">
        {project.map((project) => (
          <motion.div
            key={project._id}
            whileHover={{ scale: 1.05, rotateX: 5, rotateY: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              navigate(`/project`, { state: { project } })
            }
            className="cursor-pointer p-6 rounded-xl border border-slate-600 
              bg-gradient-to-br from-slate-700/40 to-slate-800/60 backdrop-blur-lg 
              shadow-xl hover:shadow-blue-600/40 transform-gpu transition-all relative"
          >
            <h2 className="text-lg font-bold mb-2">{project.name}</h2>
            <div className="flex gap-2 items-center text-sm">
              <i className="ri-user-line text-blue-400"></i>
              {project.users.length} Collaborators
            </div>
          </motion.div>
        ))}
      </div>


      {/* Modal for Create Project */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
          >
            <motion.div
              initial={{ scale: 0.7, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="bg-slate-900/90 text-white rounded-2xl p-6 shadow-2xl w-full max-w-sm"
            >
              <h2 className="text-xl font-bold mb-4">Create New Project</h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  required
                  className="w-full p-3 rounded-md border border-slate-600 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 2 - Logout Confirmation */}
      <AnimatePresence>
        {showModal2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-slate-900/95 text-white rounded-2xl p-6 shadow-2xl w-full max-w-sm"
            >
              <h2 className="text-lg font-bold mb-6">
                Are you sure you want to logout?
              </h2>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                  onClick={() => setShowModal2(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 rounded hover:bg-red-500"
                  onClick={LogoutHandleSubmit}
                >
                  Yes, Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default Home


