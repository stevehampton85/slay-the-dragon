const API_URL = 'https://script.google.com/macros/s/AKfycbyxmH9dekYrG372MDCf-IY14stnHSmnYujphCxBqgUrvOeHUWqjCo_Oa45L1_-eTPEF/exec';

let currentGems = 0; 

// Setup PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(err => console.error(err)));
}

document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    // Check for urgent tasks every 5 minutes
    setInterval(checkTimeLimits, 300000); 
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
            checkTimeLimits(); // Check urgency immediately after rendering
        } else {
            taskList.innerHTML = `<li style="color:red;">Error loading quests.</li>`;
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
        // We embed the end time into the HTML element so the time checker can read it
        li.dataset.endTime = task.ActiveTimeEnd; 
        
        li.innerHTML = `
            <div class="quest-title">${task.TaskName}</div>
            <div class="quest-details">${task.Description}</div>
            <button class="btn-complete" onclick="completeTask(${task.TaskID}, ${task.Points}, this)">
                Collect ${task.Points} Gems
            </button>
        `;
        taskList.appendChild(li);
    });
}

function checkTimeLimits() {
    const now = new Date();
    const currentHour = now.getHours(); // 0-23 format
    const cards = document.querySelectorAll('.quest-card');
    const sparx = document.getElementById('sparx-sprite');

    let anyUrgent = false;

    cards.forEach(card => {
        const endTimeStr = card.dataset.endTime; // e.g., "23:59"
        if (!endTimeStr) return;

        const endHour = parseInt(endTimeStr.split(':')[0]);
        
        // If we are within 3 hours of the deadline, trigger urgency visual decay
        if (endHour - currentHour <= 3 && endHour - currentHour >= 0) {
            card.classList.add('urgent');
            anyUrgent = true;
        }
    });

    // If any tasks are urgent, Sparx turns anxious (blue)
    if (anyUrgent) {
        sparx.style.backgroundColor = "#4fc3f7"; 
        sparx.style.boxShadow = "0 0 15px 5px #4fc3f7";
    }
}

async function completeTask(taskId, points, buttonElement) {
    // 1. Sensory Haptics 
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]); 

    // 2. Score Update
    currentGems += points;
    document.getElementById('total-gems').innerText = currentGems;

    // 3. UI Disabling
    buttonElement.innerText = "CLEARED";
    buttonElement.disabled = true;
    const card = buttonElement.closest('.quest-card');
    card.classList.remove('urgent'); // Remove red decay if completed
    card.style.opacity = '0.5';

    // 4. Trigger Massive Celebration Popup
    const popup = document.getElementById('celebration-popup');
    document.getElementById('popup-amount').innerText = points;
    
    // Remove the hidden class, add the show class for animation
    popup.classList.remove('hidden');
    popup.classList.add('show');
    
    const sparx = document.getElementById('sparx-sprite');
    sparx.style.backgroundColor = "var(--sparx-green)";
    sparx.style.boxShadow = "0 0 30px 15px var(--sparx-green)";

    // Hide popup after 2 seconds
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.classList.add('hidden'), 300); // wait for fade transition
        sparx.style.backgroundColor = "var(--sparx-yellow)";
        sparx.style.boxShadow = "0 0 15px 5px var(--sparx-yellow)";
        checkTimeLimits(); // Re-evaluate if Sparx needs to turn blue again
    }, 2000);

    // 5. Background Database Post
    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ task_id: taskId }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
    } catch (error) {
        console.error("Database sync failed", error);
    }
}
