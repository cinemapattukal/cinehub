
/*
 * CineHub - Movie Discovery
 * TMDB API documentation: https://developer.themoviedb.org/
 *
 * Replace YOUR_TMDB_API_KEY with your TMDB API v3 key.
 * A browser-side API key is visible to visitors.
 */

const TMDB_API_KEY = "2851b0a195ccff91a13b27dab86418c4";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/";

// Public read-only access to the movies collection used by the Admin Panel.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB96kqkeFLXWMIMvld9jS9SOmbx2g2sJ98",
  authDomain: "cinehub-27129.firebaseapp.com",
  projectId: "cinehub-27129",
  storageBucket: "cinehub-27129.firebasestorage.app",
  messagingSenderId: "564236433071",
  appId: "1:564236433071:web:474301819e114c22bac65a"
};

let firestoreReaderPromise;

async function loadAdminMovies() {
  if (!firestoreReaderPromise) {
    firestoreReaderPromise = (async () => {
      const appSdk = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
      const dbSdk = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
      let app;
      try { app = appSdk.getApp("cinehub-public-reader"); }
      catch { app = appSdk.initializeApp(FIREBASE_CONFIG, "cinehub-public-reader"); }
      return { db: dbSdk.getFirestore(app), collection: dbSdk.collection, getDocs: dbSdk.getDocs };
    })();
  }
  const sdk = await firestoreReaderPromise;
  const snapshot = await sdk.getDocs(sdk.collection(sdk.db, "movies"));
  const movies = snapshot.docs.map(document => {
    const saved = document.data() || {};
    const genres = Array.isArray(saved.genres) ? saved.genres : [];
    const genreIds = genres.map(item => {
      const name = typeof item === "string" ? item : item?.name;
      return state.genres.find(g => String(g.name).toLowerCase() === String(name || "").toLowerCase())?.id;
    }).filter(id => id !== undefined);
    const id = Number(saved.tmdbId ?? saved.id ?? document.id);
    return {
      ...saved,
      id: Number.isFinite(id) && id > 0 ? id : document.id,
      title: saved.title || saved.originalTitle || saved.original_title || "Untitled",
      original_title: saved.originalTitle || saved.original_title || saved.title || "",
      release_date: saved.releaseDate || saved.release_date || "",
      vote_average: Number(saved.rating ?? saved.vote_average ?? 0),
      genre_ids: genreIds,
      poster_path: saved.posterPath || saved.poster_path || null,
      backdrop_path: saved.backdropPath || saved.backdrop_path || null,
      overview: saved.overview || "",
      tagline: saved.tagline || "",
      trailerUrl: saved.trailerUrl || "",
      director: saved.director || "",
      cast: Array.isArray(saved.cast) ? saved.cast : []
    };
  });

  // Movies that recently received a song appear first on the homepage.
  const timeValue = value => {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value === "number") return value;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return movies.sort((a, b) => {
    const aSong = timeValue(a.lastSongAddedAt);
    const bSong = timeValue(b.lastSongAddedAt);
    if (aSong || bSong) return bSong - aSong;
    return timeValue(b.updatedAt || b.createdAt) - timeValue(a.updatedAt || a.createdAt);
  });
}

const demoMovies = [
  {
    id: 101, title: "The Dark Knight", release_date: "2008-07-18",
    vote_average: 9.0, genre_ids: [28, 80, 18],
    overview: "Batman faces a dangerous criminal who wants to plunge Gotham into chaos.",
    poster_path: null, backdrop_path: null
  },
  {
    id: 102, title: "Inception", release_date: "2010-07-16",
    vote_average: 8.8, genre_ids: [28, 878, 12],
    overview: "A skilled thief enters people's dreams to steal valuable secrets.",
    poster_path: null, backdrop_path: null
  },
  {
    id: 103, title: "Interstellar", release_date: "2014-11-07",
    vote_average: 8.7, genre_ids: [12, 18, 878],
    overview: "Explorers travel beyond this galaxy to find a future for humanity.",
    poster_path: null, backdrop_path: null
  },
  {
    id: 104, title: "The Shawshank Redemption", release_date: "1994-09-23",
    vote_average: 8.7, genre_ids: [18, 80],
    overview: "Two prisoners form an unexpected friendship over many years.",
    poster_path: null, backdrop_path: null
  },
  {
    id: 105, title: "The Matrix", release_date: "1999-03-31",
    vote_average: 8.2, genre_ids: [28, 878],
    overview: "A computer hacker discovers a surprising truth about reality.",
    poster_path: null, backdrop_path: null
  },
  {
    id: 106, title: "Spider-Man: Into the Spider-Verse",
    release_date: "2018-12-14", vote_average: 8.4,
    genre_ids: [16, 28, 12],
    overview: "A young hero discovers that many versions of Spider-Man exist.",
    poster_path: null, backdrop_path: null
  }
];

const demoGenres = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Horror" },
  { id: 878, name: "Science Fiction" }
];

const state = {
  movies: [],
  allMovies: [],
  genres: demoGenres,
  page: 1,
  mode: "trending",
  query: "",
  genre: "",
  usingDemo: true,
  loading: false
};

const $ = id => document.getElementById(id);

const elements = {
  grid: $("trending"),
  title: $("resultsTitle"),
  subtitle: $("resultsSubtitle"),
  search: $("searchInput"),
  genre: $("genreSelect"),
  loadMore: $("loadMoreBtn"),
  hero: $("hero"),
  heroArt: $("heroArt"),
  modal: $("movieModal"),
  modalTitle: $("modalTitle"),
  modalMeta: $("modalMeta"),
  modalOverview: $("modalOverview"),
  modalBackdrop: $("modalBackdrop"),
  modalMessage: $("modalMessage"),
  trailer: $("trailerContainer"),
  trailerBtn: $("trailerBtn"),
  detailPoster: $("detailPoster"),
  detailType: $("detailType"),
  detailStatus: $("detailStatus"),
  detailTagline: $("detailTagline"),
  detailDateRuntime: $("detailDateRuntime"),
  detailScore: $("detailScore"),
  detailPercent: $("detailPercent"),
  detailGenres: $("detailGenres"),
  detailFacts: $("detailFacts"),
  detailProduction: $("detailProduction"),
  detailCast: $("detailCast"),
  collectionSection: $("collectionSection"),
  collectionTitle: $("collectionTitle"),
  collectionMovies: $("collectionMovies"),
  similarMovies: $("similarMovies"),
  watchNowBtn: $("watchNowBtn"),
  downloadBtn: $("downloadBtn"),
  watchlistBtn: $("watchlistBtn"),
  favoriteBtn: $("favoriteBtn")
};

function hasApiKey() {
  return TMDB_API_KEY.trim() !== "" &&
    TMDB_API_KEY !== "YOUR_TMDB_API_KEY";
}

function posterUrl(path, size = "w500") {
  return path ? IMAGE_BASE + size + path : "";
}

function backdropUrl(path) {
  return path ? IMAGE_BASE + "w1280" + path : "";
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function slugify(value = "") {
  return String(value).toLowerCase()
    .normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "movie";
}

function getSiteBasePath() {
  const path = location.pathname;
  const match = path.match(/^(.*)\/movie\/\d+(?:-[^/]*)?\/?$/);
  if (match) return match[1] || "/cinehub";
  if (path === "/cinehub" || path === "/cinehub/") return "/cinehub";
  if (path.startsWith("/cinehub/")) return "/cinehub";
  if (path.endsWith("/index.html")) return path.slice(0, -11).replace(/\/$/, "") || "/cinehub";
  return "/cinehub";
}
function moviePath(movie) {
  return getSiteBasePath() + "/movie/" +
    encodeURIComponent(movie.id) + "-" +
    slugify(movie.title || movie.name || "movie");
}

function movieYear(movie) {
  return movie.release_date
    ? movie.release_date.slice(0, 4)
    : "Year unknown";
}

function rating(movie) {
  const number = Number(movie.vote_average);
  return Number.isFinite(number) && number > 0
    ? number.toFixed(1)
    : "N/A";
}

function getGenreNames(movie) {
  return (movie.genre_ids || [])
    .map(id => state.genres.find(genre => genre.id === id)?.name)
    .filter(Boolean);
}

async function apiGet(path, params = {}) {
  if (!hasApiKey()) throw new Error("TMDB API key not configured.");

  const url = new URL(TMDB_BASE + path);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "en-US");

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error("TMDB request failed: " + response.status);
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("TMDB request timed out. Check your connection or API key.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadGenres() {
  if (hasApiKey()) {
    try {
      const data = await apiGet("/genre/movie/list");
      if (Array.isArray(data.genres) && data.genres.length) {
        state.genres = data.genres;
      }
    } catch (error) {
      console.warn("Could not load genres:", error.message);
    }
  }

  elements.genre.innerHTML =
    '<option value="">All Genres</option>' +
    state.genres.map(genre =>
      `<option value="${genre.id}">${escapeHTML(genre.name)}</option>`
    ).join("");
}

function getEndpoint() {
  if (state.query.trim()) return "/search/movie";
  if (state.mode === "toprated") return "/movie/top_rated";
  if (state.mode === "popular") return "/movie/popular";
  return "/trending/movie/week";
}

async function fetchMovies(page = 1) {
  if (state.loading) return;
  state.loading = true;
  if (page === 1) elements.grid.innerHTML = '<div class="loading">Loading movies...</div>';
  elements.loadMore.hidden = true;
  elements.loadMore.disabled = true;
  elements.loadMore.textContent = "Loading...";
  try {
    state.usingDemo = false;
    state.page = 1;
    const adminMovies = await loadAdminMovies();
    state.allMovies = adminMovies;
    applyFilters();
    elements.subtitle.textContent = state.query.trim()
      ? `Search results for "${state.query.trim()}"`
      : "Movies added by the CineHub admin.";
    elements.loadMore.hidden = true;
    const featured = state.allMovies[0];
    if (featured?.backdrop_path && elements.heroArt) {
      elements.heroArt.style.backgroundImage = `url("${backdropUrl(featured.backdrop_path)}")`;
    }
  } catch (error) {
    console.error("Could not load Admin movies from Firestore:", error);
    state.allMovies = [];
    applyFilters();
    elements.subtitle.textContent = "Could not load saved movies. Check Firestore Rules and Firebase configuration.";
    elements.grid.innerHTML = '<div class="empty-state">Could not load movies. Please check your connection and Firestore settings.</div>';
  } finally {
    state.loading = false;
    elements.loadMore.disabled = false;
    elements.loadMore.textContent = "Load More Movies";
    elements.loadMore.hidden = true;
  }
}

function applyFilters() {
  const selectedGenre = state.genre;

  const query = state.query.trim().toLowerCase();
  const filtered = state.allMovies.filter(movie => {
    const matchesGenre = !selectedGenre || (movie.genre_ids || []).includes(Number(selectedGenre));
    const matchesQuery = !query || String(movie.title || "").toLowerCase().includes(query) || String(movie.original_title || "").toLowerCase().includes(query);
    return matchesGenre && matchesQuery;
  });

  state.movies = filtered;
  renderMovies(filtered);
}

function renderMovies(movies) {
  if (!movies.length) {
    elements.grid.innerHTML =
      '<div class="empty-state">No movies found. Try another search or genre.</div>';
    return;
  }

  elements.grid.innerHTML = movies.map(movie => {
    const poster = posterUrl(movie.poster_path);
    const title = escapeHTML(movie.title || movie.name || "Untitled");
    const image = poster
      ? `<img src="${poster}" alt="${title}" loading="lazy"
          onerror="this.style.display='none'">`
      : "";

    return `
      <article class="movie-card" tabindex="0" role="button"
        aria-label="View ${title}" data-movie-id="${movie.id}">
        <div class="poster-wrap">
          ${image}
          <span class="rating">★ ${rating(movie)}</span>
        </div>
        <h3 class="card-title">${title}</h3>
        <div class="card-year">${escapeHTML(movieYear(movie))}</div>
      </article>
    `;
  }).join("");
}

function updateHeading() {
  elements.title.textContent = state.query.trim() ? "Search Results" : "Movies";
  elements.subtitle.textContent = state.query.trim()
    ? `Search results for "${state.query.trim()}"`
    : "Movies added by the CineHub admin.";
}

async function changeMode(mode) {
  state.mode = mode;
  state.query = "";
  state.genre = "";
  state.page = 1;
  elements.search.value = "";
  elements.genre.value = "";
  document.querySelectorAll("nav a").forEach(link => {
    link.classList.toggle("active", link.dataset.mode === mode);
  });
  updateHeading();
  applyFilters();
}

function getSavedSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]").map(String)); }
  catch { return new Set(); }
}

function saveSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); }
  catch (error) { console.warn("Could not save preference:", error); }
}

function dateLabel(date) {
  if (!date) return "Not announced";
  const parsed = new Date(date + "T00:00:00");
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function runtimeLabel(minutes) {
  if (!Number(minutes)) return "Not available";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours ? `${hours}h ` : ""}${mins ? `${mins}m` : ""}`.trim();
}

function renderMiniMovies(container, movies) {
  if (!movies || !movies.length) {
    container.innerHTML = '<span class="muted">No related movies found.</span>';
    return;
  }
  container.innerHTML = movies.slice(0, 12).map(movie => {
    const title = escapeHTML(movie.title || "Untitled");
    const image = posterUrl(movie.poster_path, "w342");
    return `<button class="related-card" type="button" data-related-id="${movie.id}" aria-label="Open ${title}">
      ${image ? `<img src="${image}" alt="${title}" loading="lazy">` : '<div class="related-placeholder">No poster</div>'}
      <span>${title}</span><small>${escapeHTML(movieYear(movie))} · ★ ${rating(movie)}</small>
    </button>`;
  }).join("");
}

function updateSavedButtons(movie) {
  const watchlist = getSavedSet("cinehub-watchlist");
  const favorites = getSavedSet("cinehub-favorites");
  const id = String(movie.id);
  elements.watchlistBtn.textContent = watchlist.has(id) ? "✓ In Watchlist" : "＋ Watchlist";
  elements.favoriteBtn.textContent = favorites.has(id) ? "♥" : "♡";
  elements.favoriteBtn.classList.toggle("is-favorite", favorites.has(id));
}

function toggleSaved(key, movie) {
  const saved = getSavedSet(key);
  const id = String(movie.id);
  if (saved.has(id)) saved.delete(id); else saved.add(id);
  saveSet(key, saved);
  updateSavedButtons(movie);
}

async function loadMovieDetails(movie) {
  elements.detailProduction.innerHTML = '<span class="muted">Loading production details...</span>';
  elements.detailCast.innerHTML = '<span class="muted">Loading cast...</span>';
  elements.similarMovies.innerHTML = '<span class="muted">Loading recommendations...</span>';
  elements.collectionSection.hidden = true;

  if (!hasApiKey() || !Number.isFinite(Number(movie.id))) {
    elements.detailProduction.innerHTML = `<span class="muted">${escapeHTML(movie.director || "Production information unavailable.")}</span>`;
    const savedCast = movie.cast || [];
    elements.detailCast.innerHTML = savedCast.length ? savedCast.slice(0, 16).map(person => `<div class="cast-card">${person.profilePath ? `<img src="${posterUrl(person.profilePath, "w185")}" alt="" loading="lazy">` : '<div class="cast-placeholder">No photo</div>'}<strong>${escapeHTML(person.name || "Unknown")}</strong><small>${escapeHTML(person.character || "")}</small></div>`).join("") : '<span class="muted">Cast information unavailable.</span>';
    elements.similarMovies.innerHTML = '<span class="muted">No recommendations available.</span>';
    return;
  }

  try {
    const [details, credits, similar] = await Promise.all([
      apiGet(`/movie/${movie.id}`, { append_to_response: "release_dates" }),
      apiGet(`/movie/${movie.id}/credits`),
      apiGet(`/movie/${movie.id}/similar`, { page: 1 })
    ]);

    // Do not overwrite a newly opened movie if the previous request finishes late.
    if (String(elements.modal.dataset.movieId) !== String(movie.id)) return;

    const score = Number(details.vote_average || movie.vote_average || 0);
    elements.detailType.textContent = "MOVIE";
    elements.detailStatus.textContent = details.status || "Details";
    elements.detailTagline.textContent = details.tagline ? `“${details.tagline}”` : "";
    elements.detailDateRuntime.textContent =
      `${dateLabel(details.release_date)}  •  ${runtimeLabel(details.runtime)}`;
    elements.detailScore.textContent = score ? score.toFixed(1) : "—";
    elements.detailPercent.textContent = score ? `${Math.round(score * 10)}%` : "—";

    elements.detailGenres.innerHTML = (details.genres || []).map(genre =>
      `<span class="genre-chip">${escapeHTML(genre.name)}</span>`
    ).join("");

    const facts = [
      ["Release Date", dateLabel(details.release_date)],
      ["Runtime", runtimeLabel(details.runtime)],
      ["Original Language", (details.original_language || "—").toUpperCase()],
      ["Status", details.status || "—"],
      ["Budget", Number(details.budget) > 0 ? "$" + Number(details.budget).toLocaleString("en-US") : "Not available"],
      ["Revenue", Number(details.revenue) > 0 ? "$" + Number(details.revenue).toLocaleString("en-US") : "Not available"]
    ];
    elements.detailFacts.innerHTML = facts.map(([label, value]) =>
      `<div class="fact"><small>${escapeHTML(label)}</small><strong>${escapeHTML(value)}</strong></div>`
    ).join("");

    const companies = details.production_companies || [];
    elements.detailProduction.innerHTML = companies.length
      ? companies.map(company => `<span class="production-company">${company.logo_path
        ? `<img src="${posterUrl(company.logo_path, "w185")}" alt="">`
        : ""}<span>${escapeHTML(company.name)}</span></span>`).join("")
      : '<span class="muted">Production companies not listed.</span>';

    const cast = (credits.cast || []).slice(0, 16);
    elements.detailCast.innerHTML = cast.length ? cast.map(person => {
      const name = escapeHTML(person.name || "Unknown");
      const character = escapeHTML(person.character || "");
      const photo = person.profile_path
        ? posterUrl(person.profile_path, "w185")
        : "";
      return `<div class="cast-card">${photo
        ? `<img src="${photo}" alt="${name}" loading="lazy">`
        : '<div class="cast-placeholder">No photo</div>'}
        <strong>${name}</strong><small>${character}</small></div>`;
    }).join("") : '<span class="muted">Cast information not listed.</span>';

    if (details.belongs_to_collection) {
      elements.collectionSection.hidden = false;
      elements.collectionTitle.textContent = details.belongs_to_collection.name || "Movie Collection";
      try {
        const collection = await apiGet(`/collection/${details.belongs_to_collection.id}`);
        if (String(elements.modal.dataset.movieId) === String(movie.id)) {
          renderMiniMovies(elements.collectionMovies, (collection.parts || []).filter(item => item.id !== movie.id));
        }
      } catch {
        elements.collectionMovies.innerHTML = '<span class="muted">Collection information unavailable.</span>';
      }
    }

    renderMiniMovies(elements.similarMovies, similar.results || []);
  } catch (error) {
    console.warn("Movie details could not be loaded:", error.message);
    elements.detailProduction.innerHTML = '<span class="muted">Could not load production information.</span>';
    elements.detailCast.innerHTML = '<span class="muted">Could not load cast information.</span>';
    elements.similarMovies.innerHTML = '<span class="muted">Could not load recommendations.</span>';
  }
}

function showMovie(movie) {
  elements.modal.hidden = false;
  document.body.style.overflow = "hidden";
  elements.modal.dataset.movieId = String(movie.id);
  elements.modalTitle.textContent = movie.title || "Movie details";
  elements.modalMeta.textContent = "";
  elements.modalOverview.textContent =
    movie.overview || "No description is available for this movie.";

  const poster = posterUrl(movie.poster_path);
  elements.detailPoster.src = poster || "";
  elements.detailPoster.hidden = !poster;
  elements.detailPoster.alt = (movie.title || "Movie") + " poster";
  elements.detailType.textContent = "MOVIE";
  elements.detailStatus.textContent = "Loading details";
  elements.detailTagline.textContent = "";
  elements.detailDateRuntime.textContent =
    `${dateLabel(movie.release_date)}  •  Runtime unavailable`;
  const score = Number(movie.vote_average || 0);
  elements.detailScore.textContent = score ? score.toFixed(1) : "—";
  elements.detailPercent.textContent = score ? `${Math.round(score * 10)}%` : "—";
  elements.detailGenres.innerHTML = getGenreNames(movie).map(name =>
    `<span class="genre-chip">${escapeHTML(name)}</span>`
  ).join("");
  elements.detailFacts.innerHTML = "";
  elements.detailProduction.innerHTML = '<span class="muted">Loading...</span>';
  elements.detailCast.innerHTML = '<span class="muted">Loading cast...</span>';
  elements.similarMovies.innerHTML = '<span class="muted">Loading recommendations...</span>';
  elements.collectionSection.hidden = true;
  elements.modalMessage.textContent = "";
  elements.trailer.innerHTML = "";
  elements.trailer.hidden = true;
  elements.trailerBtn.disabled = false;
  elements.trailerBtn.textContent = "▶ Watch Trailer";

  updateSavedButtons(movie);

  elements.watchlistBtn.onclick = () => toggleSaved("cinehub-watchlist", movie);
  elements.favoriteBtn.onclick = () => toggleSaved("cinehub-favorites", movie);
  elements.watchNowBtn.onclick = () => {
    elements.modalMessage.textContent =
      "A licensed full-movie video source has not been added for this title yet.";
  };
  elements.downloadBtn.onclick = () => {
    elements.modalMessage.textContent =
      "A download link is not available for this title. Downloads can be added when an authorized source is provided.";
  };
  elements.trailerBtn.onclick = () => loadTrailer(movie);

  loadMovieDetails(movie);
}

async function loadTrailer(movie) {
  elements.modalMessage.textContent = "Loading trailer...";
  elements.trailerBtn.disabled = true;
  try {
    let videoUrl = String(movie.trailerUrl || movie.trailer_url || "").trim();
    let youtubeId = "";
    if (videoUrl) {
      try {
        const url = new URL(videoUrl);
        if (url.hostname.includes("youtu.be")) youtubeId = url.pathname.split("/").filter(Boolean)[0] || "";
        else if (url.hostname.includes("youtube.com")) {
          youtubeId = url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1] || "";
        }
      } catch {}
    }
    if (!youtubeId && hasApiKey()) {
      const data = await apiGet(`/movie/${movie.id}/videos`);
      const videos = data.results || [];
      const trailer = videos.find(v => v.site === "YouTube" && v.type === "Trailer" && v.official)
        || videos.find(v => v.site === "YouTube" && v.type === "Trailer")
        || videos.find(v => v.site === "YouTube" && v.type === "Teaser");
      if (trailer) youtubeId = trailer.key;
    }
    if (!youtubeId) throw new Error("No trailer available. Add a YouTube trailer URL in Admin Panel.");
    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(youtubeId);
    iframe.title = (movie.title || "Movie") + " trailer";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    elements.trailer.replaceChildren(iframe);
    elements.trailer.hidden = false;
    elements.modalMessage.textContent = "Trailer provided through YouTube.";
    elements.trailerBtn.textContent = "▶ Trailer Loaded";
  } catch (error) {
    elements.modalMessage.textContent = error.message;
    elements.trailerBtn.textContent = "▶ Try Trailer Again";
  } finally {
    elements.trailerBtn.disabled = false;
  }
}

function closeModal() {
  elements.modal.hidden = true;
  elements.trailer.innerHTML = "";
  elements.trailer.hidden = true;
  document.body.style.overflow = "";
}

function setupEvents() {
  let searchTimer;

  elements.search.addEventListener("input", () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
      state.query = elements.search.value.trim();
      state.page = 1;
      updateHeading();
      applyFilters();
    }, 350);
  });

  elements.genre.addEventListener("change", () => {
    state.genre = elements.genre.value;
    applyFilters();
  });

  elements.loadMore.addEventListener("click", () => {
    if (!state.usingDemo && !state.query.trim()) {
      fetchMovies(state.page + 1);
    } else if (!state.usingDemo && state.query.trim()) {
      fetchMovies(state.page + 1);
    }
  });

  document.querySelectorAll("nav a[data-mode]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      changeMode(link.dataset.mode);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  elements.grid?.addEventListener("click", event => {
    const card = event.target.closest("[data-movie-id]");
    if (!card) return;
    const id = card.dataset.movieId;
    const movie = [...state.allMovies, ...(state.movies || [])]
      .find(item => String(item.id) === String(id));
    window.location.href = moviePath(movie || { id, title: "movie" });
  });

  elements.modal?.addEventListener("click", event => {
    const related = event.target.closest("[data-related-id]");
    if (!related) return;
    const id = Number(related.dataset.relatedId);
    const relatedMovie = [
      ...state.allMovies,
      ...(state.movies || [])
    ].find(item => Number(item.id) === id);
    if (relatedMovie) {
      showMovie(relatedMovie);
    } else {
      apiGet(`/movie/${id}`).then(showMovie).catch(() => {
        elements.modalMessage.textContent = "Could not open this movie. Please try again.";
      });
    }
  });

  elements.grid?.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest("[data-movie-id]");
    if (!card) return;
    event.preventDefault();
    card.click();
  });

  $("closeModal")?.addEventListener("click", closeModal);

  elements.modal.addEventListener("click", event => {
    if (event.target.dataset.close === "true") closeModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !elements.modal.hidden) {
      closeModal();
    }
  });

  $("exploreBtn").addEventListener("click", () => {
    document.getElementById("trending").scrollIntoView({
      behavior: "smooth"
    });
  });
}

async function init() {
  try {
    setupEvents();
    await loadGenres();
    updateHeading();
    await fetchMovies(1);

    const featured = state.allMovies[0];
    if (featured && featured.backdrop_path && elements.heroArt) {
      elements.heroArt.style.backgroundImage =
        `url("${backdropUrl(featured.backdrop_path)}")`;
    }
  } catch (error) {
    console.error("CineHub startup error:", error);
    if (elements.grid) {
      elements.grid.innerHTML =
        '<div class="empty-state">CineHub could not start. Refresh the page or check app.js.</div>';
    }
    if (elements.genre) {
      elements.genre.innerHTML = '<option value="">All Genres</option>';
    }
  }
}

init();
