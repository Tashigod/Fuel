document.addEventListener('DOMContentLoaded', () => {
    const cartItems = document.getElementById('cart-items');
    const totalSpan = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkout');
    const addressForm = document.getElementById('address-form');

    let cart = [];
    let total = 0;

    const API_BASE = 'https://fuel-xxa4.onrender.com';

    console.log('Script loaded');

    // Add to cart
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach((button) => {
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
                cart.push({ name, price, quantity });
            }

            updateCart();
        });
    });

    // Update cart UI
    function updateCart() {
        cartItems.innerHTML = '';
        total = 0;

        cart.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} x${item.quantity} - ₦${(item.price * item.quantity).toFixed(2)}`;
            cartItems.appendChild(li);
            total += item.price * item.quantity;
        });

        totalSpan.textContent = total.toFixed(2);

        addressForm.style.display = cart.length > 0 ? 'block' : 'none';
    }

    // Checkout
    checkoutBtn.addEventListener('click', async () => {
        console.log('Checkout clicked');

        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const street = document.getElementById('street').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!street || !city || !state || !phone || !email) {
            alert('Please fill in all fields.');
            return;
        }

        try {
            // 1. Store order in backend
            const orderResponse = await fetch(`${API_BASE}/store-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cart,
                    total,
                    address: { street, city, state, phone, email }
                })
            });

            const orderData = await orderResponse.json();
            console.log('Order stored:', orderData);

            // 2. Initialize Paystack payment
            const paymentResponse = await fetch(`${API_BASE}/initialize-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: total,
                    email: email
                })
            });

            const paymentData = await paymentResponse.json();

            if (paymentData.authorization_url) {
                window.location.href = paymentData.authorization_url;
            } else {
                alert('Payment failed to initialize');
            }

        } catch (error) {
            console.error('Network error:', error);
            alert('Network error. Please try again.');
        }
    });
});
