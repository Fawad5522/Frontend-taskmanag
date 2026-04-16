import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  // NAYA STATE: Loader ko ON/OFF karne ke liye
  const [isLoading, setIsLoading] = useState(true); 

  const fetchTasks = async () => {

    // Loader on
    setIsLoading(true); 

    try {
      const response = await axios.get('http://127.0.0.1:8000/api/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error("Data nahi aya:", error);
    } finally {

     // Loader off
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://127.0.0.1:8000/api/tasks/${editingId}`, {
          title: title, description: description, status: 'pending'
        });
        setEditingId(null);
      } else {
        await axios.post('http://127.0.0.1:8000/api/tasks', {
          title: title, description: description, status: 'pending'
        });
      }
      setTitle('');
      setDescription('');
      fetchTasks();
    } catch (error) {
      console.error("Not Saved or Upadted:", error);
    }
  };

  const handleEditClick = (task) => {
    setTitle(task.title);
    setDescription(task.description);
    setEditingId(task.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      console.error("Not Deleted:", error);
    }
  };

  const handleComplete = async (task) => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/tasks/${task.id}`, {
        title: task.title, description: task.description, status: 'completed'
      });
      fetchTasks();
    } catch (error) {
      console.error("Status Not updated:", error);
    }
  };

  return (
    <div className="app-container">
      
      <div className="header-section">
        <h1 className="title"> Simple Task Manager📝</h1>
      </div>

      <form onSubmit={handleSubmit} className="task-form">
        <input
          type="text"
          className="input-field"
          style={{ flex: 1 }}
          placeholder=" Task Name "
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          className="input-field"
          style={{ flex: 2 }}
          placeholder=" Description "
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" className={editingId ? 'btn btn-update' : 'btn btn-add'}>
          {editingId ? 'Update Task' : 'Add Task'}
        </button>
      </form>

      {/* --- TASKS Dikhane ka Hissa --- */}
      {/* Hum React ko bol rahe hain: Agar isLoading true hai to pehla hissa (loader) dikhao, warna doosra hissa (List) dikhao */}
      
      {isLoading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Wait for a while</p>
        </div>
      ) : (
        <ul className="task-list">
          {tasks.map(task => (
            <li key={task.id} className={`task-card ${task.status === 'pending' ? 'task-pending' : 'task-completed'}`}>
              
              <div className={task.status === 'completed' ? 'text-completed' : ''}>
                <strong style={{ fontSize: '18px' }}>{task.title}</strong> <br/>
                <span style={{ fontSize: '14px', marginTop: '5px', display: 'block' }}>{task.description}</span>
              </div>
              
              <div className="action-buttons">
                {task.status === 'pending' && (
                  <>
                    <button onClick={() => handleComplete(task)} className="btn btn-done">✓ Done</button>
                    <button onClick={() => handleEditClick(task)} className="btn btn-edit">✏️ Edit</button>
                  </>
                )}
                <button onClick={() => handleDelete(task.id)} className="btn btn-delete">✗ Delete</button>
              </div>

            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

export default App;