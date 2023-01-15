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

app.get('/play', function(request, response) {
    let opponents = JSON.parse(fs.readFileSync('data/opponents.json'));
    let words = JSON.parse(fs.readFileSync('data/words.json'));
    let fighters = JSON.parse(fs.readFileSync('data/fighters.json'));
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("play", {
      data: opponents,
      dataW: words,
      dataF: fighters
    });
});

app.get('/play2', function(request, response) {
  let opponents = JSON.parse(fs.readFileSync('data/opponents.json'));
  let fighters = JSON.parse(fs.readFileSync('data/fighters.json'));
  let words = JSON.parse(fs.readFileSync('data/words.json'));
  let chosenWord;
  let gameTime = 0;

    //accessing URL query string information from the request object
    let opponent = request.query.opponent;
    let word = request.query.word;
    let fighter = request.query.fighter;

    if(opponents[opponent] || words[word] || fighters[fighter]){
      let wordlist = [];
      words.forEach(function(word){
        wordlist.push(word.name);
      });

      let rand = Math.floor(Math.random() * wordlist.length);
      let chosenWord  = wordlist[rand];
      //console.log("server wordlist: " + wordlist);
      //console.log("server.js chosenWord: " + chosenWord);

      words.forEach(function(word){
        if (chosenWord == word.name) {
          word.chosenWordCount++;
        } else if (chosenWord !== word.name){
          word.notChosenWord++;
        }
        word.chosen_percent = Math.floor(100*(word.chosenWordCount)/(word.chosenWordCount +  word.notChosenWord));
        console.log(word.chosen_percent);
      });

      function lose(){ //opponents meaning users
        opponents[opponent].lose++;
        fighters[fighter].win++;
      }

      function win(){ //opponents meaning users
        opponents[opponent].win++;
        fighters[fighter].lose++;
        fighters[fighter].time--;
      }

      function timer(){
        gameTime++;
        if (gameTime < fighters[fighter].time){
          //if (chosenWord==guessWord){
          //win();
          //}
        }
        else {
          //
          lose();
        }
      }

      let results={};

      results["opponentName"]=opponent;
      results["opponentPhoto"]=opponents[opponent].photo;
    //  results["opponentTime"]= gameTime;
      results["fighterName"]=fighter;
      results["fighterPhoto"]=fighters[fighter].photo;
      results["fighterTime"]=fighters[fighter].time;
      results["chosenWord"]=chosenWord;
      results["chosenWordCount"]=chosenWord.chosenWordCount;


      /*if(results["opponentTime"]<=results["fighterTime"]){
      if(results["opponentGuess"]===results["chosenWord"]){
        results["outcome"] = "win";
      }
      else if(results["opponentGuess"]!=results["chosenWord"]){
        results["outcome"] = "lose";
      }
      }else{
        results["outcome"] = "lose";
      }

      if(results["outcome"]=="win"){
        opponents[opponent]["win"]++;
        fighters[fighter]["time"]++;
      }
      else opponents[opponent]["lose"]++; */

      //update opponents.json to permanently remember results
      fs.writeFileSync('data/opponents.json', JSON.stringify(opponents));
      fs.writeFileSync('data/words.json', JSON.stringify(words));
      fs.writeFileSync('data/fighters.json', JSON.stringify(fighters));

      response.status(200);
      response.setHeader('Content-Type', 'text/html')
      response.render("play2", {
        data: results,
        dataset: words,
        chosenWordServer : chosenWord
      });
    }else{
      response.status(404);
      response.setHeader('Content-Type', 'text/html')
      response.render("error", {
        "errorCode":"404"
      });
    }
    setInterval(timer, 1000);
});

app.get('/opponentsScores', function(request, response) {
  let opponents = JSON.parse(fs.readFileSync('data/opponents.json'));
  let opponentArray=[];

  //create an array to use sort, and dynamically generate win percent
  for(name in opponents){
    opponents[name].win_percent = (opponents[name].win/parseFloat(opponents[name].win+opponents[name].lose+opponents[name].tie) * 100).toFixed(2);
    if(opponents[name].win_percent=="NaN") opponents[name].win_percent=0;
    opponentArray.push(opponents[name])
  }
  opponentArray.sort(function(a, b){
    return parseFloat(b.win_percent)-parseFloat(a.win_percent);
  })

  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("opponentsScores",{
    opponents: opponentArray,
  });
});

app.get('/fightersScores', function(request, response) {
  let fighters = JSON.parse(fs.readFileSync('data/fighters.json'));
  let fighterArray=[];

  for(name in fighters){
    fighters[name].win_percent = (fighters[name].win/parseFloat(fighters[name].win+fighters[name].lose) * 100).toFixed(2);
    if(fighters[name].win_percent=="NaN") fighters[name].win_percent=0;
    fighterArray.push(fighters[name])
  }
  fighterArray.sort(function(a, b){
    return parseFloat(b.win_percent)-parseFloat(a.win_percent);
  })

  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("fightersScores",{
    fighters: fighterArray,
  });
});

app.get('/opponent/:opponentName', function(request, response) {
  let opponents = JSON.parse(fs.readFileSync('data/opponents.json'));

  // using dynamic routes to specify resource request information
  let opponentName = request.params.opponentName;

  if(opponents[opponentName]){
    opponents[opponentName].win_percent = (opponents[opponentName].win/parseFloat(opponents[opponentName].win+opponents[opponentName].lose) * 100).toFixed(2);
    if(opponents[opponentName].win_percent=="NaN") opponents[opponentName].win_percent=0;

    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("opponentDetails",{
      opponent: opponents[opponentName]
    });

  }else{
    response.status(404);
    response.setHeader('Content-Type', 'text/html')
    response.render("error", {
      "errorCode":"404"
    });
  }
});

app.get('/fighter/:fighterName', function(request, response) {
  let fighters = JSON.parse(fs.readFileSync('data/fighters.json'));

  // using dynamic routes to specify resource request information
  let fighterName = request.params.fighterName;

  if(fighters[fighterName]){
    fighters[fighterName].win_percent = (fighters[fighterName].win/parseFloat(fighters[fighterName].win+fighters[fighterName].lose) * 100).toFixed(2);
    if(fighters[fighterName].win_percent=="NaN") fighters[fighterName].win_percent=0;

    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("fighterDetails",{
      fighter: fighters[fighterName]
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
      let opponents = JSON.parse(fs.readFileSync('data/opponents.json'));
      let newOpponent={
        "name": opponentName,
        "photo": opponentPhoto,
        "win":0,
        "lose": 0,
      }
      opponents[opponentName] = newOpponent;
      fs.writeFileSync('data/opponents.json', JSON.stringify(opponents));

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

app.get('/fighterCreate', function(request, response) {
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("fighterCreate");
});

app.post('/fighterCreate', function(request, response) {
    let fighterName = request.body.fighterName;
    let fighterPhoto = request.body.fighterPhoto;
    let fighterTime = request.body.fighterTime;
    if(fighterName&&fighterPhoto&&fighterTime){
      let fighters = JSON.parse(fs.readFileSync('data/fighters.json'));
      let newFighter={
        "name": fighterName,
        "photo": fighterPhoto,
        "time": fighterTime,
        "win":0,
        "lose": 0
      }
      fighters[fighterName] = newFighter;
      fs.writeFileSync('data/fighters.json', JSON.stringify(fighters));
      response.status(200);
      response.setHeader('Content-Type', 'text/html')
      response.redirect("/fighter/"+fighterName);
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
