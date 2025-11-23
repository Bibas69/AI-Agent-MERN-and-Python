const getBackendUrl = () => {
    return import.meta.env.VITE_BACKEND_URL;
}

export default getBackendUrl;