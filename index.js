require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');
const app = express();

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false })); // Crucial for parsing POST data
app.use('/public', express.static(`${process.cwd()}/public`));

// Simple in-memory storage
let urlDatabase = [];
let idCounter = 1;

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// 1. POST Endpoint: Validates and saves the URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  const parsedUrl = urlParser.parse(originalUrl);

  // Validation: Check for http/https protocol
  if (!parsedUrl.protocol || !/^https?:/.test(parsedUrl.protocol)) {
    return res.json({ error: 'invalid url' });
  }

  // Verify hostname exists via DNS
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if it already exists, otherwise add it
    let entry = urlDatabase.find(item => item.original_url === originalUrl);
    if (!entry) {
      entry = { original_url: originalUrl, short_url: idCounter++ };
      urlDatabase.push(entry);
    }
    
    res.json({ 
      original_url: entry.original_url, 
      short_url: entry.short_url 
    });
  });
});

// 2. GET Endpoint: Redirects based on the short_url ID
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrlParam = req.params.short_url;
  
  // Find the entry. We use parseInt because params are strings, 
  // but our idCounter stored them as numbers.
  const entry = urlDatabase.find(item => item.short_url === parseInt(shortUrlParam));

  if (entry) {
    // This is where Test #3 passes
    return res.redirect(entry.original_url);
  } else {
    return res.json({ error: "No short URL found for the given id" });
  }
});

module.exports = app;