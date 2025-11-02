import React, { useState } from 'react'

const QuickTaskCreation = () => {
  const [taskText, setTaskText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    
    setIsSubmitting(true);
    // Add your submission logic here
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setTaskText('');
    }, 1000);
  };

  return (
    <div className='w-140 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl border border-zinc-700 shadow-2xl shadow-black/60 p-6'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='relative'>
          <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30'>
            <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
          </div>
          {isFocused && (
            <div className='absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50'></div>
          )}
        </div>
        <div>
          <p className='text-white text-base font-bold'>Quick Create</p>
          <p className='text-slate-400 text-xs'>Add a task instantly</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        {/* Input Field */}
        <div className='relative group'>
          <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl opacity-0 blur-lg transition-opacity duration-300 ${isFocused ? 'opacity-20' : 'group-hover:opacity-10'}`}></div>
          
          <div className='relative'>
            <div className='absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none'>
              <svg className={`w-5 h-5 transition-colors duration-300 ${isFocused || taskText ? 'text-blue-400' : 'text-slate-500'}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
              </svg>
            </div>
            
            <input
              type="text"
              placeholder='Remind me to...'
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full h-14 bg-gradient-to-br from-slate-900 to-zinc-900 pl-12 pr-4 outline-none text-white rounded-xl border-2 transition-all duration-300 placeholder:text-slate-500 ${
                isFocused 
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            />
            
            {taskText && (
              <button
                type="button"
                onClick={() => setTaskText('')}
                className='absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 transition-colors duration-200'
              >
                <svg className='w-3.5 h-3.5 text-slate-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            )}
          </div>

          {/* Character count */}
          {taskText && (
            <div className='absolute -bottom-5 right-0 text-xs text-slate-500'>
              {taskText.length} characters
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          disabled={!taskText.trim() || isSubmitting}
          className='relative group/btn mt-2 w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white font-semibold overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none'
        >
          {/* Animated background on hover */}
          <div className='absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300'></div>
          
          {/* Button content */}
          <div className='relative flex items-center justify-center gap-2'>
            {isSubmitting ? (
              <>
                <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                </svg>
                <span>Create Task</span>
              </>
            )}
          </div>

          {/* Shine effect on hover */}
          <div className='absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent'></div>
        </button>

        {/* Helper text */}
        <div className='flex items-center gap-2 text-slate-500 text-xs'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
          <span>Press Enter to create, or click the button</span>
        </div>
      </form>
    </div>
  )
}

export default QuickTaskCreation