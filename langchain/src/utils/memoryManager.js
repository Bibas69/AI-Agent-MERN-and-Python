let tempMemory = {};

export const getMemory = (uid) => {
    return tempMemory[uid] || {};
}

export const updateMemory = (uid, data) => {
    tempMemory[uid] = {...tempMemory[uid], ...data} || {};
}

export const deleteMemory = (uid) => {
    delete tempMemory[uid];
}