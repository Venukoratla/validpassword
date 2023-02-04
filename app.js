const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//POST
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const encryptedPassword = await bcrypt.hash(password, 10);
  const alreadyPresent = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await database.get(alreadyPresent);
  const length = password.length;
  if (dbUser === undefined) {
    //create user
    if (length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const registerUser = `INSERT INTO user(username,name,password,gender,location)
        VALUES ('${username}',
        '${name}',
        '${encryptedPassword}',
        '${gender}',
        '${location}');`;
      await database.run(registerUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUser = `SELECT * FROM user WHERE username = '${username}';`;
  const isValid = await database.get(selectUser);
  const isPasswordCorrect = await bcrypt.compare(password, isValid.password);

  if (isValid === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    if (isPasswordCorrect) {
      //login Success
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//POST
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const encryptedPassword = await bcrypt.hash(newPassword, 10);
  const selectUser = `SELECT * FROM user WHERE username = '${username}';`;

  const dbUser = await database.get(selectUser);
  const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
  const length = newPassword.length;
  if (isValidPassword) {
    //update password
    if (length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const addUser = `UPDATE user SET password = '${encryptedPassword}'
        WHERE username = '${username}';`;
      const update = await database.run(addUser);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
