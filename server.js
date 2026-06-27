const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const Paystack = require('paystack-api')(process.env.PAYSTACK_SECRET);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('🚀 Fuel backend is running successfully');
});

/* =========================
   MYSQL CONFIG (FIXED)
========================= */
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    ssl: {
        rejectUnauthorized: false
    },
    connectTimeout: 20000
};

let db;

/* =========================
   DB CONNECTION (RETRY SAFE)
========================= */
async function connectDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL');
    } catch (error) {
        console.error('❌ MySQL connection error:', error.message);
        console.log('🔄 Retrying DB connection in 5s...');
        setTimeout(connectDB, 5000);
    }
}
connectDB();

/* =========================
   PAYSTACK INIT PAYMENT
========================= */
app.post('/initialize-payment', async (req, res) => {
    const { amount, email } = req.body;

    try {
        const response = await Paystack.transaction.initialize({
            amount: amount * 100,
            email: email,
            callback_url: 'https://fuel-xxa4.onrender.com/payment-success'
        });

        res.json({
            authorization_url: response.data.authorization_url,
            reference: response.data.reference
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   STORE ORDER SAFELY (DB)
========================= */
app.post('/store-order', async (req, res) => {
    try {
        const { cart, total, address } = req.body;

        const [result] = await db.execute(
            'INSERT INTO orders (items, total, address) VALUES (?, ?, ?)',
            [JSON.stringify(cart), total, JSON.stringify(address)]
        );

        res.status(200).json({
            message: 'Order stored',
            orderId: result.insertId
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to store order' });
    }
});

/* =========================
   PAYSTACK SUCCESS CALLBACK
========================= */
app.get('/payment-success', async (req, res) => {
    const { reference } = req.query;

    if (!reference) {
        return res.send('No reference provided.');
    }

    try {
        const response = await Paystack.transaction.verify({ reference });

        if (response.data.status === 'success') {
            res.send('✅ Payment successful!');
        } else {
            res.send('❌ Payment failed: ' + response.data.gateway_response);
        }

    } catch (error) {
        console.error('Verification error:', error.message);
        res.send('Error verifying payment: ' + error.message);
    }
});

/* =========================
   GET ALL ORDERS
========================= */
app.get('/api/orders', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM orders');

        res.json(
            rows.map(row => ({
                ...row,
                items: JSON.parse(row.items),
                address: JSON.parse(row.address)
            }))
        );

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
