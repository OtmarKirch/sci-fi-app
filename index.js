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
app.post("/users/register/", async (req, res) => {
  const newUser = req.body
  await Users.findOne({ username: newUser.username }).then((user) => {
    if (user) {
      return res
        .status(400)
        .send("User " + newUser.username + " already exists.");
    } else {
      Users.create({
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        Birthday: newUser.birthday,
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

//update username
app.put("/users/newusername", (req, res) => {
  const oldUsername = req.body.oldUserName
  const newUsername = req.body.newUserName;
  Users.findOneAndUpdate({username: oldUsername}, {
    $set:{username: newUsername}
  }, { new: true }).then((user) => {
    res.status(200).json(user)
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Error: " + error)
  })
});

//deregister user
app.delete("/users/delete", (req, res) => {
  const userToDelete = req.body.username
  Users.findOneAndDelete({username:userToDelete}, { new: true }).then((user) => {
    res.status(200).send("User " + user.username + " deleted.")
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Error: " + error);
  })
});

//add favorite movie
app.post("/users/favoritemovie/", (req, res) => {
  const reqUsername = req.body.username;
  const titleMovie = req.body.favoriteMovie;
  Movies.findOne({title:titleMovie}).then((movie)=>{
    if(movie){
      Users.findOneAndUpdate({username:reqUsername}, {$addToSet:{favoriteMovies: movie._id}}).then((user)=>{
      res.status(200).send(titleMovie + " was added to favorite movie list of " + reqUsername + ".")})
    }else{
      res.status(400).send("400: Movie not registered.")
    }
  }).catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      })
});

//delete favorite movie
app.delete("/users/favoritemovie/", (req, res) => {
  const reqUsername = req.body.username;
  const titleMovie = req.body.favoriteMovie;
  Movies.findOne({title:titleMovie}).then((movie)=>{
    if(movie){
      Users.findOneAndUpdate({username:reqUsername}, {$pull:{favoriteMovies: movie._id}}).then((user)=>{
      res.status(200).send(titleMovie + " was removed from favorite movie list of " + reqUsername + ".")})
    }else{
      res.status(400).send("400: Movie not registered.")
    }
  }).catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      })
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
