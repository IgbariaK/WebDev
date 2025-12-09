// Get HTML element references
const form = document.getElementById('songForm');
const list = document.getElementById('songList');
const submitBtn = document.getElementById('submitBtn');
const titleInput = document.getElementById('title');
const urlInput = document.getElementById('url');
const ratingInput = document.getElementById('rating');
const searchInput = document.getElementById('search');
const tableView = document.getElementById('tableView');
const cardView = document.getElementById('cardView');
const viewToggleBtn = document.getElementById('viewToggleBtn');
const sortRadios = document.querySelectorAll('input[name="sortOption"]');
const songIdInput = document.getElementById('songId');
const playerModalEl = document.getElementById('playerModal');
const playerTitleEl = document.getElementById('playerModalTitle');
const playerIframe = document.getElementById('playerIframe');

let songs = [];
let currentSort = 'date';
let currentSearchTerm = '';
let currentView = 'table';
let playerModal = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Bootstrap modal instance
    if (playerModalEl && window.bootstrap) {
        playerModal = new bootstrap.Modal(playerModalEl);
        playerModalEl.addEventListener('hidden.bs.modal', () => {
            // Stop video when closing
            playerIframe.src = '';
        });
    }

    // Load from localStorage
    const storedData = localStorage.getItem('songs');
    if (storedData) {
        try {
            songs = JSON.parse(storedData);
        } catch (e) {
            console.error('Failed to parse songs from localStorage', e);
            songs = [];
        }
    }

    // Normalize data (add rating and youtubeId if missing)
    songs = songs.map(song => {
        const normalized = { ...song };
        if (normalized.rating == null) {
            normalized.rating = 5;
        }
        if (!normalized.youtubeId && normalized.url) {
            normalized.youtubeId = extractYouTubeId(normalized.url);
        }
        return normalized;
    });

    saveAndRender();
});

// Handle form submit (add or update)
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const rating = Number(ratingInput.value);
    const existingId = songIdInput.value;

    if (!title || !url) {
        alert('Please fill in both title and URL.');
        return;
    }

    const youtubeId = extractYouTubeId(url);
    if (!youtubeId) {
        alert('Please enter a valid YouTube URL.');
        return;
    }

    if (Number.isNaN(rating) || rating < 1 || rating > 10) {
        alert('Rating must be a number between 1 and 10.');
        return;
    }

    if (existingId) {
        // Update existing song
        const index = songs.findIndex(song => String(song.id) === existingId);
        if (index !== -1) {
            songs[index].title = title;
            songs[index].url = url;
            songs[index].rating = rating;
            songs[index].youtubeId = youtubeId;
        }
        resetFormState();
    } else {
        // Add new song
        const song = {
            id: Date.now(),
            title,
            url,
            rating,
            youtubeId,
            dateAdded: Date.now()
        };
        songs.push(song);
    }

    saveAndRender();
    form.reset();
    // Set default rating after reset
    ratingInput.value = 5;
});

// Save to localStorage and render UI
function saveAndRender() {
    localStorage.setItem('songs', JSON.stringify(songs));
    renderSongs();
}

// Render both table and card views
function renderSongs() {
    list.innerHTML = '';
    cardView.innerHTML = '';

    let filtered = songs;

    if (currentSearchTerm) {
        const term = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(song =>
            song.title.toLowerCase().includes(term)
        );
    }

    const sorted = [...filtered].sort((a, b) => {
        switch (currentSort) {
            case 'title':
                return a.title.localeCompare(b.title);
            case 'rating':
                return (b.rating || 0) - (a.rating || 0);
            case 'date':
            default:
                return (b.dateAdded || 0) - (a.dateAdded || 0); // newest first
        }
    });

    if (sorted.length === 0) {
        list.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">No songs found.</td>
            </tr>
        `;
        return;
    }

    sorted.forEach(song => {
        const thumbUrl = getThumbnailUrl(song);
        const prettyDate = song.dateAdded
            ? new Date(song.dateAdded).toLocaleString()
            : '';

        // Table row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                ${thumbUrl ? `<img src="${thumbUrl}" alt="Thumbnail"
                        style="width:80px;height:auto;" class="img-thumbnail me-2">` : ''}
            </td>
            <td>${song.title}</td>
            <td>${song.rating ?? ''}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-info me-2" onclick="openPlayer(${song.id})">
                    <i class="fas fa-play"></i>
                </button>
                <button class="btn btn-sm btn-warning me-2" onclick="editSong(${song.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSong(${song.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        list.appendChild(row);

        // Card view
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100">
                ${thumbUrl ? `<img src="${thumbUrl}" class="card-img-top" alt="Thumbnail">` : ''}
                <div class="card-body">
                    <h5 class="card-title">${song.title}</h5>
                    <p class="card-text mb-1">Rating: ${song.rating ?? ''}</p>
                    <p class="card-text"><small class="text-muted">${prettyDate}</small></p>
                </div>
                <div class="card-footer d-flex justify-content-between">
                    <button class="btn btn-sm btn-info" onclick="openPlayer(${song.id})">
                        <i class="fas fa-play"></i> Play
                    </button>
                    <div>
                        <button class="btn btn-sm btn-warning me-1" onclick="editSong(${song.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteSong(${song.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        cardView.appendChild(col);
    });
}

// Delete a song
function deleteSong(id) {
    if (confirm('Are you sure you want to delete this song?')) {
        songs = songs.filter(song => song.id !== id);
        saveAndRender();
    }
}

// Edit a song (load into form)
function editSong(id) {
    const songToEdit = songs.find(song => song.id === id);
    if (!songToEdit) return;

    titleInput.value = songToEdit.title;
    urlInput.value = songToEdit.url;
    ratingInput.value = songToEdit.rating ?? 5;
    songIdInput.value = songToEdit.id; // hidden field

    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update';
    submitBtn.classList.replace('btn-success', 'btn-warning');
}

// Reset form state back to "Add" mode
function resetFormState() {
    songIdInput.value = '';
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add';
    submitBtn.classList.replace('btn-warning', 'btn-success');
}

// Open player in modal window (not a new tab)
function openPlayer(id) {
    const song = songs.find(s => s.id === id);
    if (!song || !playerModal) return;

    const youtubeId = song.youtubeId || extractYouTubeId(song.url);
    if (!youtubeId) {
        alert('Cannot play this video. Invalid YouTube URL.');
        return;
    }

    const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
    playerTitleEl.textContent = song.title;
    playerIframe.src = embedUrl;
    playerModal.show();
}

// Extract YouTube ID from different URL formats
function extractYouTubeId(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (u.hostname === 'youtu.be') {
            return u.pathname.slice(1);
        }
        if (u.hostname.includes('youtube.com')) {
            const v = u.searchParams.get('v');
            if (v) return v;
            const parts = u.pathname.split('/');
            const embedIndex = parts.indexOf('embed');
            if (embedIndex !== -1 && parts[embedIndex + 1]) {
                return parts[embedIndex + 1];
            }
        }
    } catch (e) {
        // Fallback to simple regex
        const match = url.match(/v=([^&]+)/);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Get thumbnail URL from a song object
function getThumbnailUrl(song) {
    const id = song.youtubeId || extractYouTubeId(song.url);
    if (!id) return '';
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

// Handle search
searchInput.addEventListener('input', () => {
    currentSearchTerm = searchInput.value.trim();
    renderSongs();
});

// Handle sort radio buttons
sortRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.checked) {
            currentSort = radio.value;
            renderSongs();
        }
    });
});

// Handle view toggle (table <-> cards) with changing icon
viewToggleBtn.addEventListener('click', () => {
    if (currentView === 'table') {
        currentView = 'cards';
        tableView.classList.add('d-none');
        cardView.classList.remove('d-none');
        viewToggleBtn.innerHTML = '<i class="fas fa-table"></i>';
    } else {
        currentView = 'table';
        tableView.classList.remove('d-none');
        cardView.classList.add('d-none');
        viewToggleBtn.innerHTML = '<i class="fas fa-th-large"></i>';
    }
});

// Auto-fill title from YouTube using oEmbed (default title from YouTube)
urlInput.addEventListener('blur', () => {
    const url = urlInput.value.trim();
    if (!url) return;
    // Only auto-fill if title is empty (user can still change it)
    if (titleInput.value.trim() !== '') return;

    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
        .then(res => {
            if (!res.ok) throw new Error('Request failed');
            return res.json();
        })
        .then(data => {
            if (data && data.title) {
                titleInput.value = data.title;
            }
        })
        .catch(err => {
            console.warn('Could not fetch YouTube title', err);
        });
});
