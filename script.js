document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener("offline", () => {

        alert("You're offline.\nYou can still browse products, but checkout is unavailable.");

    });

    window.addEventListener("online", () => {

        alert("You're back online!");

    });

    const cartItems = document.getElementById('cart-items');
    const totalSpan = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkout');
    const addressForm = document.getElementById('address-form');

    // Slide cart elements
    const cartButton = document.getElementById('cart-button');
    const cartPanel = document.getElementById('cart-panel');
    const closeCart = document.getElementById('close-cart');
    const overlay = document.getElementById('overlay');
    const cartCount = document.getElementById('cart-count');

    let cart = [];
    let total = 0;

    /* =========================
     OFFLINE ORDER STORAGE
    ========================= */

    function openDB() {

        return new Promise((resolve, reject) => {

            const request = indexedDB.open("FuelOrderDB", 1);

            request.onupgradeneeded = () => {

                const db = request.result;

                if (!db.objectStoreNames.contains("orders")) {

                    db.createObjectStore("orders", {
                        autoIncrement: true
                    });

                }

            };

            request.onsuccess = () => resolve(request.result);

            request.onerror = () => reject(request.error);

        });

    }

    async function saveOfflineOrder(order) {

        const db = await openDB();

        const tx = db.transaction("orders", "readwrite");

        tx.objectStore("orders").add(order);

    }

    const API_BASE = "https://fuel-xxa4.onrender.com";

    async function loadProducts() {

        try {

            const response = await fetch(`${API_BASE}/api/products`);
            const products = await response.json();

            products.forEach(product => {

                const card = document.querySelector(
                    `.product[data-id="${product.id}"]`
                );

                if (!card) return;

                // Update the price used by the cart
                card.dataset.price = product.price;

                // Update the text shown to the customer
                const priceText = card.querySelector("p");

                priceText.textContent =
                    `₦${Number(product.price).toLocaleString()} / ${product.unit}`;

            });

        } catch (error) {

            console.error("Failed to load products:", error);

        }

    }

    console.log("Script Loaded");

    // ===============================
    // Open / Close Cart
    // ===============================

    cartButton.addEventListener('click', () => {
        cartPanel.classList.add('open');
        overlay.classList.add('show');
    });

    closeCart.addEventListener('click', () => {
        cartPanel.classList.remove('open');
        overlay.classList.remove('show');
    });

    overlay.addEventListener('click', () => {
        cartPanel.classList.remove('open');
        overlay.classList.remove('show');
    });

    // ===============================
    // Add To Cart
    // ===============================

    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach(button => {

        button.addEventListener('click', (e) => {

            const productDiv = e.target.closest('.product');

            if (!productDiv) return;

            const name = productDiv.dataset.name;
            const price = parseFloat(productDiv.dataset.price);
            const quantity = parseInt(productDiv.querySelector('.quantity').value);

            const existingItem = cart.find(item => item.name === name);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    name,
                    price,
                    quantity
                });
            }

            updateCart();

            // Automatically open cart
            cartPanel.classList.add('open');
            overlay.classList.add('show');

        });

    });

    // ===============================
    // Update Cart
    // ===============================

    function updateCart() {

        cartItems.innerHTML = "";

        total = 0;

        cart.forEach((item, index) => {

            const subtotal = item.price * item.quantity;

            total += subtotal;

            const li = document.createElement("li");

            li.innerHTML = `

                <div class="cart-item">

                    <div class="cart-name">
                        ${item.name}
                    </div>

                    <div class="cart-controls">

                        <button class="decrease" data-index="${index}">
                            -
                        </button>

                        <span class="qty">
                            ${item.quantity}
                        </span>

                        <button class="increase" data-index="${index}">
                            +
                        </button>

                        <span class="subtotal">
                            ₦${subtotal.toLocaleString()}
                        </span>

                        <button class="remove-item" data-index="${index}">
                            ❌
                        </button>

                    </div>

                </div>

            `;

            cartItems.appendChild(li);

        });

        totalSpan.textContent = total.toLocaleString();

        addressForm.style.display =
            cart.length > 0 ? "flex" : "none";

        // Update badge
        cartCount.textContent =
            cart.reduce((sum, item) => sum + item.quantity, 0);

        // Increase
        document.querySelectorAll(".increase").forEach(btn => {

            btn.onclick = () => {

                cart[btn.dataset.index].quantity++;

                updateCart();

            };

        });

        // Decrease
        document.querySelectorAll(".decrease").forEach(btn => {

            btn.onclick = () => {

                const item = cart[btn.dataset.index];

                if (item.quantity > 1) {

                    item.quantity--;

                } else {

                    cart.splice(btn.dataset.index, 1);

                }

                updateCart();

            };

        });

        // Remove
        document.querySelectorAll(".remove-item").forEach(btn => {

            btn.onclick = () => {

                cart.splice(btn.dataset.index, 1);

                updateCart();

            };

        });

    }

    // ===============================
    // Checkout
    // ===============================

    checkoutBtn.addEventListener('click', async () => {
        if (!navigator.onLine) {

            await saveOfflineOrder({

                cart,

                total,

                address: {
                    street,
                    city,
                    state,
                    phone,
                    email
                }

            });

            alert(
                "No internet.\n\nYour order has been saved and will be sent automatically when you're back online."
            );

            return;

        }

        if (cart.length === 0) {

            alert("Your cart is empty!");

            return;

        }

        const street = document.getElementById('street').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!street || !city || !state || !phone || !email) {

            alert("Please fill in all fields.");

            return;

        }

        try {

            const orderResponse = await fetch(`${API_BASE}/store-order`, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    cart,

                    total,

                    address: {

                        street,

                        city,

                        state,

                        phone,

                        email

                    }

                })

            });

            const orderData = await orderResponse.json();

            console.log(orderData);

            const paymentResponse = await fetch(`${API_BASE}/initialize-payment`, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    amount: total,

                    email

                })

            });

            const paymentData = await paymentResponse.json();

            if (paymentData.authorization_url) {

                cartPanel.classList.remove("open");
                overlay.classList.remove("show");

                window.location.href =
                    paymentData.authorization_url;

            } else {

                alert("Payment failed to initialize.");

            }

        }

        catch (error) {

            console.error(error);

            alert("Network error.");

        }

    });
    async function syncOfflineOrders() {

    if (!navigator.onLine) return;

    const db = await openDB();

    const tx = db.transaction("orders", "readwrite");

    const store = tx.objectStore("orders");

    const request = store.getAll();

    request.onsuccess = async () => {

        const orders = request.result;

        if (orders.length === 0) return;

        console.log("Syncing offline orders...");

        for (const order of orders) {

            try {

                await fetch(`${API_BASE}/store-order`, {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json"

                    },

                    body: JSON.stringify(order)

                });

            } catch {

                return;

            }

        }

        store.clear();

        console.log("Offline orders synced.");

    };

}

window.addEventListener("online", syncOfflineOrders);
    loadProducts();
    syncOfflineOrders();

});
if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker.register("sw.js")
        .then(() => {

            console.log("Service Worker Registered");

        })
        .catch(err => {

            console.log(err);

        });

    });

}
