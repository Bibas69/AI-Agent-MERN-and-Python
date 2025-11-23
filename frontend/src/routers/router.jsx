import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import Home from '../pages/Home'
import SignupPage from '../pages/SignupPage'
import Login from '../pages/Login'
import CompleteDetail from '../pages/CompleteDetail'
import Tasks from '../pages/Tasks'
import Profile from '../pages/Profile'
import PrivateRoute from './PrivateRoute'

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login/>
    },
    {
        path: "/signup",
        element: <SignupPage />
    },
    {
        path:"/complete-detail",
        element: <PrivateRoute><CompleteDetail/></PrivateRoute>
    },
    {
        path: "/",
        element: <PrivateRoute><App /></PrivateRoute>,
        children: [
            {path: "/", element: <Home />},
            {path:"/task", element: <Tasks />},
            {path: "/profile", element: <Profile />}
        ]
    }
])

export default router