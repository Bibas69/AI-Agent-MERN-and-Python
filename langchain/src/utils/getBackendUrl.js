require("dotenv").config();
const getBackendUrl = () => {
    return process.env.BACKEND_URL;
}

export default getBackendUrl;