const API_KEY = 'b9c94cfccf365991a80b85f96b025719';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const videoModal = document.getElementById('video-modal');
const videoContainer = document.getElementById('video-container');
const closeVideoBtn = document.getElementById('close-video-btn');

const GENRES = [
    { id: 28, name: "Acción" },
    { id: 12, name: "Aventura" },
    { id: 16, name: "Animación" },
    { id: 35, name: "Comedia" },
    { id: 80, name: "Crimen" },
    { id: 99, name: "Documental" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Familia" },
    { id: 14, name: "Fantasía" },
    { id: 36, name: "Historia" },
    { id: 27, name: "Terror" },
    { id: 10402, name: "Música" },
    { id: 9648, name: "Misterio" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Ciencia Ficción" },
    { id: 53, name: "Suspenso" }
];

let movies = []; 
let currentIndex = 0; 
let currentPage = 1; 
let isLoading = false; 

let watchlist = JSON.parse(localStorage.getItem('cinematch_watchlist')) || [];
let selectedGenres = JSON.parse(localStorage.getItem('cinematch_genres')) || [];
let seenMovies = JSON.parse(localStorage.getItem('cinematch_seen')) || [];

const cardContainer = document.getElementById('card-container');
const likeBtn = document.getElementById('like-btn');
const dislikeBtn = document.getElementById('dislike-btn');
const sidebar = document.getElementById('watchlist-sidebar');
const showWatchlistBtn = document.getElementById('show-watchlist-btn');
const closeSidebarBtn = document.getElementById('close-sidebar');
const watchlistUl = document.getElementById('watchlist-ul');
const backdrop = document.getElementById('overlay-backdrop');
const genresModal = document.getElementById('genres-modal');
const genresGrid = document.getElementById('genres-grid');
const saveGenresBtn = document.getElementById('save-genres-btn');
const configBtn = document.getElementById('config-btn');
const toast = document.getElementById('toast');

async function initApp() {
    renderGenres(); 

    if (selectedGenres.length === 0) {
        genresModal.classList.add('active');
    } else {
        fetchMovies();
    }
}

function renderGenres() {
    genresGrid.innerHTML = '';
    
    GENRES.forEach(genre => {
        const tag = document.createElement('div');
        tag.classList.add('genre-tag');
        tag.dataset.id = genre.id;
        tag.textContent = genre.name;
        
        if (selectedGenres.includes(genre.id.toString())) {
            tag.classList.add('selected');
        }
        
        tag.addEventListener('click', () => {
            tag.classList.toggle('selected');
        });

        genresGrid.appendChild(tag);
    });
}

saveGenresBtn.addEventListener('click', () => {
    const selectedElements = document.querySelectorAll('.genre-tag.selected');
    selectedGenres = Array.from(selectedElements).map(el => el.dataset.id);
    
    if (selectedGenres.length === 0) {
        showToast("⚠️ Elige al menos un género");
        return;
    }

    localStorage.setItem('cinematch_genres', JSON.stringify(selectedGenres));
    genresModal.classList.remove('active');
    
    resetAndFetch();
});

configBtn.addEventListener('click', () => {
    renderGenres();
    genresModal.classList.add('active');
});

async function fetchMovies() {
    if (isLoading) return;
    isLoading = true;

    try {
        let foundNewMovies = false;
        let attempts = 0; 

        while (!foundNewMovies && attempts < 5) {
            
            let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-ES&page=${currentPage}&sort_by=popularity.desc`;
            
            if (selectedGenres.length > 0) {
                const genreString = selectedGenres.join('|'); 
                url += `&with_genres=${genreString}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                break;
            }

            const unseenMovies = data.results.filter(movie => {
                const hasPoster = movie.poster_path !== null;
                const notSeen = !seenMovies.includes(movie.id); 
                return hasPoster && notSeen;
            });

            if (unseenMovies.length > 0) {
                movies = movies.concat(unseenMovies);
                foundNewMovies = true;
            } else {
                console.log(`Página ${currentPage} completada, buscando en la siguiente...`);
            }

            currentPage++;
            attempts++;
        }

        if (currentIndex === 0 && movies.length > 0) {
            renderCard();
        } else if (movies.length === 0 && currentPage > 1) {
             cardContainer.innerHTML = `
                <div style="text-align:center; padding:20px;">
                    <h3>¡Te has pasado el juego! 🤯</h3>
                    <p>No encontramos más películas con estos filtros.</p>
                    <button onclick="resetSeenMovies()" style="margin-top:15px; padding:10px 20px; cursor:pointer; background:var(--primary); color:white; border:none; border-radius:20px;">Borrar historial de vistos</button>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión 😓');
    } finally {
        isLoading = false;
    }
}

function resetAndFetch() {
    movies = [];
    currentIndex = 0;
    currentPage = 1;
    cardContainer.innerHTML = '<h3 style="color:#888">Buscando... 🍿</h3>';
    fetchMovies();
}

window.resetSeenMovies = () => {
    seenMovies = [];
    localStorage.removeItem('cinematch_seen');
    showToast("Historial borrado 🔄");
    resetAndFetch();
}

function renderCard() {
    if (movies.length - currentIndex < 4) {
        fetchMovies();
    }

    if (!movies[currentIndex]) {
        if(isLoading) cardContainer.innerHTML = '<h3 style="color:#888">Cargando más... 🎬</h3>';
        return;
    }

    const movie = movies[currentIndex];
    const posterSrc = movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/500x750';
    const date = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';

    const cardHTML = `
        <div class="movie-card" id="current-card">
            <img src="${posterSrc}" alt="${movie.title}">
            <div class="movie-info">
                <h2>${movie.title}</h2>
                <p>⭐ ${movie.vote_average.toFixed(1)} | 📅 ${date}</p>
                <button class="trailer-btn" onclick="showTrailer(${movie.id})">
                    <i class="fas fa-play"></i> Ver Trailer
                </button>
                <p class="overview">${movie.overview || 'Sin descripción.'}</p>
            </div>
        </div>
    `;
    cardContainer.innerHTML = cardHTML;
}

function markAsSeen(id) {
    if (!seenMovies.includes(id)) {
        seenMovies.push(id);
        localStorage.setItem('cinematch_seen', JSON.stringify(seenMovies));
    }
}

function handleLike() {
    const currentCard = document.getElementById('current-card');
    if(!currentCard) return;
    currentCard.classList.add('swipe-right');

    const movie = movies[currentIndex];
    
    if (!watchlist.some(m => m.id === movie.id)) {
        watchlist.push(movie);
        localStorage.setItem('cinematch_watchlist', JSON.stringify(watchlist));
        showToast("¡Guardada! ❤️");
    } else {
        showToast("Ya estaba en tu lista 😉");
    }

    markAsSeen(movie.id);

    setTimeout(() => { currentIndex++; renderCard(); }, 300);
}

function handleDislike() {
    const currentCard = document.getElementById('current-card');
    if(!currentCard) return;
    currentCard.classList.add('swipe-left');

    const movie = movies[currentIndex];
    
    markAsSeen(movie.id);

    setTimeout(() => { currentIndex++; renderCard(); }, 300);
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function renderWatchlist() {
    watchlistUl.innerHTML = '';
    if (watchlist.length === 0) {
        watchlistUl.innerHTML = '<li class="empty-message">Aún no tienes Likes 💔</li>';
        return;
    }
    watchlist.forEach(movie => {
        const li = document.createElement('li');
        li.classList.add('watchlist-item');
        const img = movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/50';
        li.innerHTML = `
            <img src="${img}"><h3>${movie.title}</h3>
            <button class="delete-btn" onclick="removeMovie(${movie.id})"><i class="fas fa-trash"></i></button>
        `;
        watchlistUl.appendChild(li);
    });
}

window.removeMovie = (id) => {
    watchlist = watchlist.filter(m => m.id !== id);
    localStorage.setItem('cinematch_watchlist', JSON.stringify(watchlist));
    renderWatchlist();
    showToast("Película eliminada 🗑️");
};

likeBtn.addEventListener('click', handleLike);
dislikeBtn.addEventListener('click', handleDislike);
showWatchlistBtn.addEventListener('click', () => { renderWatchlist(); sidebar.classList.add('open'); backdrop.classList.add('active'); });
closeSidebarBtn.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('active'); });
backdrop.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('active'); });
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') handleDislike();
    if (e.key === 'ArrowRight') handleLike();
});

initApp();

async function showTrailer(movieId) {
    try {
        const url = `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=es-ES`; 
        let response = await fetch(url);
        let data = await response.json();

        if (data.results.length === 0) {
            const urlEn = `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`;
            response = await fetch(urlEn);
            data = await response.json();
        }

        const trailer = data.results.find(vid => vid.type === "Trailer" && vid.site === "YouTube") 
                        || data.results[0]; 

        if (trailer) {
            const embedUrl = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
            videoContainer.innerHTML = `<iframe src="${embedUrl}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            videoModal.classList.add('active');
        } else {
            showToast("No hay trailer disponible 😔");
        }

    } catch (error) {
        console.error(error);
        showToast("Error al cargar trailer");
    }
}

closeVideoBtn.addEventListener('click', () => {
    videoModal.classList.remove('active');
    videoContainer.innerHTML = ''; 
});

videoModal.addEventListener('click', (e) => {
    if(e.target === videoModal) {
        videoModal.classList.remove('active');
        videoContainer.innerHTML = '';
    }
});
