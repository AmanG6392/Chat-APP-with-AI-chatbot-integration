import React , {useContext, useEffect, useState, version}from 'react'
import { UserContext } from '../context/User.context.jsx'
import { useNavigate } from 'react-router-dom'
import Axios from '../config/axios.js'




const UserAuth = ({children }) => {


    const { user, setUser } = useContext( UserContext)
    const [loading, setLoading] = useState(true)
    const token = localStorage.getItem('token')
    const navigate = useNavigate()


    useEffect( () =>{

         if(user){

            setLoading(false)
        }

        const token = localStorage.getItem('token')

        const fetchUser = async () => {
            try {
            const res = await Axios.get('/auth/me')
            setUser(res.data) // Store in context
            setLoading(false)
            } 
            catch (err) {
            console.error('Auth check failed:', err)
            localStorage.removeItem('token')
             navigate(`/login`)
            }
        }

        // If no token, go to login
        if (!token) {
          navigate(`/login`)
          return
        }
     
        // If token exists but no user, go to register
        if (!user) {

            fetchUser()
            

        }
        else(
            setLoading(false)
        )
    


        
        
    },[token, user, navigate])



    if (loading) {

        return (
             <div> 
                 Loading....
             </div>
            )

    }

    

    return (
        <>
          
           {children}

        </>
    )
}

export default UserAuth