import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Authentication APIs
export const signup = async (userData) => axios.post(`${API_BASE_URL}/signup/`, userData);

export const checkUsername = (username) => axios.get(`${API_BASE_URL}/check-username?username=${username}`);

export const checkEmail = (email) => axios.get(`${API_BASE_URL}/check-email?email=${email}`);

export const login = async (userData) => axios.post(`${API_BASE_URL}/login/`, userData);

export const fetchHome = async () => {
    return axios.get(`${API_BASE_URL}/home/`, { headers: getAuthHeaders() });
};

export const requestPasswordReset = async (email) => axios.post(`${API_BASE_URL}/password-reset/`, { email });

export const resetPassword = async (uid, token, password) => {
    return axios.post(`${API_BASE_URL}/password-reset-confirm/${uid}/${token}/`, 
        { password }, 
        { headers: { "Content-Type": "application/json" } }
    );
};

// Task Management APIs
export const fetchTasks = async (page = 1) => {
    return axios.get(`${API_BASE_URL}/tasks/?page=${page}`, { headers: getAuthHeaders() });
};

export const createTask = async (task) => {
    try {
        console.log("Creating Task:", task); // Debugging log
        const response = await axios.post(`${API_BASE_URL}/tasks/`, task, {
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error creating task:", error.response?.data || error);
        throw error;
    }
};

export const updateTask = async (id, task) => {
    try {
        console.log("Updating Task:", id, task); // Debugging log
        const response = await axios.put(`${API_BASE_URL}/tasks/${id}/`, task, {
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating task:", error.response?.data || error);
        throw error;
    }
};

export const deleteTask = async (id) => {
    try {
        console.log("Deleting Task:", id); // Debugging log
        const response = await axios.delete(`${API_BASE_URL}/tasks/${id}/`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error deleting task:", error.response?.data || error);
        throw error;
    }
};
