const HOURS_START = 5;
const HOURS_END = 22; // inclusive
const LABEL_WIDTH = 150;
const ROW_HEIGHT = 50;

let currentDate = new Date();
let allEvents = [];

function changeWeek(offset) {
  currentDate.setDate(currentDate.getDate() + offset * 7);
  renderSchedule();
}

function formatHourLabel(hour) {
  const ampm = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:00 ${ampm}`;
}

function loadEvents() {
  fetch('events.json')
    .then(res => res.json())
    .then(data => {
      allEvents = data;
      renderSchedule();
    })
    .catch(err => {
      console.error('Failed to load events.json:', err);
    });
}

function renderSchedule() {
  const container = document.getElementById('schedule-container');
  container.innerHTML = '';
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // Header row: empty top-left cell + hours
  const empty = document.createElement('div');
  empty.className = 'hour-label';
  container.appendChild(empty);

  for(let h=HOURS_START; h<=HOURS_END; h++) {
    const hourLabel = document.createElement('div');
    hourLabel.className = 'hour-label';
    hourLabel.textContent = formatHourLabel(h);
    container.appendChild(hourLabel);
  }

  // Calculate week start (Sunday)
  const weekStart = new Date(currentDate);
  weekStart.setHours(0,0,0,0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  // Add days rows with empty cells for hours, with date next to day name
  days.forEach((day, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    const dateStr = `${dayDate.getMonth() + 1}/${dayDate.getDate()}`; // MM/DD

    const dayLabel = document.createElement('div');
    dayLabel.className = 'day-label';
    dayLabel.textContent = `${day} ${dateStr}`;
    container.appendChild(dayLabel);

    for(let h=HOURS_START; h<=HOURS_END; h++) {
      const cell = document.createElement('div');
      container.appendChild(cell);
    }
  });

  // Place events
  const now = new Date();

  // Compute container width to calculate event width/left
  const containerWidth = container.clientWidth || window.innerWidth;
  // Width available for hours (excluding day label)
  const hoursWidth = containerWidth - LABEL_WIDTH;

  allEvents.forEach(ev => {
    const start = new Date(ev.start);
    const end = new Date(ev.end);

    // Only show events in current week (from Sunday 00:00 to next Sunday 00:00)
    if(start < weekStart || start >= new Date(weekStart.getTime() + 7*24*60*60*1000)) return;

    const dayIndex = start.getDay();

    // Convert times to minutes from midnight
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    // Ignore events outside the displayed time range
    if(startMinutes < HOURS_START*60 || endMinutes > (HOURS_END+1)*60) return;

    // Calculate left and width in px
    const totalMinutesDisplayed = (HOURS_END+1 - HOURS_START) * 60;
    const leftRatio = (startMinutes - HOURS_START*60) / totalMinutesDisplayed;
    const widthRatio = (endMinutes - startMinutes) / totalMinutesDisplayed;

    const leftPx = LABEL_WIDTH + leftRatio * hoursWidth;
    const widthPx = widthRatio * hoursWidth;

    const topPx = 1 * ROW_HEIGHT + dayIndex * ROW_HEIGHT;

    // Create clickable event block as <a>
    const evDiv = document.createElement('a');
    evDiv.className = 'event';
    evDiv.href = ev.link || '#';
    evDiv.target = '_blank';
    evDiv.rel = 'noopener noreferrer';
    evDiv.textContent = ev.title;

    evDiv.style.top = `${topPx}px`;
    evDiv.style.left = `${leftPx}px`;
    evDiv.style.width = `${widthPx}px`;
    evDiv.style.height = `${ROW_HEIGHT}px`;
    evDiv.style.position = 'absolute';

    // On Air highlight
    if(now >= start && now <= end) {
      evDiv.classList.add('on-air');
    }

    container.appendChild(evDiv);
  });

  // Update week label
  const weekEnd = new Date(weekStart.getTime() + 6*24*60*60*1000);
  const options = { month: 'short', day: 'numeric' };
  const weekLabel = document.getElementById('week-label');
  weekLabel.textContent = `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;

  // Timezone info
  const tzInfo = document.getElementById('timezone-info');
  tzInfo.textContent = `Times shown in your local timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
}

window.addEventListener('resize', renderSchedule);
window.onload = loadEvents;