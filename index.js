const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

//list of registered users
let usersRepository =(function () {
  let userList = [];

  return {
    addUser: () => {console.log("called addUser function")},
    deleteUser: () => {console.log("called deleteUser function")},
    changeUserName: () => {console.log("called changeUserName function")}
  }

})()



app.use(bodyParser.json());

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

//return all movies in a JSON file
app.get('/movies', (req, res) => {
  fs.readFile('./data/movies.json', 'utf8', (err, data) => {
    res.send(data);
  });
});

//return a single movie in a JSON file
app.get('/movies/:title', (req, res) => {
  fs.readFile('./data/movies.json', 'utf-8', (err, data) => {
    const movies = JSON.parse(data);

    const reqData = movies.find((movie) => {
      return movie.title.toLowerCase() === req.params.title;
    });

    if (reqData) {
      res.json(reqData);
    } else {
      res.status(404).send('404: Movie could not be found.');
    }
  });
});

//return genre of a movie
app.get('/movies/genre/:title', (req, res) => {
  fs.readFile('./data/movies.json', 'utf-8', (err, data) => {
    const movies = JSON.parse(data);

    const reqMovie = movies.find((movie) => {
      return movie.title.toLowerCase() === req.params.title;
    });

    if (reqMovie) {
      const genre = reqMovie.genre
      res.json(genre);
    } else {
      res.status(404).send('404: Movie could not be found.');
    }
  });
});

//return data about director
app.get('/movies/director/:title', (req, res) => {
  fs.readFile('./data/movies.json', 'utf-8', (err, data) => {
    const movies = JSON.parse(data);

    const reqMovie = movies.find((movie) => {
      return movie.title.toLowerCase() === req.params.title;
    });

    if (reqMovie) {
      const genre = reqMovie.director
      res.json(genre);
    } else {
      res.status(404).send('404: Movie could not be found.');
    }
  });
});

//register new user
app.post('/user/register/', (req, res) => {
  const newUser = req.body;
  if (newUser){
    console.log("New user registered")
    res.send("New user " + newUser.name + " has been registered.")
  } else {
    res.status(500).send('500: Format of new user cannot be accepted.')
  }
})


app.use(express.static('public'));

//error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(8080, () => {
  console.log('App is up and running on port 8080');
});
