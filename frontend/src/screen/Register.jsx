import React, { useState,useContext } from 'react'
import {Link, useNavigate} from 'react-router-dom'
import Axios from '../config/axios.js'
import { useUser } from '../context/User.context.jsx'



const Register = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword ] = useState('')
    const navigate = useNavigate()
    const { user,setUser } = useUser() 
    
      const handleSubmit = async(e) => {
        e.preventDefault()
         await Axios.post('/users/register',{
          email,password
         }).then((res) => {
          console.log(res.data);

          localStorage.setItem('token',res.data.token)
          setUser(res.data.user)
          navigate('/')
          
         }).catch((err)=>{
           console.log(err.response.data)
         })

      }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 ">

      <div className=" bg-gray-800 p-8 rounded-lg shadow-lg shadow-lg w-full max-w-md ">

        <h2 className="text-3xl font-bold text-white mb-6 text-center"> Create your account</h2>

        <form onSubmit = {handleSubmit} className=" space-y-5">
          <div>
            <label className='block text-gray-300 mb-2' htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              className="w-full px-4 py-2 rounded bg-gray-700   text-white focus:outline-none focus:ring-2   focus:ring-blue-500 "
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required
              autoComplete="email" 
            />
          </div>
          <div>
            <label className='block text-gray-300 mb-2'
            htmlFor='password'>Password
            </label>
            <input 
              id="password"
              type="password" 
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2
              focus:ring-blue-500'
              value={password}
              onChange={(e) =>setPassword(e.target.value)}
              required
              autoComplete="current-password" 
            />
          </div>
          <button 
            type="submit"
            className="w-full py-2 bg-blue-400 hover:bg-blue-700 text-white font-semibold rounded transition " >
              Login
          </button>
        </form>
        <p className ="text-gray-400 mt-6 text-center">
          Already have an account ?{' '}
          <Link to="/login" className="text-blue-400       hover:underline">
            Sign in
          </Link>
          
        </p>
        
      </div>

    </div>
  )
}

export default Register