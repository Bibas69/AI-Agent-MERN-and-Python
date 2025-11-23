import React from 'react'
import UpcomingTasks from '../components/UpcomingTasks'
import ViewAllTasks from '../components/ViewAllTasks'
import ChatTaskAssistant from '../components/ChatTaskAssistant'

const Tasks = () => {
  return (
    <div className='w-full min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 mt-16 sm:mt-20 md:mt-24 flex flex-col items-center gap-6 sm:gap-8 md:gap-10'>
      
      {/* Top Section - Chat Assistant & Upcoming Tasks */}
      <div className='w-full max-w-7xl flex flex-col-reverse lg:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 xl:gap-20'>
        
        {/* Chat Task Assistant */}
        <div className='w-full lg:w-1/2 order-2 lg:order-1'>
          <ChatTaskAssistant />
        </div>
        
        {/* Upcoming Tasks */}
        <div className='w-full lg:w-1/2 order-1 lg:order-2'>
          <UpcomingTasks />
        </div>
      </div>
      
      {/* Bottom Section - View All Tasks */}
      <div className='w-full max-w-7xl flex justify-center px-2 sm:px-4'>
        <div className='w-full flex justify-center'>
          <ViewAllTasks />
        </div>
      </div>
    </div>
  )
}

export default Tasks