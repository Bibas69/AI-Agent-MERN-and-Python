import React from 'react'
import UpcomingTasks from '../components/UpcomingTasks'
import ViewAllTasks from '../components/ViewAllTasks'
import ChatTaskAssistant from '../components/ChatTaskAssistant'

const Tasks = () => {
  return (
    <div className='w-full h-full mt-24 flex flex-col items-center gap-10'>
      <div className='w-full h-full mt-6 flex items-center justify-center gap-20'>
        <div className='w-[50%] ml-25'>
          <ChatTaskAssistant />
        </div>
        <div className='w-[50%]'>
          <UpcomingTasks />
        </div>
      </div>
      <div className='w-[90%] h-full flex justify-center'>
        <ViewAllTasks />
      </div>
    </div>
  )
}

export default Tasks