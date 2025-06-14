import React from 'react'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Login from '../screen/Login.jsx'
import Register from '../screen/Register.jsx'
import Home from '../screen/Home.jsx'
import Project from '../screen/Project.jsx'


const AppRoutes = () => {
  return (
    <BrowserRouter>
    
    <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>

        <Route path="/register" element={<Register/>}/>
        <Route path="/project" element={<Project/>}/>
        
    </Routes>

    </BrowserRouter>
  )
}

export default AppRoutes