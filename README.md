# CSCI3916 Assignment Three - Movie API

## Deployment Links
- **API (Render):** https://csci3916-assignmentthree.onrender.com
- **React Site (Netlify):** https://csci3916-hw3-react.netlify.app

## GitHub Repositories
- **API:** https://github.com/Marc-Cer323/CSCI3916_AssignmentThree
- **React:** https://github.com/Marc-Cer323/CSC3916_REACT19

---

## API Routes

| Route | GET | POST | PUT | DELETE |
|---|---|---|---|---|
| `/movies` | Return all movies | Save a single movie | 405 - Not Allowed | 405 - Not Allowed |
| `/movies/:movieparameter` | Return specific movie by title | 405 - Not Allowed | Update specific movie by title | Delete specific movie by title |

### Authentication Routes
| Route | Method | Description |
|---|---|---|
| `/signup` | POST | Register a new user |
| `/signin` | POST | Login and receive JWT token |

---

## Postman Collection

Import `postman_collection.json` from this repository into Postman to run all tests.

### Tests Included
- ✅ Signup a new user (random username/password in pre-request script)
- ✅ Signin and store JWT token as collection variable
- ✅ GET all movies
- ✅ GET specific movie by title
- ✅ POST save a new movie
- ✅ PUT update a movie
- ✅ DELETE a movie
- ✅ Error: Duplicate user signup
- ✅ Error: Movie missing required actors
- ✅ Error: PUT on /movies (405 not allowed)
- ✅ Error: Movie not found (404)

### How to Import & Run
1. Download `postman_collection.json` from this repo
2. Open Postman → **Import** → select the file
3. Run **Auth** folder first (Signup → Signin) to generate JWT token
4. Run **Movies** folder to test all CRUD operations

---

## Movie Schema
```javascript
{
  title: { type: String, required: true, index: true },
  releaseDate: { type: Number, min: 1900, max: 2100 },
  genre: { type: String, enum: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'] },
  actors: [{ actorName: String, characterName: String }]
}
```

## User Schema
```javascript
{
  name: String,
  username: { type: String, unique: true },
  password: String  // hashed with bcrypt
}
```

---

## Requirements
Create a collection in MongoDB to hold information about movies
- Each entry should contain the following
    - title (string, required, index)
    - releaseDate
    - genre (Action, Adventure, Comedy, Drama, Fantasy, Horror, Mystery, Thriller, Western, Science Fiction)
    - Array of three actors that were in the film
        - actorName
        - characterName
    - The movie collection should have at least five movies
- Create a NodeJS Web API to interact with your database
    - Follow best practices (e.g. /movies collection)
    - Your API should support all CRUD operations (through HTTP POST, PUT, DELETE, GET)
    - Ensure incoming entities contain the necessary information. For example if the movie does not contain actors, the entity should not be created and an error should be returned
- All endpoints should be protected with a JWT token (implement signup, and signin)
    - For this assignment you must implement a User database in Mongo
        - name
        - username
        - password (should be hashed)
    - If username exists the endpoint should return an error that the user already exists
    - JWT secret needs to be stored in an environment variable

## Resources
- https://www.mongodb.com/cloud/atlas
- https://render.com/docs/deploy-create-react-app
