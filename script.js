// script.js
document.addEventListener('DOMContentLoaded', () => {
    const cartItems = document.getElementById('cart-items');
    const totalSpan = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkout');
    const addressForm = document.getElementById('address-form');
    let cart = [];
    let total = 0;

    console.log('Script loaded');

    // Add to cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    console.log('Found add-to-cart buttons:', addToCartButtons.length);

    addToCartButtons.forEach((button, index) => {
        console.log(`Attaching listener to button ${index}`);
        button.addEventListener('click', (e) => {
            console.log('Add to cart clicked for button', index);
            const productDiv = e.target.closest('.product');
            if (!productDiv) {
                console.error('Product div not found');
                return;
            }
            const name = productDiv.dataset.name;
            const price = parseFloat(productDiv.dataset.price);
            const quantity = parseInt(productDiv.querySelector('.quantity').value);

            console.log('Product data:', { name, price, quantity });

            const existingItem = cart.find(item => item.name === name);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({ name, price, quantity });
            }

            updateCart();
        });
    });

    // Update cart display
    function updateCart() {
        console.log('Updating cart with items:', cart);
        cartItems.innerHTML = '';
        total = 0;
        cart.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`;
            cartItems.appendChild(li);
            total += item.price * item.quantity;
        });
        totalSpan.textContent = total.toFixed(2);

        if (cart.length > 0) {
            addressForm.style.display = 'block';
        } else {
            addressForm.style.display = 'none';
        }
    }

    // Checkout functionality
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

    console.log('Address values:', { street, city, state, phone, email });

    if (!street || !city || !state || !phone || !email) {
        alert('Please fill in all fields.');
        return;
    }

    // Send order data to server for storage
    try {
        const orderResponse = await fetch('http://localhost:3000/store-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart, total, address: { street, city, state, phone, email } })
        });
        const orderData = await orderResponse.json();
        console.log('Order stored with ID:', orderData.orderId);

        // Now initialize Paystack payment
        const response = await fetch('http://localhost:3000/initialize-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: total, email: email })
        });
        const { authorization_url } = await response.json();

        // Redirect to Paystack
        window.location.href = authorization_url;
    } catch (error) {
        console.error('Error:', error);
        alert('Network error.');
    }
});
});
