//..............Include Express..................................//
const express = require('express');
const fs = require('fs');
const ejs = require('ejs');

//..............Create an Express server object..................//
const app = express();

//..............Apply Express middleware to the server object....//
app.use(express.json()); //Used to parse JSON bodies (needed for POST requests)
app.use(express.urlencoded());
app.use(express.static('public')); //specify location of static assests
app.set('views', __dirname + '/views'); //specify location of templates
app.set('view engine', 'ejs'); //specify templating library

//.............Define server routes..............................//
//Express checks routes in the order in which they are defined

app.get('/', function(request, response) {
  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("index");
});

app.get('/game', function(request, response) {
    let presets = JSON.parse(fs.readFileSync('data/presets.json'));
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("game", {
      data: presets
    });
});

app.get('/results', function(request, response) {
    let presets = JSON.parse(fs.readFileSync('data/presets.json'));

    //accessing URL query string information from the request object
    let opponent = request.query.opponent;
    let gameerThrow = request.query.throw;

    if(presets[opponent]){
      let opponentThrowChoices=["Paper", "Rock", "Scissors"];
      let results={};

      results["gameerThrow"]=gameerThrow;
      results["opponentName"]=opponent;
      results["opponentPhoto"]=presets[opponent].photo;
      results["opponentThrow"] = opponentThrowChoices[Math.floor(Math.random() * 3)];

      if(results["gameerThrow"]===results["opponentThrow"]){
        results["outcome"] = "tie";
      }else if(results["gameerThrow"]==="Paper"){
        if(results["opponentThrow"]=="Scissors") results["outcome"] = "lose";
        else results["outcome"] = "win";
      }else if(results["gameerThrow"]==="Scissors"){
        if(results["opponentThrow"]=="Rock") results["outcome"] = "lose";
        else results["outcome"] = "win";
      }else{
        if(results["opponentThrow"]=="Paper") results["outcome"] = "lose";
        else results["outcome"] = "win";
      }

      if(results["outcome"]=="lose") presets[opponent]["win"]++;
      else if(results["outcome"]=="win") presets[opponent]["lose"]++;
      else presets[opponent]["tie"]++;

      //update presets.json to permanently remember results
      fs.writeFileSync('data/presets.json', JSON.stringify(presets));

      response.status(200);
      response.setHeader('Content-Type', 'text/html')
      response.render("results", {
        data: results
      });
    }else{
      response.status(404);
      response.setHeader('Content-Type', 'text/html')
      response.render("error", {
        "errorCode":"404"
      });
    }
});

app.get('/scores', function(request, response) {
  let presets = JSON.parse(fs.readFileSync('data/presets.json'));
  let opponentArray=[];

  //create an array to use sort, and dynamically generate win percent
  for(name in presets){
    presets[name].win_percent = (presets[name].win/parseFloat(presets[name].win+presets[name].lose+presets[name].tie) * 100).toFixed(2);
    if(presets[name].win_percent=="NaN") presets[name].win_percent=0;
    opponentArray.push(presets[name])
  }
  opponentArray.sort(function(a, b){
    return parseFloat(b.win_percent)-parseFloat(a.win_percent);
  })

  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("scores",{
    presets: opponentArray
  });
});

app.get('/opponent/:opponentName', function(request, response) {
  let presets = JSON.parse(fs.readFileSync('data/presets.json'));

  // using dynamic routes to specify resource request information
  let opponentName = request.params.opponentName;

  if(presets[opponentName]){
    presets[opponentName].win_percent = (presets[opponentName].win/parseFloat(presets[opponentName].win+presets[opponentName].lose+presets[opponentName].tie) * 100).toFixed(2);
    if(presets[opponentName].win_percent=="NaN") presets[opponentName].win_percent=0;

    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("opponentDetails",{
      opponent: presets[opponentName]
    });

  }else{
    response.status(404);
    response.setHeader('Content-Type', 'text/html')
    response.render("error", {
      "errorCode":"404"
    });
  }
});

app.get('/opponentCreate', function(request, response) {
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("opponentCreate");
});

app.post('/opponentCreate', function(request, response) {
    let opponentName = request.body.opponentName;
    let opponentPhoto = request.body.opponentPhoto;
    if(opponentName&&opponentPhoto){
      let presets = JSON.parse(fs.readFileSync('data/presets.json'));
      let newOpponent={
        "name": opponentName,
        "photo": opponentPhoto,
        "win":0,
        "lose": 0,
        "tie": 0,
      }
      presets[opponentName] = newOpponent;
      fs.writeFileSync('data/presets.json', JSON.stringify(presets));

      response.status(200);
      response.setHeader('Content-Type', 'text/html')
      response.redirect("/opponent/"+opponentName);
    }else{
      response.status(400);
      response.setHeader('Content-Type', 'text/html')
      response.render("error", {
        "errorCode":"400"
      });
    }
});

// Because routes/middleware are applied in order,
// this will act as a default error route in case of
// a request fot an invalid route
app.use("", function(request, response){
  response.status(404);
  response.setHeader('Content-Type', 'text/html')
  response.render("error", {
    "errorCode":"404"
  });
});

//..............Start the server...............................//
const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Server started at http://localhost:'+port+'.')
});
