const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const userRoutes = require('./routes/userRoutes'); // 👈 Important

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes); // 👈 Mount the route

app.get('/', (req, res) => res.send('API working'));

module.exports = app;
