import React, { useState } from 'react'
import { SlScreenSmartphone } from "react-icons/sl";
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/material.css'
import { useAuth } from '../context/AuthContext';
import { useNavigate} from 'react-router-dom';


const CompleteDetail = () => {
    const [number, setNumber] = useState("")
    const [errorMessage, setErrorMessage] = useState("");
    const [otp, setOtp] = useState("");
    const [confirmObj, setConfirmObj] = useState("");
    const [flag, setFlag] = useState(false);

    const navigate = useNavigate();

    const { setUpRecaptcha } = useAuth();

    const getOtp = async (e) => {
        e.preventDefault();
        if (number === "" || number === undefined) {
            return setErrorMessage("Please enter a valid phone number.");
        }
        try {
            const res = await setUpRecaptcha("+" + number);
            setConfirmObj(res);
            setFlag(true);
            console.log(res);
        }
        catch (err) {
            setErrorMessage(err.message);
        }
    }

    const verifyOtp = async (e) => {
        e.preventDefault();
        console.log(otp);
        if(otp==="" || otp===undefined){
            return setErrorMessage("Invalid OTP");
        }
        try{
            setErrorMessage("");
            await confirmObj.confirm(otp);
            navigate("/");
        }
        catch(err){
            setErrorMessage(err.message);
        }
    }

    return (
        <div className='w-screen h-screen bg-primary flex items-center justify-center'>
            <form method="POST" onSubmit={getOtp} className={`w-100 bg-secondary rounded-md p-4 flex flex-col gap-4 items-center justify-center shadow-sm shadow-gray-500 hover:shadow-white duration-300 ${flag ? "hidden":"block"}`}>
                <div className='w-full flex flex-col items-center gap-2'>
                    <SlScreenSmartphone className='w-22 h-22 text-white' />
                    <p className='text-white'>Verify your phone number.</p>
                </div>
                {
                    errorMessage && <p className='text-red-400'>{errorMessage}</p>
                }
                <div className='w-[90%] mt-4 flex flex-col gap-2 items-center'>
                    <PhoneInput
                        country={'us'}
                        value={number}
                        onChange={setNumber}
                        specialLabel=""
                        inputClass="!w-full !border !border-gray-300 focus:!border-blue-500 focus:!ring-1 focus:!outline-blue-500 !rounded-lg"
                    />
                    <div id='recaptcha-container'></div>
                </div>
                <button type='submit' className='w-[70%] h-12 text-white bg-blue-500 hover:bg-blue-700 duration-300'>Send OTP</button>
                <p onClick={ () => navigate("/")} className='text-center text-blue-500 cursor-pointer'>Skip</p>
            </form>

            <form method="POST" onSubmit={verifyOtp} className={`w-100 h-100 bg-secondary rounded-md p-4 flex flex-col gap-4 items-center justify-center shadow-sm shadow-gray-500 hover:shadow-white duration-300 ${flag ? "block":"hidden"}`}>
                <p className='text-white text-lg'>Enter OTP</p>
                {
                    errorMessage && <p className='text-red-400'>{errorMessage}</p>
                }
                <div className='w-[90%] mt-4 flex flex-col gap-2 items-center'>
                    <input type="text" placeholder='OTP' onChange={(e)=> setOtp(e.target.value)} className='w-[80%] h-12 bg-red-300 bg-white text-black placeholder-black p-2 tracking-widest'/>
                </div>
                <button type='submit' className='w-[70%] h-12 text-white bg-green-500 hover:bg-green-700 duration-300'>Verify OTP</button>
            </form>
        </div>
    )
}

export default CompleteDetail