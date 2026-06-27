const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const Paystack = require('paystack-api')(process.env.PAYSTACK_SECRET);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*'
}));
app.use(bodyParser.json());

/* =========================
   MYSQL CONFIG
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
   CONNECT DB (SAFE RETRY)
========================= */
async function connectDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL');
    } catch (err) {
        console.error('❌ DB connection failed:', err.message);
        console.log('🔄 Retrying in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
}
connectDB();

/* =========================
   HOME ROUTE
========================= */
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'Fuel backend running',
        endpoints: [
            '/store-order',
            '/initialize-payment',
            '/payment-success',
            '/api/orders'
        ]
    });
});

/* =========================
   STORE ORDER (FIXED)
   - saves directly to DB
   - NO temp memory
========================= */
app.post('/store-order', async (req, res) => {
    try {
        const { cart, total, address } = req.body;

        const [result] = await db.execute(
            'INSERT INTO orders (items, total, address, status) VALUES (?, ?, ?, ?)',
            [
                JSON.stringify(cart),
                total,
                JSON.stringify(address),
                'pending'
            ]
        );

        res.status(200).json({
            message: 'Order stored successfully',
            orderId: result.insertId
        });

    } catch (error) {
        console.error('Store order error:', error.message);
        res.status(500).json({ error: 'Failed to store order' });
    }
});

/* =========================
   INIT PAYSTACK PAYMENT
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
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   PAYMENT CALLBACK
   (NO tempOrder anymore)
========================= */
app.get('/payment-success', async (req, res) => {
    const { reference } = req.query;

    if (!reference) {
        return res.send('No reference provided');
    }

    try {
        const response = await Paystack.transaction.verify({ reference });

        if (response.data.status === 'success') {
            return res.send('✅ Payment successful! Order has been recorded.');
        } else {
            return res.send('❌ Payment failed');
        }

    } catch (error) {
        console.error('Verification error:', error.message);
        res.send('Error verifying payment');
    }
});

/* =========================
   GET ALL ORDERS
========================= */
app.get('/api/orders', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM orders ORDER BY id DESC');

        res.json(
            rows.map(row => ({
                ...row,
                items: JSON.parse(row.items),
                address: JSON.parse(row.address)
            }))
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
