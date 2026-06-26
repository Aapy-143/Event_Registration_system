const eventForm = document.getElementById("eventForm");
const registrationForm = document.getElementById("registrationForm");
const message = document.getElementById("message");
const eventList = document.getElementById("eventList");
const registrationList = document.getElementById("registrationList");
const eventSelect = document.getElementById("eventSelect");

eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    eventDate: document.getElementById("eventDate").value,
    location: document.getElementById("location").value.trim(),
    seats: document.getElementById("seats").value
  };

  try {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    message.textContent = result.message;

    if (result.success) {
      eventForm.reset();
      loadEvents();
    }
  } catch (error) {
    message.textContent = "Error creating event.";
  }
});

registrationForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById("userName").value.trim(),
    email: document.getElementById("userEmail").value.trim(),
    eventId: document.getElementById("eventSelect").value
  };

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    message.textContent = result.message;

    if (result.success) {
      registrationForm.reset();
      loadEvents();
      loadRegistrations();
    }
  } catch (error) {
    message.textContent = "Error registering for event.";
  }
});

async function loadEvents() {
  try {
    const response = await fetch("/api/events");
    const data = await response.json();

    if (!data.success) {
      eventList.innerHTML = "<p>Unable to load events.</p>";
      return;
    }

    eventList.innerHTML = "";
    eventSelect.innerHTML = `<option value="">Select event</option>`;

    if (data.events.length === 0) {
      eventList.innerHTML = "<p>No events created yet.</p>";
      return;
    }

    data.events.forEach((event) => {
      const availableSeats = event.seats - event.registered_count;
      const item = document.createElement("div");
      item.className = "item";

      item.innerHTML = `
        <h3>${event.title}</h3>
        <p>${event.description}</p>
        <p><strong>Date:</strong> ${event.event_date}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Total Seats:</strong> ${event.seats}</p>
        <p><strong>Registered:</strong> ${event.registered_count}</p>
        <p><strong>Available Seats:</strong> ${availableSeats}</p>
        <p class="small">Event ID: ${event.id}</p>
      `;

      eventList.appendChild(item);

      if (availableSeats > 0) {
        const option = document.createElement("option");
        option.value = event.id;
        option.textContent = `${event.title} - ${event.event_date}`;
        eventSelect.appendChild(option);
      }
    });
  } catch (error) {
    eventList.innerHTML = "<p>Error loading events.</p>";
  }
}

async function loadRegistrations() {
  try {
    const response = await fetch("/api/registrations");
    const data = await response.json();

    if (!data.success) {
      registrationList.innerHTML = "<p>Unable to load registrations.</p>";
      return;
    }

    registrationList.innerHTML = "";

    if (data.registrations.length === 0) {
      registrationList.innerHTML = "<p>No registrations yet.</p>";
      return;
    }

    data.registrations.forEach((reg) => {
      const item = document.createElement("div");
      item.className = "item";

      let cancelButton = "";
      if (reg.status === "registered") {
        cancelButton = `
          <button class="cancel-btn" onclick="cancelRegistration(${reg.registration_id})">
            Cancel Registration
          </button>
        `;
      }

      item.innerHTML = `
        <h3>${reg.event_title}</h3>
        <p><strong>Name:</strong> ${reg.name}</p>
        <p><strong>Email:</strong> ${reg.email}</p>
        <p><strong>Date:</strong> ${reg.event_date}</p>
        <p><strong>Location:</strong> ${reg.location}</p>
        <p><strong>Status:</strong> ${reg.status}</p>
        <p class="small">Registration ID: ${reg.registration_id}</p>
        ${cancelButton}
      `;

      registrationList.appendChild(item);
    });
  } catch (error) {
    registrationList.innerHTML = "<p>Error loading registrations.</p>";
  }
}

async function cancelRegistration(id) {
  try {
    const response = await fetch(`/api/registrations/${id}/cancel`, { method: "PUT" });
    const result = await response.json();
    message.textContent = result.message;
    loadEvents();
    loadRegistrations();
  } catch (error) {
    message.textContent = "Error cancelling registration.";
  }
}

loadEvents();
loadRegistrations();
