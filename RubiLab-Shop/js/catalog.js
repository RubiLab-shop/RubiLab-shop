// RubiLab — catalog.js | Catalog Page Controller & Modal Manager

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the products page
    const catalogGrid = document.getElementById('catalog-products-grid');
    if (!catalogGrid) return;

    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const categoryFilters = document.querySelectorAll('.category-filter');
    const sortSelect = document.getElementById('sort-select');
    const resultsCount = document.getElementById('results-count');

    // Modal DOM Elements
    const modal = document.getElementById('product-detail-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalImgContainer = document.getElementById('modal-img-container');
    const modalCategory = document.getElementById('modal-category');
    const modalTitle = document.getElementById('modal-title');
    const modalRatingVal = document.getElementById('modal-rating-val');
    const modalPrice = document.getElementById('modal-price');
    const modalDescription = document.getElementById('modal-description');
    const modalFeaturesList = document.getElementById('modal-features-list');
    const modalColorsList = document.getElementById('modal-colors-list');
    const modalQtyVal = document.getElementById('modal-qty-val');
    const modalDecQtyBtn = document.getElementById('modal-dec-qty');
    const modalIncQtyBtn = document.getElementById('modal-inc-qty');
    const modalAddToCartBtn = document.getElementById('modal-add-to-cart-btn');

    // Modal Active State
    let activeProduct = null;
    let activeColor = '';
    let activeQty = 1;

    // --------------------------------------------------------
    // 1. FETCH PRODUCTS FROM FIRESTORE
    // --------------------------------------------------------
    let allProducts = [];

    const getColorHex = (colorName) => {
        const map = {
            'czerwony': '#ff3366', 'niebieski': '#00f0ff', 'zielony': '#00ff88',
            'czarny': '#333333', 'biały': '#ffffff', 'szary': '#888888',
            'żółty': '#ffcc00', 'fioletowy': '#a200ff', 'różowy': '#ff66b2',
            'pomarańczowy': '#ff9900'
        };
        return map[colorName.trim().toLowerCase()] || '#ffffff'; // domyślnie biały
    };

    const fetchProducts = async () => {
        // Jeśli nie ma DB, używamy mocków z products-data.js
        if (!window.db) {
            if (typeof products !== 'undefined') {
                allProducts = products;
                updateCatalog();
            }
            return;
        }

        try {
            const snapshot = await window.db.collection('products').orderBy('createdAt', 'desc').get();
            if (snapshot.empty) {
                // Brak produktów w bazie – fallback lub po prostu pusta lista
                if (typeof products !== 'undefined') allProducts = products;
            } else {
                allProducts = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    allProducts.push({
                        id: doc.id,
                        name: data.name,
                        price: data.price,
                        description: data.description,
                        category: data.category || 'ADHD',
                        rating: data.rating || 5.0,
                        colors: (data.colors || ['Domyślny']).map(c => ({
                            name: c,
                            hex: getColorHex(c)
                        })),
                        features: ["Unikalny design", "Druk 3D", "Antystresowy"],
                        // Wykorzystujemy URL zdjęcia od Admina
                        svgMarkup: `<img src="${data.image}" alt="${data.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`
                    });
                });
            }
            updateCatalog();
        } catch (error) {
            console.error("Błąd pobierania produktów z Firestore:", error);
            if (typeof products !== 'undefined') {
                allProducts = products;
                updateCatalog();
            }
        }
    };

    // --------------------------------------------------------
    // 2. FILTERING & SORTING ENGINE
    // --------------------------------------------------------
    const getActiveFilters = () => {
        const categories = [];
        categoryFilters.forEach(cb => {
            if (cb.checked) categories.push(cb.value);
        });

        return {
            query: searchInput.value.toLowerCase().trim(),
            categories: categories,
            sortBy: sortSelect.value
        };
    };

    const updateCatalog = () => {
        const filters = getActiveFilters();
        
        // Filter products
        let filtered = allProducts.filter(product => {
            // Match category
            const matchCategory = filters.categories.length === 0 || filters.categories.includes(product.category);
            
            // Match search query (search in title, description, features)
            const matchSearch = product.name.toLowerCase().includes(filters.query) || 
                                product.description.toLowerCase().includes(filters.query) ||
                                product.category.toLowerCase().includes(filters.query) ||
                                (product.features && product.features.some(f => f.toLowerCase().includes(filters.query)));
            
            return matchCategory && matchSearch;
        });

        // Sort products
        if (filters.sortBy === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (filters.sortBy === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (filters.sortBy === 'rating') {
            filtered.sort((a, b) => b.rating - a.rating);
        }

        // Update results text
        resultsCount.textContent = `Znaleziono ${filtered.length} ${filtered.length === 1 ? 'produkt' : (filtered.length > 1 && filtered.length < 5 ? 'produkty' : 'produktów')}`;

        renderProducts(filtered);
    };

    // --------------------------------------------------------
    // 2. RENDER CATALOG CARDS
    // --------------------------------------------------------
    const renderProducts = (list) => {
        if (list.length === 0) {
            catalogGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 0; color: var(--text-muted);">
                    <h3>Brak wyników</h3>
                    <p style="margin-top: 10px;">Spróbuj dostosować filtry lub wyczyścić pole wyszukiwania.</p>
                </div>
            `;
            return;
        }

        catalogGrid.innerHTML = list.map(p => {
            const defaultColor = p.colors[0];
            return `
                <div class="product-card glass-panel animate-fade-in-up" data-id="${p.id}">
                    <div class="product-img-wrapper" style="color: ${defaultColor.hex};">
                        ${p.svgMarkup}
                    </div>
                    <div class="product-info">
                        <span class="product-category">${p.category}</span>
                        <h3>${p.name}</h3>
                        <p class="product-description">${p.description}</p>
                        
                        <div class="product-rating">
                            <span class="stars">★★★★★</span>
                            <span class="rating-val">${p.rating}</span>
                        </div>
                        
                        <div class="catalog-colors">
                            ${p.colors.map((c, i) => `
                                <span class="catalog-color-dot ${i === 0 ? 'active' : ''}" 
                                      style="background-color: ${c.hex}; color: ${c.hex};" 
                                      title="${c.name}"
                                      data-color-name="${c.name}"></span>
                            `).join('')}
                        </div>

                        <div class="product-footer">
                            <div class="product-price">
                                ${p.price.toFixed(2)} <span>zł</span>
                            </div>
                            <button class="btn btn-outline btn-sm quick-add-btn" data-id="${p.id}">
                                Dodaj +
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    // --------------------------------------------------------
    // 3. EVENT DELEGATION IN CATALOG GRID
    // --------------------------------------------------------
    catalogGrid.addEventListener('click', (e) => {
        const target = e.target;
        
        // A. Clicked color dot
        const colorDot = target.closest('.catalog-color-dot');
        if (colorDot) {
            e.stopPropagation();
            const dots = colorDot.parentElement.querySelectorAll('.catalog-color-dot');
            dots.forEach(d => d.classList.remove('active'));
            colorDot.classList.add('active');
            
            // Dynamically color preview SVG
            const card = colorDot.closest('.product-card');
            const wrapper = card.querySelector('.product-img-wrapper');
            wrapper.style.color = colorDot.style.backgroundColor;
            return;
        }

        // B. Clicked quick-add button
        const quickAddBtn = target.closest('.quick-add-btn');
        if (quickAddBtn) {
            e.stopPropagation();
            const id = quickAddBtn.dataset.id;
            const product = allProducts.find(p => p.id === id);
            
            // Find currently active color on card
            const card = quickAddBtn.closest('.product-card');
            const activeDot = card.querySelector('.catalog-color-dot.active');
            const colorName = activeDot ? activeDot.dataset.colorName : product.colors[0].name;

            if (product) {
                window.cartState.addItem(product, colorName);
            }
            return;
        }

        // C. Clicked product card (anywhere else) -> Open Modal
        const card = target.closest('.product-card');
        if (card) {
            const id = card.dataset.id;
            const product = allProducts.find(p => p.id === id);
            if (product) {
                // Find currently active color to pass to modal
                const activeDot = card.querySelector('.catalog-color-dot.active');
                const activeColorName = activeDot ? activeDot.dataset.colorName : product.colors[0].name;
                openProductModal(product, activeColorName);
            }
        }
    });

    // --------------------------------------------------------
    // 4. PRODUCT MODAL MANAGER
    // --------------------------------------------------------
    const openProductModal = (product, defaultColorName) => {
        activeProduct = product;
        activeColor = defaultColorName;
        activeQty = 1;

        // Set text properties
        modalCategory.textContent = product.category;
        modalTitle.textContent = product.name;
        modalRatingVal.textContent = product.rating;
        modalPrice.innerHTML = `${product.price.toFixed(2)} <span>zł</span>`;
        modalDescription.textContent = product.description;

        // Render dynamic features
        modalFeaturesList.innerHTML = product.features.map(f => `
            <div class="modal-feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>${f}</span>
            </div>
        `).join('');

        // Render dynamic color pills
        modalColorsList.innerHTML = product.colors.map(c => `
            <div class="modal-color-pill ${c.name === activeColor ? 'active' : ''}" 
                 data-color-name="${c.name}"
                 data-hex="${c.hex}">
                <span class="color-dot-small" style="background-color: ${c.hex};"></span>
                ${c.name}
            </div>
        `).join('');

        // Populate and color product image (SVG)
        const selectedColorObj = product.colors.find(c => c.name === activeColor) || product.colors[0];
        modalImgContainer.innerHTML = product.svgMarkup;
        modalImgContainer.style.color = selectedColorObj.hex;

        // Set Quantity display
        modalQtyVal.textContent = activeQty;

        // Show modal
        modal.classList.add('active');
    };

    const closeProductModal = () => {
        modal.classList.remove('active');
        activeProduct = null;
    };

    // Close buttons
    closeModalBtn.addEventListener('click', closeProductModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProductModal();
    });

    // Modal color pills clicks
    modalColorsList.addEventListener('click', (e) => {
        const pill = e.target.closest('.modal-color-pill');
        if (pill) {
            modalColorsList.querySelectorAll('.modal-color-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeColor = pill.dataset.colorName;
            
            // Adjust SVG color preview
            const hex = pill.dataset.hex;
            modalImgContainer.style.color = hex;
        }
    });

    // Quantity selectors
    modalIncQtyBtn.addEventListener('click', () => {
        activeQty += 1;
        modalQtyVal.textContent = activeQty;
    });

    modalDecQtyBtn.addEventListener('click', () => {
        if (activeQty > 1) {
            activeQty -= 1;
            modalQtyVal.textContent = activeQty;
        }
    });

    // Add to cart in modal
    modalAddToCartBtn.addEventListener('click', () => {
        if (activeProduct) {
            window.cartState.addItem(activeProduct, activeColor, activeQty);
            closeProductModal();
        }
    });

    // --------------------------------------------------------
    // 5. ATTACH FILTERS & SEARCH LISTENERS
    // --------------------------------------------------------
    searchInput.addEventListener('input', updateCatalog);
    sortSelect.addEventListener('change', updateCatalog);
    categoryFilters.forEach(cb => {
        cb.addEventListener('change', updateCatalog);
    });

    // Initial render / fetch
    fetchProducts();
});
