"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
var firebaseConfig = {
    apiKey: "AIzaSyBRzuZEkvRlRy8zqg4dBvntkgHBaSkBp4M",
    authDomain: "history-of-georgia-43551.firebaseapp.com",
    projectId: "history-of-georgia-43551",
    storageBucket: "history-of-georgia-43551.firebasestorage.app",
    messagingSenderId: "394970199474",
    appId: "1:394970199474:web:ffc7994d27f67bb47660ab",
    measurementId: "G-L6FRFMT0NT",
};
var app = (0, app_1.initializeApp)(firebaseConfig);
var db = (0, firestore_1.getFirestore)(app);
exports.db = db;
