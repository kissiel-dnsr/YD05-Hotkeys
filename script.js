let scriptsData = [];
let favorites = JSON.parse(localStorage.getItem('yd05_favorites')) || [];
let recent = JSON.parse(localStorage.getItem('yd05_recent')) || [];
let currentCategory = 'All';

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    loadScripts();
    setupEventListeners();
});

async function loadScripts() {
    try {
        const response = await fetch('scripts.json');
        scriptsData = await response.json();
        document.getElementById('total-scripts-count').innerHTML = `<i class="fa-solid fa-file-lines"></i> ${scriptsData.length} Scripts`;
        renderCategories();
        renderCatalog(scriptsData);
        renderSidebarLists();
    } catch (error) {
        document.getElementById('catalog-section').innerHTML = `<div class="category-group" style="padding: 2rem; text-align: center; color: #ef4444;"><p>Failed to load scripts.json.</p></div>`;
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => filterAndRender(e.target.value));
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchInput.focus(); }
    });
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);
}

function renderCategories() {
    const categories = ['All', ...new Set(scriptsData.map(s => s.category))];
    const container = document.getElementById('category-filters');
    container.innerHTML = categories.map(cat => `<button class="filter-btn ${cat === currentCategory ? 'active' : ''}" onclick="filterByCategory('${cat}')">${cat}</button>`).join('');
}

function filterByCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.textContent.trim() === category));
    filterAndRender(document.getElementById('search-input').value);
}

function filterAndRender(query) {
    const q = query.toLowerCase();
    const filtered = scriptsData.filter(s => {
        const matchesCategory = currentCategory === 'All' || s.category === currentCategory;
        const matchesQuery = s.description.toLowerCase().includes(q) || s.script.toLowerCase().includes(q) || s.hotkey.toLowerCase().includes(q);
        return matchesCategory && matchesQuery;
    });
    renderCatalog(filtered);
}

function renderCatalog(data) {
    const catalogSection = document.getElementById('catalog-section');
    if (data.length === 0) {
        catalogSection.innerHTML = `<div class="category-group" style="padding: 2rem; text-align: center;"><p>No matching scripts found.</p></div>`;
        return;
    }
    const grouped = data.reduce((acc, script) => {
        acc[script.category] = acc[script.category] || [];
        acc[script.category].push(script);
        return acc;
    }, {});

    catalogSection.innerHTML = Object.keys(grouped).map(cat => `
        <div class="category-group">
            <div class="category-header">
                <h2>${cat}</h2>
                <span class="script-count-badge">${grouped[cat].length} Scripts</span>
            </div>
            <div class="category-body">
                ${grouped[cat].map(s => createScriptCard(s)).join('')}
            </div>
        </div>
    `).join('');
}

function createScriptCard(s) {
    const isFav = favorites.includes(s.hotkey);
    return `
        <div class="script-card" id="card-${s.hotkey}">
            <div class="script-meta-row">
                <div class="script-tags">
                    <span class="subcat-tag">${s.subcategory}</span>
                    <span class="hotkey-tag">${s.hotkey}</span>
                </div>
            </div>
            <div class="script-description">${s.description}</div>
            <div class="script-preview">${escapeHtml(s.script)}</div>
            <div class="script-actions">
                <button class="action-btn primary" onclick="copyScript('${s.hotkey}', \`${escapeJs(s.script)}\`)"><i class="fa-solid fa-copy"></i> Copy</button>
                <button class="action-btn" onclick="toggleFavorite('${s.hotkey}')"><i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" style="${isFav ? 'color: #ef4444;' : ''}"></i> ${isFav ? 'Favorited' : 'Favorite'}</button>
                <button class="action-btn" onclick="toggleExpand('${s.hotkey}')"><i class="fa-solid fa-chevron-down"></i> Expand</button>
            </div>
        </div>
    `;
}

function copyScript(hotkey, text) {
    navigator.clipboard.writeText(text).then(() => {
        if (!recent.includes(hotkey)) {
            recent.unshift(hotkey);
            if (recent.length > 5) recent.pop();
            localStorage.setItem('yd05_recent', JSON.stringify(recent));
            renderSidebarLists();
        }
        const btn = document.querySelector(`#card-${hotkey} .action-btn.primary`);
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
        setTimeout(() => btn.innerHTML = originalHTML, 1500);
    });
}

function toggleFavorite(hotkey) {
    if (favorites.includes(hotkey)) {
        favorites = favorites.filter(h => h !== hotkey);
    } else {
        favorites.push(hotkey);
    }
    localStorage.setItem('yd05_favorites', JSON.stringify(favorites));
    renderSidebarLists();
    filterAndRender(document.getElementById('search-input').value);
}

function toggleExpand(hotkey) {
    const card = document.getElementById(`card-${hotkey}`);
    card.classList.toggle('expanded');
    const btn = card.querySelector('.action-btn:last-child');
    const isExpanded = card.classList.contains('expanded');
    btn.innerHTML = `<i class="fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}"></i> ${isExpanded ? 'Collapse' : 'Expand'}`;
}

function renderSidebarLists() {
    const recentContainer = document.getElementById('recent-list');
    const favContainer = document.getElementById('favorites-list');
    recentContainer.innerHTML = recent.length === 0 ? '<p class="empty-notice">No recent scripts</p>' : recent.map(h => `<button class="filter-btn" style="width:100%; text-align:left;" onclick="scrollToScript('${h}')">${h}</button>`).join('');
    favContainer.innerHTML = favorites.length === 0 ? '<p class="empty-notice">No favorites added</p>' : favorites.map(h => `<button class="filter-btn" style="width:100%; text-align:left;" onclick="scrollToScript('${h}')">${h}</button>`).join('');
}

function scrollToScript(hotkey) {
    const card = document.getElementById(`card-${hotkey}`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function initDarkMode() {
    if (localStorage.getItem('yd05_theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('dark-mode-toggle').innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

function toggleDarkMode() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('yd05_theme', 'light');
        document.getElementById('dark-mode-toggle').innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('yd05_theme', 'dark');
        document.getElementById('dark-mode-toggle').innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

function escapeHtml(str) { return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function escapeJs(str) { return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`'); }
