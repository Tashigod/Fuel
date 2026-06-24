const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const Paystack = require('paystack-api')('sk_test_7f6d4f94450da82e8f03fe1e473f17b5f2e3d25a');  // Replace with your real key

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Tolu@12345',  // Replace with your real MySQL root password
    database: 'oil_orders'
};
let db;

(async () => {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL');
    } catch (error) {
        console.error('MySQL connection error:', error);
    }
})();

// Endpoint to initialize Paystack payment
app.post('/initialize-payment', async (req, res) => {
    const { amount, email } = req.body;
    try {
        const response = await Paystack.transaction.initialize({
            amount: amount * 100,  // Amount in kobo (for NGN)
            email: email,
            callback_url: 'http://localhost:3000/payment-success'
        });
        res.json({ authorization_url: response.data.authorization_url, reference: response.data.reference });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Handle Paystack payment success callback
app.get('/payment-success', async (req, res) => {
    const { reference } = req.query;
    console.log('Reference received:', reference);
    if (reference) {
        try {
            console.log('Verifying payment...');
            const response = await Paystack.transaction.verify({ reference });
            console.log('Verification response:', response.data);
            if (response.data.status === 'success') {
                // Use stored order data
                if (tempOrder) {
                    const { cart, total, address } = tempOrder;
                    const [result] = await db.execute(
                        'INSERT INTO orders (items, total, address) VALUES (?, ?, ?)',
                        [JSON.stringify(cart), total, JSON.stringify(address)]
                    );
                    tempOrder = null;  // Clear temp data
                    res.send('Payment successful! Order placed.');
                } else {
                    res.send('No order data found.');
                }
            } else {
                res.send('Payment failed: ' + response.data.gateway_response);
            }
        } catch (error) {
            console.error('Verification error:', error.message);
            res.send('Error verifying payment: ' + error.message);
        }
    } else {
        res.send('No reference provided.');
    }
});



// API Endpoint to Submit Order
app.post('/api/orders', async (req, res) => {
    try {
        const { items, total, address } = req.body;
        const [result] = await db.execute(
            'INSERT INTO orders (items, total, address) VALUES (?, ?, ?)',
            [JSON.stringify(items), total, JSON.stringify(address)]
        );
        res.status(201).json({ message: 'Order placed successfully!', orderId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to place order' });
    }
});
// Temporary storage for order data (in production, use a database or session)
let tempOrder = null;

// Endpoint to store order data
app.post('/store-order', async (req, res) => {
    const { cart, total, address } = req.body;
    tempOrder = { cart, total, address };
    res.status(200).json({ message: 'Order stored', orderId: Date.now() });  // Simple ID
});

// Optional: Endpoint to Fetch Orders
app.get('/api/orders', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM orders');
        res.json(rows.map(row => ({ ...row, items: JSON.parse(row.items), address: JSON.parse(row.address) })));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});