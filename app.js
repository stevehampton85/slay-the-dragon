const API_URL = 'https://script.google.com/macros/s/AKfycbyxmH9dekYrG372MDCf-IY14stnHSmnYujphCxBqgUrvOeHUWqjCo_Oa45L1_-eTPEF/exec';

let currentGems = 0; // Local game state

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error(err));
  });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
});

async function fetchTasks() {
    const taskList = document.getElementById('task-list');
    const loading = document.getElementById('loading');

    try {
        const response = await fetch(API_URL);
        const json = await response.json();
        
        loading.style.display = 'none';

        if (json.result === 'success') {
            renderTasks(json.data);
        } else {
            taskList.innerHTML = `<li style="color:red;">Error loading quests. Check Apps Script logs.</li>`;
        }
    } catch (error) {
        loading.style.display = 'none';
        taskList.innerHTML = `<li style="color:red;">Network Error.</li>`;
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = ''; 

    const activeTasks = tasks.filter(task => task.Status === 'Pending');

    if (activeTasks.length === 0) {
        taskList.innerHTML = `<li class="quest-card" style="text-align:center; color:var(--sparx-green);">All Quests Cleared!</li>`;
        return;
    }

    activeTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'quest-card';
        
        li.innerHTML = `
            <div class="quest-title">${task.TaskName}</div>
            <div class="quest-details">${task.Description}</div>
            <!-- Notice we now pass 'this' so the script knows exactly which button was clicked -->
            <button class="btn-complete" onclick="completeTask(${task.TaskID}, parseInt(${task.Points}), this)">
                Collect ${task.Points} Gems
            </button>
        `;
        taskList.appendChild(li);
    });
}

// The core gamification engine
async function completeTask(taskId, points, buttonElement) {
    // 1. Sensory Feedback
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]); 
    }

    // 2. Optimistic UI Update (Instant gratification)
    currentGems += points;
    document.getElementById('total-gems').innerText = currentGems;

    // 3. Button state change
    buttonElement.innerText = "QUEST CLEARED";
    buttonElement.disabled = true;

    // 4. Mascot Celebration (Sparx flashes green!)
    const sparx = document.getElementById('sparx-sprite');
    sparx.style.backgroundColor = "var(--sparx-green)";
    sparx.style.boxShadow = "0 0 25px 10px var(--sparx-green)";
    
    setTimeout(() => {
        // Return Sparx to normal after 1.5 seconds
        sparx.style.backgroundColor = "var(--sparx-yellow)";
        sparx.style.boxShadow = "0 0 15px 5px var(--sparx-yellow)";
    }, 1500);

    // 5. Background Database Update
    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ task_id: taskId }),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            }
        });
    } catch (error) {
        console.error("Failed to sync with database:", error);
        // If it fails, you would ideally refund the points and alert the user here
    }
}
