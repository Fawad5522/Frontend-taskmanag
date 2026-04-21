import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecycleBin, setShowRecycleBin] = useState(false);

  // 1. UPDATE: Ab hum Active aur Trashed (Deleted) dono lists API se mangwayenge
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // Active tasks mangwao
      const response = await axios.get('http://127.0.0.1:8000/api/tasks');
      setTasks(response.data);

      // Deleted tasks mangwao (Recycle Bin ke liye)
      const trashedResponse = await axios.get('http://127.0.0.1:8000/api/tasks/trashed');
      setDeletedTasks(trashedResponse.data);
    } catch (error) {
      console.error("Data not recieved:", error);
    } finally {
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
      console.error("Not Saved or Updated:", error);
    }
  };

  const handleEditClick = (task) => {
    setTitle(task.title);
    setDescription(task.description);
    setEditingId(task.id);
  };

  // 2. UPDATE: Ab manual filter nahi, seedha API call aur refresh
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/tasks/${id}`);
      fetchTasks(); // Data refresh ho kar khud recycle bin mein chala jayega
    } catch (error) {
      console.error("Not Deleted:", error);
    }
  };

  // 3. UPDATE: Naya POST karne ki bajaye 'restore' ki API call karein
  const handleRecover = async (task) => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/tasks/${task.id}/restore`);
      fetchTasks();
    } catch (error) {
      console.error("Not Recovered:", error);
    }
  };

  // 4. UPDATE: Local memory se nahi, hamesha ke liye Database se delete karein
  const handlePermanentDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/tasks/${id}/force`);
      fetchTasks();
    } catch (error) {
      console.error("Not delete Permanently :", error);
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
        <h1 className="title">Simple Task Manager📝</h1>
      </div>

      {!showRecycleBin ? (
        <>
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

            <button 
              type="button" // Type button dena zaroori hai taake form submit na ho
              onClick={() => setShowRecycleBin(!showRecycleBin)}
              className="btn btn-recycle">
              🗑️ Recycle Bin ({deletedTasks.length})
            </button>
          </form>

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
        </>
      ) : (
        <div className="recycle-bin">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button 
              onClick={() => setShowRecycleBin(false)} 
              className="btn btn-back">
              ← Back
            </button>
            <h2 style={{ margin: 0 }}>Recycle Bin</h2>
          </div>
          
          {deletedTasks.length === 0 ? (
            <p>No deleted tasks</p>
          ) : (
            <ul className="task-list">
              {deletedTasks.map(task => (
                <li key={task.id} className="task-card task-deleted">
                  <div>
                    <strong style={{ fontSize: '18px' }}>{task.title}</strong> <br/>
                    <span style={{ fontSize: '14px', marginTop: '5px', display: 'block' }}>{task.description}</span>
                  </div>
                  <div className="action-buttons">
                    <button onClick={() => handleRecover(task)} className="btn btn-recover">♻️ Recover</button>
                    <button onClick={() => handlePermanentDelete(task.id)} className="btn btn-delete">🗑️ Permanent Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

    </div>
  );
}

export default App;