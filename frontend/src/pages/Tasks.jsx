import React from 'react'
import QuickTaskCreation from '../components/QuickTaskCreation'
import UpcomingTasks from '../components/UpcomingTasks'
import ViewAllTasks from '../components/ViewAllTasks'

const Tasks = () => {
  return (
    <div className='w-full h-full mt-24 flex flex-col items-center gap-10'>
      <div className='w-full h-full mt-6 flex items-center justify-center gap-20'>
        <QuickTaskCreation />
        <UpcomingTasks />
      </div>
      <div className='w-[90%] h-full flex justify-center'>
        <ViewAllTasks />
      </div>
    </div>
  )
}

export default Tasks