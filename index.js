const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const app = express();

// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});
//setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

app.get('/', (req, res) => {
  res.send('Welcome to my Sci-Fi page!');
});

app.get('/movies', (req, res) => {
  fs.readFile('./data/movies.json', 'utf8', (err, data) => {
    res.send(data);
  });
});

app.use(
  '/documentation',
  express.static('public', { index: 'documentation.html' })
);

//error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(8080, () => {
  console.log('App is up and running on port 8080');
});
