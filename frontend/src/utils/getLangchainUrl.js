const getLangchainUrl = () => {
    return import.meta.env.VITE_LANGCHAIN_URL;
}

export default getLangchainUrl;