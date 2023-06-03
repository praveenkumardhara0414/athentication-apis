const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
let db = null;
const dbPath = path.join(__dirname, "userData.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};
initializeDBAndServer();

//Post details APIs
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const getUserDetails = `
        SELECT * FROM user WHERE username = '${username}'
    `;
  const dbUser = await db.get(getUserDetails);
  const hashedPassword = await bcrypt.hash(password, 10);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const addRequestQuery = `
                INSERT INTO user(username, name, password, gender, location)
                VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');
            `;
      await db.run(addRequestQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
//Login API
app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const getUserDetails = `
        SELECT * FROM user WHERE username = '${username}';
    `;
  const resultDetails = await db.get(getUserDetails);
  if (resultDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      resultDetails.password
    );
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Update API
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserDetails = `
        SELECT * FROM user WHERE username = '${username}';
    `;
  const dbUser = await db.get(getUserDetails);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (dbUser !== undefined) {
    if (isPasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const addQuery = `
            UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}';
        `;
        await db.run(addQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
