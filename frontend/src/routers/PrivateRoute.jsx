import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({children}) => {
    const {currentUser, loading} = useAuth();
    if(loading){
        return <div>Loading...</div>
    }
    if(currentUser){
        return children;
    }
    else{
        return <Navigate to = "/login" />
    }
}

export default PrivateRoute