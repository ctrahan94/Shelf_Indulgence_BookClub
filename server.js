
// *****************************************************************************
// Server.js - This file is the initial starting point for the Node/Express server.
//
// ******************************************************************************
// *** Dependencies
// =============================================================
var express = require("express");
var session = require("express-session");
var passport = require("./config/passport");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var PORT = process.env.PORT || 8080;

const db = require("./models")
// =============================================================

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static directory
app.use('/static', express.static('node_modules'));
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public');
});

// Use handlebars
let exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Use Passport
app.use(session({secret: "keyboard cat", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());


// Socket Chat App
// Empty object for when users are added to the chat, they are added to the object
const users = {}

// On connection to socket define the name and connect to the chat
io.on("connection", socket => {
    socket.on("new-user", name => {
        users[socket.id] = name
        socket.broadcast.emit("user-connected", name)
    })
    // Send the message to chat area
    socket.on("send-chat-message", message => {
        // console.log(message);
        socket.broadcast.emit("chat-message", { message: message, name: users[socket.id] })
    })
    // Disconnect from chat
    socket.on("disconnect", name => {
        socket.broadcast.emit("user-disconnected", users[socket.id])
        delete users[socket.id]
    })
})

// Routes
// =============================================================
require("./routes/api-routes.js")(app);
require("./routes/html-routes.js")(app);


// Syncing our sequelize models and then starting our Express app
// =============================================================
db.sequelize.sync({ force: true }).then(function () {
    server.listen(PORT, function () {
        console.log("App listening on PORT " + PORT);
    });
});
