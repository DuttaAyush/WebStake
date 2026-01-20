const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const connectToDb = require('./db/db');
const adminRoutes = require('./routes/admin.routes');
const teamRoutes = require('./routes/team.routes');
const productRoutes = require('./routes/product.routes');

connectToDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Add routes
app.use('/api/teams', teamRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);


module.exports = app;