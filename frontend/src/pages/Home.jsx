import React from 'react'
import AssistantPannel from '../components/AssistantPannel'
import SmartNotification from '../components/SmartNotification'
import EmptySlots from '../components/EmptySlots'
import UpcomingTasks from '../components/UpcomingTasks'
import Summary from '../components/Summary'
import InProgressTask from '../components/InProgressTask'
import ChatTaskAssistant from '../components/ChatTaskAssistant'

const Home = () => {
  return (
    <div className='w-full h-full px-4 sm:px-6'>

      {/* TOP SECTION */}
      <div className='w-full h-220 lg:h-125 flex flex-col lg:flex-row items-center justify-center gap-14 lg:gap-20 mt-6 lg:mt-26'>

        <div className='w-full lg:w-96 h-80 flex items-center justify-center rounded-xl'>
          <AssistantPannel />
        </div>

        <div className='w-100 md:w-160 lg:w-160 h-96 flex items-center rounded-xl mt-4'>
          <ChatTaskAssistant />
        </div>

      </div>

      {/* MIDDLE SECTION */}
      <div className='w-full flex flex-col lg:flex-row lg:h-80 h-170 mt-6 p-4 md:p-0 items-center justify-center gap-10 rounded-xl'>
        <InProgressTask />
        <SmartNotification />
      </div>

      {/* BOTTOM SECTION */}
      <div className="w-full flex md:flex-col flex-col-reverse lg:flex-row items-center justify-center gap-10 lg:gap-10 py-6">

        {/* Upcoming Tasks - goes bottom on mobile */}
        <div className='w-full lg:w-[40%]'>
            <UpcomingTasks />
        </div>

        {/* Right side with EmptySlots & Summary */}
        <div className="w-full lg:w-[50%] flex flex-col sm:flex-row items-center justify-center gap-10">
          <EmptySlots />
          <Summary />
        </div>
      </div>
    </div>
  )
}

export default Home
