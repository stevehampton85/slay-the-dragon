// Register the Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered!', reg))
      .catch(err => console.error('Service Worker registration failed: ', err));
  });
}

// Your unique Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbyxmH9dekYrG372MDCf-IY14stnHSmnYujphCxBqgUrvOeHUWqjCo_Oa45L1_-eTPEF/exec';

document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
});

async function fetchTasks() {
    const taskList = document.getElementById('task-list');
    const loading = document.getElementById('loading');

    try {
        // Fetch data from Google Sheets
        const response = await fetch(API_URL);
        const json = await response.json();
        
        loading.style.display = 'none';

        if (json.result === 'success') {
            const tasks = json.data;
            renderTasks(tasks);
        } else {
            taskList.innerHTML = `<li style="color:red;">Error loading quests.</li>`;
        }
    } catch (error) {
        loading.style.display = 'none';
        taskList.innerHTML = `<li style="color:red;">Network Error. Is the API deployed?</li>`;
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = ''; // Clear current list

    // Only show tasks that are "Pending"
    const activeTasks = tasks.filter(task => task.Status === 'Pending');

    activeTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'quest-card';
        
        li.innerHTML = `
            <div class="quest-title">${task.TaskName}</div>
            <div class="quest-details">${task.Description}</div>
            <button class="btn-complete" onclick="completeTask(${task.TaskID}, ${task.Points})">
                Collect ${task.Points} Gems
            </button>
        `;
        taskList.appendChild(li);
    });
}

// Function to handle clicking the complete button
async function completeTask(taskId, points) {
    // 1. Play Haptic Feedback (vibrate)
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]); 
    }
    
    // 2. We will add the POST request back to Apps Script here next!
    alert(`Quest ${taskId} Complete! Earned ${points} Gems! (Data POST function pending)`);
}