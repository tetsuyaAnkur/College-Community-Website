var express = require('express');
var app = express();
var router = express.Router();
var glyp = require('glyphicons');
var bodyparser = require('body-parser');
var mongojs = require('mongojs');

app.use(bodyparser.urlencoded({
	extended : true
}));

app.use(bodyparser.json())

var db = mongojs('mongodb://127.0.0.1:27017/meandb', ['topics', 'cred']);
console.log("connection established, server up");
//connects to the mongo db

var _= require("lodash");
var jwt = require('jsonwebtoken');
var passport = require('passport');
var passportjwt = require('passport-jwt');

var extractjwt = passportjwt.ExtractJwt;
var jwtstrategy = passportjwt.Strategy;

var jwtoptions = {}
jwtoptions.jwtFromRequest = extractjwt.fromAuthHeaderAsBearerToken();
jwtoptions.secretOrKey = 'hotspotfuckspot';

var strategy = new jwtstrategy(jwtoptions, function(jwt_payload, next){
	console.log('payload recieved ', jwt_payload);
	var one = db.cred.findOne({email : jwt_payload.email});

	if(one){
		next(null, one);
	}
	else{
		next(null, false);
	}
});

passport.use(strategy);




app.use(express.static(__dirname + '/public'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended : true}));

app.get("/api/web", getallpost);
app.get("/api/web/:title", getthispost);
app.put("/api/web/:searchtext", addcomment);
app.post("/apisave", savestuff);
app.get("/api/verify:emailpass", checkcred);
//handles the requests, the methods for each restful api are defined here


function checkcred(req, res){

	console.log("inside checkcred");
	var post= req.body.email;
	console.log("post here : " + post);
	var emailpass = req.params.emailpass.split("_");
	email = emailpass[0];
	pass = emailpass[1];
	console.log("here email and passowrd:",email, pass, email.length);

	var one = db.cred.findOne({email : email}, function(err, cred){
		if(err){
			console.log('error occured');
			res.send(err);
		}
		console.log('this posts successfully fetched');
		if(pass==cred.pass){
			console.log("login successful");
			//res.send("Logged in");
			var payload = {email : post};
			var token = jwt.sign(payload, jwtoptions.secretOrKey);
			console.log("token created : ", token);
			//res.json({message : "ok", token : token});
			//res.sendFile(__dirname+'/public'+'/home3.html');
			//res.redirect('localhost:3000/home3.html');
			res.redirect(302, 'localhost:3000/home3.html');
			//res.redirect('/var/www/html/seproj/public/home3.html');
		}

		else {
			console.log("invalid credentials");
			res.send("Oops, try again!");
		}
		
	});



}

function savestuff(req, res){

	//saves the sign up info into the db
	console.log("save stuff");
	var post = req.body;
	var fname = req.body.fname;
	var lname = req.body.lname;
	var email = req.body.email;
	var pass = req.body.pass;
	console.log(post.fname);
	db.cred.save(post, function(err, post){
		if(err){
			res.send(err);
		}
		console.log("successfully inserted")
		res.json(post);
	})
	

}

function addcomment(req, res) {

	//whenever the user comments it adds the comment to the database so it can be displayed on the window
	console.log("till here : " + req.body.com);

	var comm = req.body.com;
	var tit = req.body.tit;
	console.log(tit);
	db.topics.update({title : tit}, {"$addToSet" : {"content" : comm}},function(err, topics){
			if(err){
				console.log("not updated");
				res.send(err);
			}
			console.log("Updated");
			res.json(topics);
		});

}


function getthispost(req, res){
	//returns all the comment specific to a particular topic whose searchtext was "title"
	var title = req.params.title;
	console.log("the title here : " + title);
	db.topics.findOne({title : title}, function(err, topics){
		if(err){
			console.log('error occured');
			res.send(err);
		}
		console.log('this posts successfully fetched');
		res.json(topics);
	});
}

function getallpost(req, res){

	//not using this anywhere
	console.log("getallpost called");
	db.topics.find(function(err, topics){
		if(err){
			console.log("error!!!!");
		}
		console.log("all posts successfully fetched");
		res.json(topics);
	});
}

app.listen(3000);