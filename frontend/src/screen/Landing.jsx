import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black overflow-hidden text-white">
      
      {/* Floating celestial particles */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            x: [0, Math.random() * 30 - 15, 0],
            y: [0, Math.random() * 30 - 15, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + Math.random() * 4,
            ease: "easeInOut",
          }}
          className="absolute w-1.5 h-1.5 rounded-full bg-blue-400/70"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* Rotating mechanical gear rings */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ repeat: Infinity, duration: 40 + i * 10, ease: "linear" }}
          className={`absolute border border-blue-500/20 rounded-full`}
          style={{
            width: `${200 + i * 120}px`,
            height: `${200 + i * 120}px`,
          }}
        />
      ))}

      {/* Glassmorphic Landing Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="relative z-10 bg-white/10 backdrop-blur-2xl border border-slate-600 rounded-3xl shadow-2xl shadow-blue-900/40 max-w-3xl mx-auto p-10 text-center"
      >
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-200 tracking-wide">
          Welcome to Project Hub 🚀
        </h1>
        <p className="text-gray-300 mb-6 leading-relaxed">
          Collaborate, build, and manage your projects with ease.  
          Create new projects, invite collaborators, and explore your work in an interactive 3D-inspired space.  
        </p>

        {/* Notes about features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8">
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-600">
            <h3 className="text-slate-200 font-semibold mb-2">⚡ Instant Project Creation</h3>
            <p className="text-gray-400 text-sm">
              Quickly start new projects and manage everything in one place.
            </p>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-600">
            <h3 className="text-slate-200 font-semibold mb-2">👥 Team Collaboration</h3>
            <p className="text-gray-400 text-sm">
              Add collaborators, share ideas, and work together seamlessly.
            </p>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-600">
            <h3 className="text-slate-200 font-semibold mb-2">🔒 Secure Access</h3>
            <p className="text-gray-400 text-sm">
              Login safely and keep your projects protected with JWT security.
            </p>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-600">
            <h3 className="text-slate-200 font-semibold mb-2">✨ Modern UI</h3>
            <p className="text-gray-400 text-sm">
              Enjoy a futuristic, glassmorphic design with animations and 3D vibes.
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/login"
            className="px-6 py-3 bg-blue-800 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-900/40 transition-all font-semibold"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 bg-green-800 hover:bg-green-500 rounded-xl shadow-lg shadow-green-900/40 transition-all font-semibold"
          >
            Create Account
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-purple-800 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-900/40 transition-all font-semibold"
          >
            Home
          </Link>
          
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;
