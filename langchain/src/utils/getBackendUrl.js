import dotenv from "dotenv";

dotenv.config();

const getBackendUrl = () => {
    return process.env.BACKEND_URL;
}

export default getBackendUrl;