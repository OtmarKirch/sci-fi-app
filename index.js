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
const Users = Models.Users;

mongoose.connect("mongodb://localhost:27017/mySciFiApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//list of registered users
let usersRepository = (function () {
  let userList = [];

  return {
    getAll: () => {
      return userList;
    },
    getUser: (userName) => {
      let userToGet;
      userList.forEach((user) => {
        if (user.userName === userName) {
          userToGet = user;
        }
      });
      return userToGet;
    },
    addUser: (userName, email) => {
      userList.push({
        userName: userName,
        id: uuid.v4(),
        email: email,
        favoriteMovies: [],
      });
    },
    deleteUser: (userName) => {
      let userDeleted = false;
      if (usersRepository.getUser(userName)) {
        userList.forEach((user) => {
          if (user.userName === userName) {
            user.email = "";
            userDeleted = true;
          }
        });
      }
      return userDeleted;
    },
    changeUserName: (oldUserName, newUserName) => {
      let userNameChanged = false;
      userList.forEach((item) => {
        if (item.userName === oldUserName) {
          item.userName = newUserName;
          userNameChanged = true;
        }
      });
      console.log("called changeUserName function");
      return userNameChanged;
    },
    addFavoriteMovie: (userName, movieTitle) => {
      let favoriteMovieAdded = false;
      const user = usersRepository.getUser(userName);
      console.log(user);
      if (user) {
        userList.forEach((user) => {
          if (user.userName === userName) {
            user.favoriteMovies.push(movieTitle);
            console.log(user);
            favoriteMovieAdded = true;
          }
        });
      }
      return favoriteMovieAdded;
    },
    removeFavoriteMovie: (userName, movieTitle) => {
      let favoriteMovieRemoved = false;
      const user = usersRepository.getUser(userName);
      console.log(user);
      if (user) {
        userList.forEach((user) => {
          if (user.userName === userName) {
            const indexMovie = user.favoriteMovies.indexOf(movieTitle);
            if (indexMovie != -1) {
              user.favoriteMovies.splice(indexMovie, 1);
              favoriteMovieRemoved = true;
            }
          }
        });
        return favoriteMovieRemoved;
      }
    },
  };
})();

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
    res.send(movies);
  });
});

//return all movies in a JSON file
app.get("/moviesOld", (req, res) => {
  fs.readFile("./data/movies.json", "utf8", (err, data) => {
    res.send(data);
  });
});

//return a single movie in a JSON file
app.get("/movies/:title", (req, res) => {
  fs.readFile("./data/movies.json", "utf-8", (err, data) => {
    const movies = JSON.parse(data);

    const reqData = movies.find((movie) => {
      return movie.title.toLowerCase() === req.params.title;
    });

    if (reqData) {
      res.json(reqData);
    } else {
      res.status(404).send("404: Movie could not be found.");
    }
  });
});

//return genre of a movie
app.get("/movies/genre/:title", (req, res) => {
  fs.readFile("./data/movies.json", "utf-8", (err, data) => {
    const movies = JSON.parse(data);

    const reqMovie = movies.find((movie) => {
      return movie.title.toLowerCase() === req.params.title;
    });

    if (reqMovie) {
      const genre = reqMovie.genre;
      res.json(genre);
    } else {
      res.status(404).send("404: Movie could not be found.");
    }
  });
});

//return data about director
app.get("/movies/director/:title", (req, res) => {
  fs.readFile("./data/movies.json", "utf-8", (err, data) => {
    const movies = JSON.parse(data);

    const reqMovie = movies.find((movie) => {
      return movie.title.toLowerCase() === req.params.title;
    });

    if (reqMovie) {
      const genre = reqMovie.director;
      res.json(genre);
    } else {
      res.status(404).send("404: Movie could not be found.");
    }
  });
});

//register new user
app.post("/user/register/", (req, res) => {
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
