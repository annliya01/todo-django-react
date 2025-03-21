import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTasks, createTask, updateTask, deleteTask } from "../api";
import "../style.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthContext from "../context/AuthContext";

const ToDoList = () => {
    const { token, logoutUser } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newTask, setNewTask] = useState({ title: "", description: "", priority: "High", status: "Pending", deadline: "" });
    const [editingTask, setEditingTask] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("id");

    const handleUnauthorized = () => {
        logoutUser();
    };

    const loadTasks = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchTasks(searchQuery, sortBy, page);
            setTasks(response.results);
            setNextPage(response.next ? page + 1 : null);
            setPrevPage(response.previous ? page - 1 : null);
            setCurrentPage(page);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            if (error.response && error.response.status === 401) {
                handleUnauthorized();
            } else {
                setError("Failed to load tasks.");
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!token) {
            logoutUser();
        } else {
            loadTasks(currentPage);
        }
    }, [token, searchQuery, sortBy, currentPage]);

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.description) {
            toast.error("Title and Description are required!");
            return;
        }
        try {
            await createTask(newTask);
            setNewTask({ title: "", description: "", priority: "High", status: "Pending", deadline: "" });
            loadTasks(currentPage);
            toast.success("Task created successfully!");
        } catch (error) {
            console.error("Error creating task:", error);
            toast.error("Failed to create task");
        }
    };

    const handleUpdateTask = async () => {
        if (!editingTask.title || !editingTask.description) {
            toast.error("Title and Description are required!");
            return;
        }
        try {
            await updateTask(editingTask.id, editingTask);
            setEditingTask(null);
            loadTasks(currentPage);
            toast.success("Task updated successfully!");
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Failed to update task");
        }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            await deleteTask(id);
            loadTasks(currentPage);
            toast.success("Task deleted successfully!");
        } catch (error) {
            console.error("Error deleting task:", error);
            toast.error("Failed to delete task");
        }
    };

    return (
        <div className="todo-container">
            <div className="task-form-container">
                <input
                    type="text"
                    placeholder="Title"
                    value={editingTask ? editingTask.title : newTask.title}
                    onChange={(e) => {
                        const value = e.target.value;
                        editingTask ? setEditingTask({ ...editingTask, title: value }) : setNewTask({ ...newTask, title: value });
                    }}
                />
                <input
                    type="text"
                    placeholder="Description"
                    value={editingTask ? editingTask.description : newTask.description}
                    onChange={(e) => {
                        const value = e.target.value;
                        editingTask ? setEditingTask({ ...editingTask, description: value }) : setNewTask({ ...newTask, description: value });
                    }}
                />
                <input 
                    type="text" 
                    placeholder="Deadline" 
                    onFocus={(e) => (e.target.type = 'date')}
                    onBlur={(e) => (e.target.type = 'text')}
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                />

                <select
                    value={editingTask ? editingTask.priority : newTask.priority}
                    onChange={(e) => {
                        const value = e.target.value;
                        editingTask ? setEditingTask({ ...editingTask, priority: value }) : setNewTask({ ...newTask, priority: value });
                    }}
                >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
                <select
                    value={editingTask ? editingTask.status : newTask.status}
                    onChange={(e) => {
                        const value = e.target.value;
                        editingTask ? setEditingTask({ ...editingTask, status: value }) : setNewTask({ ...newTask, status: value });
                    }}
                >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                </select>
                <button onClick={editingTask ? handleUpdateTask : handleCreateTask}>
                    {editingTask ? "Update Task" : "Add Task"}
                </button>
                {editingTask && <button className="cancel-btn" onClick={() => setEditingTask(null)}>Cancel</button>}
            </div>

            <div className="search-sort-container">
                <div className="sort-container">
                    <select onChange={(e) => setSortBy(e.target.value)}>
                        <option value="" disabled selected>Sort by</option>
                        <option value="id">Default (ID)</option>
                        <option value="title">Title - Ascending</option>
                        <option value="-title">Title - Descending</option>
                        <option value="status">Status (Completed to Pending)</option>
                        <option value="-status">Status (Pending to completed)</option>
                        <option value="priority">Priority (Low-High)</option>
                        <option value="-priority">Priority (High-Low)</option>
                        <option value="deadline">Deadline (Earliest-Latest)</option>
                        <option value="-deadline">Deadline (Latest-Earliest)</option>
                    </select>
                </div>
                <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="pagination">
                <button className="pb1" onClick={() => prevPage && loadTasks(prevPage)} disabled={!prevPage}>Previous</button>
                <span>Page {currentPage}</span>
                <button className="pb1" onClick={() => nextPage && loadTasks(nextPage)} disabled={!nextPage}>Next</button>
            </div>

            <div className="task-table-container">
                {loading ? <p>Loading tasks...</p> : (
                    <table className="task-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Deadline</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.length > 0 ? tasks.map((task) => (
                                <tr key={task.id}>
                                    <td>{task.title}</td>
                                    <td>{task.description}</td>
                                    <td>{task.deadline || "No Deadline"}</td>
                                    <td>{task.priority}</td>
                                    <td>{task.status}</td>
                                    <td>
                                        <button className="edit-btn" onClick={() => setEditingTask(task)}>Edit</button>
                                        <button className="delete-btn" onClick={() => handleDeleteTask(task.id)}>Delete</button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="6">No tasks found</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>
            <ToastContainer />
        </div>
    );
};

export default ToDoList;
