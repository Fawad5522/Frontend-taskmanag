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
  const [errors, setErrors] = useState({});

  // 1. UPDATE: Now we will fetch both active and deleted tasks from the backend,
  //  instead of relying on local state manipulation.
  //  This ensures that our UI is always in sync with the database, 
  // and we can leverage the backend's capabilities for handling soft deletes and restores.

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // Getting Active tasks 
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
    e.preventDefault()
    setErrors({}); // Clear previous errors

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

      if (error.response && error.response.status === 422) {    // catch error response from backend, especially validation errors (422)
        setErrors(error.response.data.errors);  //Save errors in state to show in UI
      } else {
        console.error("Unexpected error occurred:", error);
      }
    }
  };

  const handleEditClick = (task) => {
    setTitle(task.title);
    setDescription(task.description);
    setEditingId(task.id);
  };

  // now instead of just removing the task from local state, we will call the delete API which will soft delete the task in the backend. This way, the task will be moved to the recycle bin (trashed tasks) and can be recovered later if needed.
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <input
                type="text"
                className="input-field"
                placeholder=" Task Name "
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors({ ...errors, title: null }); // Clear title errors on change, so that red border and error message disappear as soon as user starts fixing the input
                }}

                // if there is an error for title, show red border
                style={{ borderColor: errors.title ? 'red' : '' }}
              />
              {/* if there is an error for title, show it below the input */}
              {errors.title && <span style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.title[0]}</span>}
            </div>

            <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
              <input
                type="text"
                className="input-field"
                placeholder=" Description "
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

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
                    <strong style={{ fontSize: '18px' }}>{task.title}</strong> <br />
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
                    <strong style={{ fontSize: '18px' }}>{task.title}</strong> <br />
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