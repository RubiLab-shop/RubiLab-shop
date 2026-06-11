// RubiLab — app.js | Global Application Controller & Particle Engine

document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------
    // 1. BACKGROUND PARTICLES ENGINE (CANVAS)
    // --------------------------------------------------------
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const maxParticles = 60;
        const connectionDistance = 110;
        let mouse = { x: null, y: null, radius: 120 };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.6;
                this.vy = (Math.random() - 0.5) * 0.6;
                this.radius = Math.random() * 2.5 + 1;
                // Alternate particle colors between ruby neon and cyber turquoise
                this.color = Math.random() > 0.5 ? '#ff0055' : '#00f0ff';
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.shadowBlur = 0; // reset
            }

            update() {
                // Bounce on boundaries
                if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
                if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

                // Mouse interaction (push away)
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = this.x - mouse.x;
                    const dy = this.y - mouse.y;
                    const distance = Math.hypot(dx, dy);

                    if (distance < mouse.radius) {
                        const force = (mouse.radius - distance) / mouse.radius;
                        const angle = Math.atan2(dy, dx);
                        this.x += Math.cos(angle) * force * 2;
                        this.y += Math.sin(angle) * force * 2;
                    }
                }

                this.x += this.vx;
                this.y += this.vy;
            }
        }

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < maxParticles; i++) {
                particles.push(new Particle());
            }
        };

        const drawConnections = () => {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < connectionDistance) {
                        const opacity = (connectionDistance - dist) / connectionDistance * 0.12;
                        // Gradient connection line between nodes
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw floating glowing spheres behind to help aesthetic
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            
            drawConnections();
            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        window.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        });

        resizeCanvas();
        animate();
    }

    // --------------------------------------------------------
    // 2. HEADER SCROLL & MOBILE NAVIGATION
    // --------------------------------------------------------
    const header = document.getElementById('main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                header.style.background = 'rgba(3, 3, 4, 0.9)';
                header.style.padding = '5px 0';
                header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
            } else {
                header.style.background = 'rgba(7, 7, 10, 0.75)';
                header.style.padding = '0';
                header.style.boxShadow = 'none';
            }
        });
    }

    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navbar = document.getElementById('navbar');
    if (mobileBtn && navbar) {
        mobileBtn.addEventListener('click', () => {
            navbar.classList.toggle('mobile-active');
            // Change button text or icon
            if (navbar.classList.contains('mobile-active')) {
                mobileBtn.innerHTML = '✕';
            } else {
                mobileBtn.innerHTML = '☰';
            }
        });

        // Close navbar when nav link is clicked
        navbar.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navbar.classList.remove('mobile-active');
                mobileBtn.innerHTML = '☰';
            });
        });
    }

    // --------------------------------------------------------
    // 3. TOAST SYSTEM
    // --------------------------------------------------------
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'app-toast';
    document.body.appendChild(toast);

    window.showToast = (message, type = 'success') => {
        const icon = type === 'success' 
            ? '<span class="toast-icon success">✓</span>' 
            : '<span class="toast-icon info">ℹ</span>';
        
        toast.innerHTML = `${icon} <span>${message}</span>`;
        toast.style.borderColor = type === 'success' ? 'var(--success)' : 'var(--primary)';
        toast.style.boxShadow = type === 'success' 
            ? '0 10px 30px rgba(0, 255, 136, 0.15), 0 0 15px rgba(0, 255, 136, 0.25)' 
            : '0 10px 30px rgba(255, 0, 85, 0.2), 0 0 15px var(--primary-glow)';

        toast.classList.add('active');

        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    };

    // --------------------------------------------------------
    // 4. KOSZYK SHOPPING CART SYSTEM
    // --------------------------------------------------------
    window.cartState = {
        items: JSON.parse(localStorage.getItem('rubilab_cart')) || [],
        
        save() {
            localStorage.setItem('rubilab_cart', JSON.stringify(this.items));
            this.updateCounter();
            this.render();
        },

        addItem(product, color, qty = 1) {
            const existingItem = this.items.find(item => item.id === product.id && item.color === color);
            if (existingItem) {
                existingItem.quantity += qty;
            } else {
                this.items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    color: color,
                    quantity: qty,
                    svgMarkup: product.svgMarkup
                });
            }
            this.save();
            window.showToast(`Dodano ${qty}x "${product.name}" (${color}) do koszyka!`);
        },

        removeItem(productId, color) {
            const index = this.items.findIndex(item => item.id === productId && item.color === color);
            if (index !== -1) {
                const name = this.items[index].name;
                this.items.splice(index, 1);
                this.save();
                window.showToast(`Usunięto "${name}" z koszyka.`, 'info');
            }
        },

        updateQty(productId, color, change) {
            const item = this.items.find(item => item.id === productId && item.color === color);
            if (item) {
                item.quantity += change;
                if (item.quantity <= 0) {
                    this.removeItem(productId, color);
                } else {
                    this.save();
                }
            }
        },

        getCartCount() {
            return this.items.reduce((total, item) => total + item.quantity, 0);
        },

        getCartTotal() {
            return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        },

        updateCounter() {
            const cartCountElement = document.getElementById('cart-count');
            if (cartCountElement) {
                const count = this.getCartCount();
                cartCountElement.textContent = count;
                if (count === 0) {
                    cartCountElement.classList.add('hidden');
                } else {
                    cartCountElement.classList.remove('hidden');
                }
            }
        },

        render() {
            const container = document.getElementById('cart-items-container');
            const totalElement = document.getElementById('cart-total-price');
            const subtotalElement = document.getElementById('cart-subtotal-price');
            
            if (!container) return;

            if (this.items.length === 0) {
                container.innerHTML = `<div class="cart-empty-message">Twój koszyk jest pusty.<br>Dodaj jakieś antystresowe zabawki!</div>`;
                if (totalElement) totalElement.textContent = '0.00 zł';
                if (subtotalElement) subtotalElement.textContent = '0.00 zł';
                return;
            }

            container.innerHTML = this.items.map(item => `
                <div class="cart-item">
                    <div class="cart-item-img-wrapper" style="color: var(--secondary);">
                        ${item.svgMarkup}
                    </div>
                    <div class="cart-item-info">
                        <h5>${item.name}</h5>
                        <div class="cart-item-spec">
                            Kolor: ${item.color}
                        </div>
                        <div class="cart-item-qty-controls">
                            <button class="qty-btn dec-qty" data-id="${item.id}" data-color="${item.color}">-</button>
                            <span class="cart-item-qty-val">${item.quantity}</span>
                            <button class="qty-btn inc-qty" data-id="${item.id}" data-color="${item.color}">+</button>
                        </div>
                    </div>
                    <div class="cart-item-right">
                        <span class="cart-item-price">${(item.price * item.quantity).toFixed(2)} zł</span>
                        <button class="cart-item-remove" data-id="${item.id}" data-color="${item.color}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');

            const total = this.getCartTotal();
            if (subtotalElement) subtotalElement.textContent = `${total.toFixed(2)} zł`;
            if (totalElement) totalElement.textContent = `${total.toFixed(2)} zł`;
        }
    };

    // --------------------------------------------------------
    // 5. DRAWER CART CONTROLS
    // --------------------------------------------------------
    const cartBtn = document.getElementById('cart-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const closeCartBtn = document.getElementById('close-cart');

    if (cartBtn && cartDrawer) {
        cartBtn.addEventListener('click', () => {
            cartDrawer.classList.add('active');
        });
    }

    if (closeCartBtn && cartDrawer) {
        closeCartBtn.addEventListener('click', () => {
            cartDrawer.classList.remove('active');
        });
        
        // Close on clicking overlay
        cartDrawer.addEventListener('click', (e) => {
            if (e.target === cartDrawer) {
                cartDrawer.classList.remove('active');
            }
        });
    }

    // Event delegation inside cart drawer
    const cartItemsContainer = document.getElementById('cart-items-container');
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            // Find target buttons
            const incBtn = e.target.closest('.inc-qty');
            const decBtn = e.target.closest('.dec-qty');
            const removeBtn = e.target.closest('.cart-item-remove');

            if (incBtn) {
                const id = incBtn.dataset.id;
                const color = incBtn.dataset.color;
                window.cartState.updateQty(id, color, 1);
            } else if (decBtn) {
                const id = decBtn.dataset.id;
                const color = decBtn.dataset.color;
                window.cartState.updateQty(id, color, -1);
            } else if (removeBtn) {
                const id = removeBtn.dataset.id;
                const color = removeBtn.dataset.color;
                window.cartState.removeItem(id, color);
            }
        });
    }

    // Checkout Button Hook
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            if (window.cartState.items.length === 0) {
                window.showToast("Twój koszyk jest pusty!", "info");
                return;
            }

            checkoutBtn.disabled = true;
            checkoutBtn.textContent = "Ładowanie...";

            // CROSS-SELL LOGIC
            let crossProduct = null;
            try {
                if (window.db) {
                    const snapshot = await window.db.collection('products').limit(5).get();
                    if (!snapshot.empty) {
                        const dbProds = [];
                        snapshot.forEach(doc => {
                            dbProds.push({ id: doc.id, ...doc.data() });
                        });
                        // Wybierz produkt którego nie ma w koszyku
                        const inCartIds = window.cartState.items.map(i => i.id);
                        const available = dbProds.filter(p => !inCartIds.includes(p.id));
                        if (available.length > 0) {
                            // Wylosuj jeden
                            crossProduct = available[Math.floor(Math.random() * available.length)];
                        }
                    }
                }
            } catch(e) {
                console.error("Cross-sell error", e);
            }

            if (!crossProduct) {
                // Brak ofert dosprzedaży
                window.location.href = 'checkout.html';
                return;
            }

            // Pokaż Popup Cross-Sell (Styl fiflak848.pl)
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
                z-index: 999999; display: flex; align-items: center; justify-content: center;
                opacity: 0; transition: opacity 0.3s ease; padding: 20px;
            `;
            
            modal.innerHTML = `
                <div class="glass-panel" style="max-width: 480px; width: 100%; padding: 40px; text-align: center; position: relative; transform: translateY(30px); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); background: rgba(10,10,15,0.95); border: 2px solid var(--primary);">
                    <button id="cs-close" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: var(--text-muted); font-size: 28px; cursor: pointer; transition: color 0.2s;">&times;</button>
                    
                    <div style="font-size: 40px; margin-bottom: 10px;">🎁</div>
                    <h2 style="color: var(--primary); margin-bottom: 10px; font-size: 1.8rem;">Zanim przejdziesz dalej...</h2>
                    <p style="margin-bottom: 25px; color: var(--text-muted);">Może dobierzesz do zestawu nasz absolutny hit?</p>
                    
                    <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.05);">
                        <img src="${crossProduct.image}" style="width: 180px; height: 180px; object-fit: cover; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 10px 20px rgba(0,0,0,0.5);">
                        <h3 style="margin-bottom: 8px; font-size: 1.4rem;">${crossProduct.name}</h3>
                        <p style="color: var(--primary); font-size: 1.5rem; font-weight: bold; margin-bottom: 5px;">${parseFloat(crossProduct.price).toFixed(2)} zł</p>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button id="cs-add" class="btn btn-primary btn-lg" style="width: 100%; font-weight: bold; box-shadow: 0 0 20px var(--primary-glow);">
                            Dodaj do zamówienia
                        </button>
                        <button id="cs-skip" class="btn btn-outline" style="width: 100%; border: none;">
                            Nie, przejdź do kasy
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Animate in
            requestAnimationFrame(() => {
                modal.style.opacity = '1';
                modal.querySelector('.glass-panel').style.transform = 'translateY(0)';
            });

            const closeAndGo = () => {
                modal.style.opacity = '0';
                modal.querySelector('.glass-panel').style.transform = 'translateY(20px)';
                setTimeout(() => {
                    modal.remove();
                    window.location.href = 'checkout.html';
                }, 300);
            };

            modal.querySelector('#cs-close').addEventListener('click', closeAndGo);
            modal.querySelector('#cs-skip').addEventListener('click', closeAndGo);
            
            modal.querySelector('#cs-add').addEventListener('click', () => {
                const addBtn = modal.querySelector('#cs-add');
                addBtn.textContent = "Dodano!";
                addBtn.style.background = "var(--success)";
                addBtn.style.color = "#000";
                
                // add to cart
                window.cartState.addItem({
                    id: crossProduct.id,
                    name: crossProduct.name,
                    price: parseFloat(crossProduct.price),
                    svgMarkup: `<img src="${crossProduct.image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`
                }, (crossProduct.colors && crossProduct.colors[0]) ? crossProduct.colors[0] : 'Domyślny');
                
                setTimeout(() => {
                    closeAndGo();
                }, 600);
            });

            checkoutBtn.disabled = false;
            checkoutBtn.textContent = "Przejdź do kasy";
        });
    }

    // Initialize Global Cart view
    window.cartState.updateCounter();
    window.cartState.render();
});
