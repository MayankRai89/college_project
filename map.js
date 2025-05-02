// Initialize the map
const map = L.map('map').setView([23.1815, 79.9864], 16);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add zoom control
L.control.scale().addTo(map);

// Add layer switcher
const baseLayers = {
  'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
};
L.control.layers(baseLayers).addTo(map);

// Add scroll wheel zoom
map.scrollWheelZoom.enable();

// Add custom logo in the corner
const logo = L.control({ position: 'bottomright' });
logo.onAdd = function () {
  const div = L.DomUtil.create('div', 'custom-logo');
  div.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Location_dot_black.svg/2048px-Location_dot_black.svg.png" alt="Logo" style="width:40px;">';
  return div;
};
logo.addTo(map);

// Suggestion list data
const suggestions = [
  { name: 'Main Gate', coords: [23.129788, 79.872776] },
  { name: 'Globe', coords: [23.129175, 79.873840] },
  { name: 'Library', coords: [23.129070, 79.873973] },
  { name: 'ITS Canteen', coords: [23.129783, 79.874398] },
  { name: 'CT Canteen', coords: [23.128264540734595, 79.87503461153817] },
  { name: 'ITS parking', coords: [23.129541, 79.874314] },
  { name: 'Basket ball court', coords: [23.127824, 79.875065] },
  { name: 'College Ground', coords: [23.127683, 79.875430] },
  { name: 'Herbal Garden', coords: [23.128233, 79.876583] },
  { name: 'Workshop', coords: [23.129668, 79.874617] },
  { name: 'CT Parking', coords: [23.128002, 79.876167] }
];

let currentMarker = null;

// OSRM route drawing
function drawRouteWithOSRM(startCoords, endCoords) {
  const url = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.routes && data.routes.length > 0) {
        const routeGeoJSON = data.routes[0].geometry;
        L.geoJSON(routeGeoJSON, {
          style: { color: 'blue', weight: 4 }
        }).addTo(map);
      } else {
        alert('No route found.');
      }
    })
    .catch(() => alert('Failed to fetch route from OSRM.'));
}

// Connect search input to map
function searchLocation() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const result = suggestions.find(loc => loc.name.toLowerCase() === query);

  if (result) {
    if (currentMarker) {
      map.removeLayer(currentMarker);
    }

    currentMarker = L.marker(result.coords).addTo(map)
      .bindPopup(result.name)
      .openPopup();

    map.setView(result.coords, 17);
  } else {
    alert('Location not found in suggestions!');
  }
}

// Enhanced Autocomplete Dropdown
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  const suggestionList = document.getElementById('suggestions'); // ul element

  input.addEventListener('input', () => {
    const val = input.value.toLowerCase();
    suggestionList.innerHTML = '';

    if (val.length > 0) {
      const matches = suggestions.filter(loc => loc.name.toLowerCase().includes(val));
      matches.forEach(match => {
        const li = document.createElement('li');
        li.textContent = match.name;
        li.className = 'suggestion-item';
        li.onclick = () => {
          input.value = match.name;
          suggestionList.innerHTML = '';
          searchLocation();
        };
        suggestionList.appendChild(li);
      });
      suggestionList.style.display = 'block';
    } else {
      suggestionList.style.display = 'none';
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !suggestionList.contains(e.target)) {
      suggestionList.style.display = 'none';
    }
  });

  // Live location button
  const liveBtn = document.createElement('button');
  liveBtn.innerText = 'Go from my location';
  liveBtn.style.marginTop = '10px';
  input.parentNode.appendChild(liveBtn);

  liveBtn.addEventListener('click', () => {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const destination = suggestions.find(loc => loc.name.toLowerCase() === query);

    if (!destination) {
      alert('Select a valid destination first.');
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const userCoords = [position.coords.latitude, position.coords.longitude];

        if (currentMarker) {
          map.removeLayer(currentMarker);
        }

        drawRouteWithOSRM(userCoords, destination.coords); // Use OSRM route

        L.marker(userCoords).addTo(map).bindPopup('Your Location').openPopup();
        currentMarker = L.marker(destination.coords).addTo(map).bindPopup(destination.name).openPopup();

        map.fitBounds([userCoords, destination.coords]);
        map.setZoom(16);
      }, () => {
        alert('Unable to get your location.');
      });
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  });
});
