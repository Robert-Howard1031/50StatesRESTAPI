require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConnection');
const corsOptions = require('./config/corsOptions');


const PORT = process.env.PORT || 3001;


connectDB();


app.use(cors(corsOptions));


app.use(express.json());

app.use(express.static(path.join(__dirname, '/public')));


app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  });

app.use('/states', require('./routes/statesRoutes'));
app.use('/', require('./routes/rootRoutes'));


app.all('*', (req, res) => {
    
    console.log("Not found from server.js file.");
    res.status(404)
    if (req.accepts('text/html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    } else if (req.accepts('application/json')) {
        res.json({ "error": "404 Not Found"});
    } else {
        res.type('txt').send('404 Not Found');
    }
});


mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});