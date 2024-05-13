const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const mongoose = require("mongoose");
const Models = require("./models.js");

const app = express();

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect("mongodb://localhost:27017/mySciFiApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(bodyParser.json());

// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {
  flags: "a",
});
//setup the logger
app.use(morgan("combined", { stream: accessLogStream }));

app.get("/", (req, res) => {
  res.send("Welcome to my Sci-Fi page!");
});

//return all movies vom the db as json file
app.get("/movies", (req, res) => {
  Movies.find().then((movies) => {
    res.status(200).json(movies);
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Error: " + error);
  });
});

//return a single movie in a JSON file
app.get("/movies/:title", (req, res) => {
  reqTitle = req.params.title
  Movies.findOne({"title": reqTitle}).then((movie) =>{
    if(movie){
      console.log(movie)
      res.status(200).json(movie)
    }else{
      res.status(404).send("404: Movie could not be found");
    }
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Error: " + error);
  })
});

//return genre of a movie
app.get("/movies/genre/:title", (req, res) => {
  reqTitle = req.params.title
  Movies.findOne({"title": reqTitle}).then((movie) => {
    console.log(movie)
    if(movie){
    genre = movie.genre
    res.status(200).json(genre)
  } else {
    res.status(404).send("404: Movie could not be found.")
  }
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Error: " + error);
  })
});

//return data about director
app.get("/movies/director/:title", (req, res) => {
  reqTitle = req.params.title
  Movies.findOne({"title": reqTitle}).then((movie) => {
    if (movie){
    director = movie.director
    res.status(200).json(director)
  } else {
    res.status(404).send("404: Movie could not be found.")
  }
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Error: " + error);
  })
});

//register new user in db
app.post("/user/register/", async (req, res) => {
  await Users.findOne({ Username: req.body.Username }).then((user) => {
    if (user) {
      return res
        .status(400)
        .send("User " + req.body.Username + " already exists.");
    } else {
      Users.create({
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday,
      }).then((user) => {
        res.status(201).json(user);
      }).catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
    }
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Error: " + error);
  });
});

//OLD register new user
app.post("/user/registerold/", (req, res) => {
  const newUser = req.body.name;
  const email = req.body.email;

  if (newUser) {
    usersRepository.addUser(newUser, email);
    console.log(usersRepository.getAll());
    res.send("New user " + newUser + " has been registered.");
  } else {
    res.status(400).send("400: Format of new user cannot be accepted.");
  }
});

//update username
app.put("/user/:userName", (req, res) => {
  const userNameToUpdate = req.body.name;

  const userNameChanged = usersRepository.changeUserName(
    req.params.userName,
    userNameToUpdate
  );
  if (userNameChanged) {
    console.log(usersRepository.getAll());
    res.send(
      "User " + req.params.userName + " has been changed to " + userNameToUpdate
    );
  } else {
    res.status(400).send("400: Format of new user name cannot be accepted.");
  }
});

//deregister user
app.delete("/user/delete", (req, res) => {
  const userToDelete = req.body.name;
  const userDeleted = usersRepository.deleteUser(userToDelete);
  if (userDeleted) {
    res.send("User's " + userToDelete + " email address has been deleted.");
  } else {
    res.status(400).send("400: Format of user cannot be accepted.");
  }
});

//add favorite movie
app.post("/user/:name/:favoritemovie", (req, res) => {
  const user = req.params.name;
  const movieToAdd = req.params.favoritemovie;
  const favoriteMovieAdded = usersRepository.addFavoriteMovie(user, movieToAdd);
  if (favoriteMovieAdded) {
    res.send(
      "Movie " + movieToAdd + " added to favorite movies list of user " + user
    );
  } else {
    res.status(500).send("500: User or movie not registered.");
  }
});

//delete favorite movie
app.delete("/user/:name/:favoritemovie", (req, res) => {
  const user = req.params.name;
  const movieToDelete = req.params.favoritemovie;
  const favoriteMovieDeleted = usersRepository.removeFavoriteMovie(
    user,
    movieToDelete
  );
  if (favoriteMovieDeleted) {
    res.send(
      "Movie " +
        movieToDelete +
        " deleted from favorite movies list of user " +
        user
    );
  } else {
    res.status(500).send("500: User or movie not registered.");
  }
});

app.use(express.static("public"));

//error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(8080, () => {
  console.log("App is up and running on port 8080");
});
