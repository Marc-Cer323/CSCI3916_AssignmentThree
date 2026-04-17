require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authJwtController = require('./auth_jwt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./Users');
const Movie = require('./Movies');
const Review = require('./Reviews');

// Connect to MongoDB
mongoose.connect(process.env.DB)
    .then(() => {
        console.log('Connected to MongoDB');
        seedMovies().catch(console.error);
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

const router = express.Router();

// Seed at least 5 movies on first run
async function seedMovies() {
    const count = await Movie.countDocuments();
    if (count >= 5) return;

    await Movie.insertMany([
        {
            title: 'The Dark Knight',
            releaseDate: 2008,
            genre: 'Action',
            actors: [
                { actorName: 'Christian Bale', characterName: 'Bruce Wayne' },
                { actorName: 'Heath Ledger', characterName: 'The Joker' },
                { actorName: 'Aaron Eckhart', characterName: 'Harvey Dent' }
            ]
        },
        {
            title: 'Inception',
            releaseDate: 2010,
            genre: 'Science Fiction',
            actors: [
                { actorName: 'Leonardo DiCaprio', characterName: 'Cobb' },
                { actorName: 'Joseph Gordon-Levitt', characterName: 'Arthur' },
                { actorName: 'Elliot Page', characterName: 'Ariadne' }
            ]
        },
        {
            title: 'The Shawshank Redemption',
            releaseDate: 1994,
            genre: 'Drama',
            actors: [
                { actorName: 'Tim Robbins', characterName: 'Andy Dufresne' },
                { actorName: 'Morgan Freeman', characterName: 'Ellis Boyd Redding' },
                { actorName: 'Bob Gunton', characterName: 'Warden Norton' }
            ]
        },
        {
            title: 'The Silence of the Lambs',
            releaseDate: 1991,
            genre: 'Thriller',
            actors: [
                { actorName: 'Jodie Foster', characterName: 'Clarice Starling' },
                { actorName: 'Anthony Hopkins', characterName: 'Hannibal Lecter' },
                { actorName: 'Scott Glenn', characterName: 'Jack Crawford' }
            ]
        },
        {
            title: 'The Lord of the Rings: The Fellowship of the Ring',
            releaseDate: 2001,
            genre: 'Fantasy',
            actors: [
                { actorName: 'Elijah Wood', characterName: 'Frodo Baggins' },
                { actorName: 'Ian McKellen', characterName: 'Gandalf' },
                { actorName: 'Viggo Mortensen', characterName: 'Aragorn' }
            ]
        }
    ]);
    console.log('Seeded 5 movies');
}

// POST /signup
router.post('/signup', async (req, res) => {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ success: false, msg: 'Please include both username and password to signup.' });
    }

    try {
        const user = new User({
            name: req.body.name,
            username: req.body.username,
            password: req.body.password,
        });

        await user.save();
        res.status(201).json({ success: true, msg: 'Successfully created new user.' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'A user with that username already exists.' });
        }
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
});

// POST /signin
router.post('/signin', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username }).select('name username password');

        if (!user) {
            return res.status(401).json({ success: false, msg: 'Authentication failed. User not found.' });
        }

        const isMatch = await user.comparePassword(req.body.password);

        if (isMatch) {
            const userToken = { id: user._id, username: user.username };
            const token = jwt.sign(userToken, process.env.SECRET_KEY, { expiresIn: '1h' });
            res.json({ success: true, token: 'JWT ' + token });
        } else {
            res.status(401).json({ success: false, msg: 'Authentication failed. Incorrect password.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
});

// /movies routes
router.route('/movies')
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movies = await Movie.find();
            res.status(200).json(movies);
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })
    .post(authJwtController.isAuthenticated, async (req, res) => {
        const { title, releaseDate, genre, actors } = req.body;

        if (!title || !releaseDate || !genre || !actors || actors.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Movie must include title, releaseDate, genre, and at least 3 actors.'
            });
        }

        try {
            const movie = new Movie({ title, releaseDate, genre, actors });
            await movie.save();
            res.status(201).json({ success: true, movie });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })
    .put(authJwtController.isAuthenticated, (req, res) => {
        res.status(405).json({ success: false, message: 'HTTP method not supported on /movies. Use /movies/:title to update.' });
    })
    .delete(authJwtController.isAuthenticated, (req, res) => {
        res.status(405).json({ success: false, message: 'HTTP method not supported on /movies. Use /movies/:title to delete.' });
    });

// /movies/:movieparameter routes
router.route('/movies/:movieparameter')
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            if (req.query.reviews === 'true') {
                // Aggregate movie with its reviews using $lookup
                const movie = await Movie.aggregate([
                    { $match: { title: req.params.movieparameter } },
                    {
                        $lookup: {
                            from: 'reviews',
                            localField: '_id',
                            foreignField: 'movieId',
                            as: 'reviews'
                        }
                    }
                ]);
                if (!movie || movie.length === 0) {
                    return res.status(404).json({ success: false, message: 'Movie not found.' });
                }
                res.status(200).json(movie[0]);
            } else {
                const movie = await Movie.findOne({ title: req.params.movieparameter });
                if (!movie) {
                    return res.status(404).json({ success: false, message: 'Movie not found.' });
                }
                res.status(200).json(movie);
            }
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })
    .post(authJwtController.isAuthenticated, (req, res) => {
        res.status(405).json({ success: false, message: 'HTTP method not supported.' });
    })
    .put(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movie = await Movie.findOneAndUpdate(
                { title: req.params.movieparameter },
                req.body,
                { new: true, runValidators: true }
            );
            if (!movie) {
                return res.status(404).json({ success: false, message: 'Movie not found.' });
            }
            res.status(200).json({ success: true, movie });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })
    .delete(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movie = await Movie.findOneAndDelete({ title: req.params.movieparameter });
            if (!movie) {
                return res.status(404).json({ success: false, message: 'Movie not found.' });
            }
            res.status(200).json({ success: true, message: 'Movie deleted successfully.' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });

// /reviews routes
router.route('/reviews')
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const reviews = await Review.find();
            res.status(200).json(reviews);
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })
    .post(authJwtController.isAuthenticated, async (req, res) => {
        const { movieId, username, review, rating } = req.body;

        if (!movieId || !username || !review || rating === undefined) {
            return res.status(400).json({ success: false, message: 'Review must include movieId, username, review, and rating.' });
        }

        try {
            // Check if movie exists
            const movie = await Movie.findById(movieId);
            if (!movie) {
                return res.status(404).json({ success: false, message: 'Movie not found.' });
            }

            const newReview = new Review({ movieId, username, review, rating });
            await newReview.save();
            res.status(201).json({ message: 'Review created!' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });

app.use('/', router);

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found.' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
