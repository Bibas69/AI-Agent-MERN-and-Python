import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

const App = () => {
  return (
    <div className='w-full h-full p-2 bg-primary'>
      <Navbar />
      <Outlet />
    </div>
  )
}

export default App