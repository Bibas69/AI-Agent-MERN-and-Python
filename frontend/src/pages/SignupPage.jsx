import React, { useState } from 'react'
import { FcGoogle } from "react-icons/fc";
import { PiEyeClosedLight } from "react-icons/pi";
import { RxEyeOpen } from "react-icons/rx";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import getBackendUrl from '../utils/getBackendUrl';
import { useForm } from "react-hook-form"

const SignupPage = () => {
    const { signInWithGoogle, currentUser, registerUser } = useAuth();
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm()

    const handleSignUpWithEmailAndPassword = async (data) => {
        try {
            const userCredential = await registerUser(data.email, data.password);
            const user = userCredential.user;

            const res = await axios.post(`${getBackendUrl()}/api/user`, {
                uid: user.uid,
                email: user.email,
                username: data.fullname
            });

            if (res.data.success === true) {
                navigate("/complete_detail");
                setErrorMessage("");
                reset();
            } else {
                setErrorMessage(res.data.message);
            }
        }
        catch (err) {
            setErrorMessage(err.message);
            reset();
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            const userCredential = await signInWithGoogle();
            const user = userCredential.user;

            const res = await axios.post(`${getBackendUrl()}/api/user`, {
                uid: user.uid,
                email: user.email,
                username: user.displayName
            });

            if (res.data.success === true) {
                navigate("/complete-detail");
            } else {
                setErrorMessage(res.data.message);
            }

            reset();
        }
        catch (err) {
            setErrorMessage(err.message);
            reset();
        }
    };



    return (
        <div className='w-screen h-screen bg-primary flex items-center justify-center'>
            <form method="POST" onSubmit={handleSubmit(handleSignUpWithEmailAndPassword)} className='w-88 h-112 bg-secondary rounded-md shadow-sm shadow-gray-500 hover:shadow-white duration-1000 flex flex-col gap-4 items-center justify-center'>
                <p className='text-white text-lg font-semibold pb-2'>Sign Up</p>
                {
                    errorMessage && <p className='text-red-400'>{errorMessage}</p>
                }
                <label htmlFor="fullname" className='w-[96%]  p-1 rounded-sm border-[1px] border-gray-400 hover:border-white duration-300'>
                    <input {...register("fullname", { required: true })} type="text" placeholder='Full Name' className='w-full h-8 placeholder-white outline-none text-white px-1' />
                </label>
                <label htmlFor="email" className='w-[96%]  p-1 rounded-sm border-[1px] border-gray-400 hover:border-white duration-300'>
                    <input {...register("email", { required: true })} type="email" placeholder='Email' className='w-full h-8 placeholder-white outline-none text-white px-1' />
                </label>
                <label htmlFor="password" className='w-[96%] p-1 rounded-sm border-[1px] border-gray-400 hover:border-white duration-300 flex'>
                    <input {...register("password", { required: true })} type={showPassword ? "text" : "password"} placeholder='Password' className='w-[90%] h-8 placeholder-white outline-none text-white px-1' />
                    <div className='w-[10%] h-full flex items-center' onClick={() => setShowPassword(!showPassword)}>
                        {
                            showPassword ?
                                <RxEyeOpen className='w-4 h-4 text-white' />
                                :
                                <PiEyeClosedLight className='w-4 h-4 text-white' />
                        }
                    </div>
                </label>
                <button type='submit' className='w-[94%] h-10 p-1 rounded-sm bg-blue-500 text-white hover:bg-blue-700 duration-300'>Sign Up</button>
                <p className='text-white'>or</p>
                <div className='w-[94%] h-10 flex justify-center items-center gap-2 border-[1px] border-gray-400 hover:border-white duration-300 p-1 rounded-md' onClick={() => handleGoogleSignUp()}>
                    <FcGoogle className='w-6 h-6' />
                    <p className='text-white'>Sign up using Google</p>
                </div>
                <p className='text-white text-sm'>Already have an account? <Link to={"/login"} className="text-blue-500 hover:text-blue-700 duration-300">Login</Link></p>
            </form>
        </div>
    )
}

export default SignupPage