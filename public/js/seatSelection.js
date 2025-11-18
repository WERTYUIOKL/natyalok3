// Minimal client socket logic to lock/unlock seats and handle updates.
// Include this script in seats.ejs

const socket = io(); // socket.io client should be included in template

function joinMovie(movieId) {
  socket.emit("join:movie", { movieId });
}

function lockSeats(movieId, seats, userId) {
  socket.emit("seat:lock", { movieId, seats, userId });
}

function unlockSeats(movieId, seats, userId) {
  socket.emit("seat:unlock", { movieId, seats, userId });
}

socket.on("seat:update", ({ type, seats, by }) => {
  seats.forEach(label => {
    const el = document.querySelector(`[data-seat="${label}"]`);
    if (!el) return;
    if (type === "lock") {
      el.classList.add("locked");
      el.dataset.lockedBy = by;
    } else if (type === "unlock") {
      el.classList.remove("locked");
      delete el.dataset.lockedBy;
    }
  });
});

///new



// Save last selected seat in browser (localStorage)
function rememberSeat(seatLabel) {
  localStorage.setItem("lastSelectedSeat", seatLabel);
}

function getLastSeat() {
  return localStorage.getItem("lastSelectedSeat");
}

// Example: when user locks a seat, store it locally
socket.on("seat:update", ({ type, seats, by }) => {
  seats.forEach(label => {
    const el = document.querySelector(`[data-seat="${label}"]`);
    if (!el) return;
    if (type === "lock") {
      el.classList.add("locked");
      el.dataset.lockedBy = by;
      rememberSeat(label);
    } else if (type === "unlock") {
      el.classList.remove("locked");
      delete el.dataset.lockedBy;
    }
  });
});

// Display previously selected seat on load
document.addEventListener("DOMContentLoaded", () => {
  const lastSeat = getLastSeat();
  if (lastSeat) console.log("Last seat you interacted with:", lastSeat);
});
