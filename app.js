const STORAGE_KEY = 'my-pals-data-v1';

const frequencyMonths = {
  monthly: 1,
  quarterly: 3,
  'bi-annually': 6,
  annually: 12,
};

const state = {
  contacts: loadContacts(),
  history: [],
};

const el = {
  form: document.getElementById('contactForm'),
  contactId: document.getElementById('contactId'),
  name: document.getElementById('name'),
  phone: document.getElementById('phone'),
  email: document.getElementById('email'),
  address: document.getElementById('address'),
  category: document.getElementById('category'),
  frequency: document.getElementById('frequency'),
  lastContacted: document.getElementById('lastContacted'),
  birthday: document.getElementById('birthday'),
  anniversary: document.getElementById('anniversary'),
  notes: document.getElementById('notes'),
  clearFormBtn: document.getElementById('clearFormBtn'),
  contactsList: document.getElementById('contactsList'),
  searchInput: document.getElementById('searchInput'),
  categoryFilter: document.getElementById('categoryFilter'),
  frequencyFilter: document.getElementById('frequencyFilter'),
  kpis: document.getElementById('kpis'),
  upcomingList: document.getElementById('upcomingList'),
  importantDatesList: document.getElementById('importantDatesList'),
  reminderList: document.getElementById('reminderList'),
  historyList: document.getElementById('historyList'),
  template: document.getElementById('contactItemTemplate'),
  exportBtn: document.getElementById('exportBtn'),
  importInput: document.getElementById('importInput'),
};

el.form.addEventListener('submit', onSaveContact);
el.clearFormBtn.addEventListener('click', resetForm);
el.searchInput.addEventListener('input', render);
el.categoryFilter.addEventListener('change', render);
el.frequencyFilter.addEventListener('change', render);
el.exportBtn.addEventListener('click', exportBackup);
el.importInput.addEventListener('change', importBackup);

render();

function loadContacts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.contacts) ? parsed.contacts : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ contacts: state.contacts }));
}

function onSaveContact(event) {
  event.preventDefault();
  const existingId = el.contactId.value;
  const contact = {
    id: existingId || crypto.randomUUID(),
    name: el.name.value.trim(),
    phone: el.phone.value.trim(),
    email: el.email.value.trim(),
    address: el.address.value.trim(),
    category: el.category.value,
    frequency: el.frequency.value,
    lastContacted: el.lastContacted.value || '',
    birthday: el.birthday.value || '',
    anniversary: el.anniversary.value || '',
    notes: el.notes.value.trim(),
  };

  if (!contact.name) return;

  const index = state.contacts.findIndex((c) => c.id === contact.id);
  if (index >= 0) {
    state.contacts[index] = contact;
    state.history.unshift(`${new Date().toLocaleString()}: Updated ${contact.name}`);
  } else {
    state.contacts.push(contact);
    state.history.unshift(`${new Date().toLocaleString()}: Added ${contact.name}`);
  }

  persist();
  resetForm();
  render();
}

function resetForm() {
  el.form.reset();
  el.contactId.value = '';
}

function computeNextContactDate(contact) {
  const base = contact.lastContacted ? new Date(contact.lastContacted) : new Date();
  const next = new Date(base);
  next.setMonth(next.getMonth() + (frequencyMonths[contact.frequency] || 1));
  return next;
}

function dayDiff(a, b) {
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
}

function filteredContacts() {
  const query = el.searchInput.value.trim().toLowerCase();
  return [...state.contacts]
    .filter((c) => {
      const matchesQuery =
        !query ||
        [c.name, c.email, c.phone, c.address].join(' ').toLowerCase().includes(query);
      const matchesCategory =
        el.categoryFilter.value === 'all' || c.category === el.categoryFilter.value;
      const matchesFrequency =
        el.frequencyFilter.value === 'all' || c.frequency === el.frequencyFilter.value;
      return matchesQuery && matchesCategory && matchesFrequency;
    })
    .sort((a, b) => computeNextContactDate(a) - computeNextContactDate(b));
}

function render() {
  renderContacts();
  renderDashboard();
  renderReminders();
  renderHistory();
}

function renderContacts() {
  el.contactsList.innerHTML = '';
  const contacts = filteredContacts();

  if (!contacts.length) {
    el.contactsList.innerHTML = '<li class="muted">No contacts found.</li>';
    return;
  }

  contacts.forEach((contact) => {
    const node = el.template.content.firstElementChild.cloneNode(true);
    const nextDate = computeNextContactDate(contact);
    node.querySelector('.contact-name').textContent = contact.name;
    node.querySelector('.contact-meta').textContent = `${contact.category} • ${contact.frequency}`;
    node.querySelector('.contact-next').textContent = `Next contact: ${nextDate.toLocaleDateString()}`;

    node.querySelector('.contactedBtn').addEventListener('click', () => {
      contact.lastContacted = new Date().toISOString().slice(0, 10);
      state.history.unshift(`${new Date().toLocaleString()}: Marked ${contact.name} as contacted`);
      persist();
      render();
    });

    node.querySelector('.editBtn').addEventListener('click', () => {
      el.contactId.value = contact.id;
      el.name.value = contact.name;
      el.phone.value = contact.phone;
      el.email.value = contact.email;
      el.address.value = contact.address;
      el.category.value = contact.category;
      el.frequency.value = contact.frequency;
      el.lastContacted.value = contact.lastContacted;
      el.birthday.value = contact.birthday;
      el.anniversary.value = contact.anniversary;
      el.notes.value = contact.notes;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    node.querySelector('.deleteBtn').addEventListener('click', () => {
      state.contacts = state.contacts.filter((c) => c.id !== contact.id);
      state.history.unshift(`${new Date().toLocaleString()}: Deleted ${contact.name}`);
      persist();
      render();
    });

    el.contactsList.appendChild(node);
  });
}

function renderDashboard() {
  const now = new Date();
  const contacts = [...state.contacts].sort(
    (a, b) => computeNextContactDate(a) - computeNextContactDate(b),
  );

  const dueNow = contacts.filter((c) => dayDiff(now, computeNextContactDate(c)) <= 0).length;
  const dueWeek = contacts.filter((c) => {
    const diff = dayDiff(now, computeNextContactDate(c));
    return diff >= 0 && diff <= 7;
  }).length;

  const onTimeRate = contacts.length
    ? Math.round(((contacts.length - dueNow) / contacts.length) * 100)
    : 100;

  el.kpis.innerHTML = [
    ['Total contacts', contacts.length],
    ['Due this week', dueWeek],
    ['Overdue', dueNow],
    ['On-time rate', `${onTimeRate}%`],
  ]
    .map(
      ([label, value]) =>
        `<div class="kpi"><span>${label}</span><strong>${value}</strong></div>`,
    )
    .join('');

  el.upcomingList.innerHTML = contacts
    .filter((c) => {
      const diff = dayDiff(now, computeNextContactDate(c));
      return diff >= 0 && diff <= 7;
    })
    .slice(0, 8)
    .map(
      (c) =>
        `<li>${c.name} — ${computeNextContactDate(c).toLocaleDateString()} (${c.frequency})</li>`,
    )
    .join('') || '<li class="muted">No upcoming contacts.</li>';

  const important = [];
  contacts.forEach((c) => {
    ['birthday', 'anniversary'].forEach((key) => {
      if (!c[key]) return;
      const eventDate = upcomingThisYear(c[key]);
      const diff = dayDiff(now, eventDate);
      if (diff >= 0 && diff <= 30) {
        important.push({ name: c.name, type: key, date: eventDate });
      }
    });
  });
  important.sort((a, b) => a.date - b.date);

  el.importantDatesList.innerHTML = important
    .slice(0, 10)
    .map((item) => `<li>${item.name} — ${item.type} on ${item.date.toLocaleDateString()}</li>`)
    .join('') || '<li class="muted">No upcoming birthdays or anniversaries.</li>';
}

function upcomingThisYear(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const candidate = new Date(now.getFullYear(), date.getMonth(), date.getDate());
  if (candidate < now) candidate.setFullYear(now.getFullYear() + 1);
  return candidate;
}

function renderReminders() {
  const now = new Date();
  const due = state.contacts
    .map((c) => ({ contact: c, next: computeNextContactDate(c) }))
    .filter(({ next }) => dayDiff(now, next) <= 1)
    .sort((a, b) => a.next - b.next);

  el.reminderList.innerHTML = due
    .map(({ contact, next }) => `<li>${contact.name} is due on ${next.toLocaleDateString()}</li>`)
    .join('') || '<li class="muted">No reminders for today/tomorrow.</li>';
}

function renderHistory() {
  el.historyList.innerHTML = state.history
    .slice(0, 12)
    .map((item) => `<li>${item}</li>`)
    .join('') || '<li class="muted">No interaction history yet.</li>';
}

function exportBackup() {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), contacts: state.contacts }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'my-pals-backup.json';
  link.click();
  URL.revokeObjectURL(url);
}

function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!Array.isArray(parsed.contacts)) throw new Error('Invalid backup format');
      state.contacts = parsed.contacts;
      state.history.unshift(`${new Date().toLocaleString()}: Restored contacts from backup`);
      persist();
      render();
    } catch {
      alert('Could not restore backup. Please use a valid JSON export.');
    }
  };
  reader.readAsText(file);
}
