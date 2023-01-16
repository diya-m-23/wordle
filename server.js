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

let lost;
console.log(lost);

app.get('/', function(request, response) {
  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("index");
});

app.get('/play', function(request, response) {
    let users = JSON.parse(fs.readFileSync('data/users.json'));
    let words = JSON.parse(fs.readFileSync('data/words.json'));
    let fighters = JSON.parse(fs.readFileSync('data/fighters.json'));
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("play", {
      data: users,
      dataW: words,
      dataF: fighters
    });
});

app.get('/win', function(request, response) {
let win = JSON.parse(fs.readFileSync('data/win.json'));
let wins=[];
for(data in wins){
wins[data].win ++;
}
fs.writeFileSync('data/win.json', JSON.stringify(win));
      response.status(200);
      response.setHeader('Content-Type', 'text/html')
      response.render("win", {
        data: wins,
      });
});
app.get('/lose', function(request, response) {
    let lose = JSON.parse(fs.readFileSync('data/lose.json'));
    let loses=[];
    for(data in loses){
    loses[data].lose ++;
    }
    fs.writeFileSync('data/lose.json', JSON.stringify(lose));
      response.status(200);
      response.setHeader('Content-Type', 'text/html')
      response.render("lose", {
        data: loses,
      });
});

app.get('/play2', function(request, response) {
  let users = JSON.parse(fs.readFileSync('data/users.json'));
  let fighters = JSON.parse(fs.readFileSync('data/fighters.json'));
  let words = JSON.parse(fs.readFileSync('data/words.json'));
  let chosenWord;
  let win = true;
  let lose = false;
  let gameTime = 0;

    //accessing URL query string information from the request object
    let user = request.query.user;
    let word = request.query.word;
    let fighter = request.query.fighter;

    if(users[user] || words[word] || fighters[fighter]){
      let wordlist = [];
      words.forEach(function(word){
        wordlist.push(word.name);
      });

      let rand = Math.floor(Math.random() * wordlist.length);
      let chosenWord  = wordlist[rand];

      words.forEach(function(word){
        if (chosenWord == word.name) {
          word.chosenWordCount++;
        } else if (chosenWord !== word.name){
          word.notChosenWord++;
        }
        word.chosen_percent = Math.floor(100*(word.chosenWordCount)/(word.chosenWordCount +  word.notChosenWord));
        console.log(word.chosen_percent);
      });

      function lose(){
        users[user].lose++;
        fighters[fighter].win++;
        let win = false;
      }

      function win(){
        users[user].win++;
        fighters[fighter].lose++;
        fighters[fighter].time--;
      }

      let interval = 0;

      function timer(){
        gameTime++;
        if (gameTime < fighters[fighter].time){
        }
        else {
          lose();
          clearInterval(interval);
        }

        if (gameTime > fighters[fighter].time && win === true) {
          win();
        }
      }

      let results={};

      results["userName"]=user;
      results["userPhoto"]=users[user].photo;
      results["fighterName"]=fighter;
      results["fighterPhoto"]=fighters[fighter].photo;
      results["fighterTime"]=fighters[fighter].time;
      results["chosenWord"]=chosenWord;
      results["chosenWordCount"]=chosenWord.chosenWordCount;

      interval = setInterval(timer, 1000);

      //update users.json to permanently remember results
      fs.writeFileSync('data/users.json', JSON.stringify(users));
      fs.writeFileSync('data/words.json', JSON.stringify(words));
      fs.writeFileSync('data/fighters.json', JSON.stringify(fighters));

      response.status(200);
      response.setHeader('Content-Type', 'text/html')
      response.render("play2", {
        data: results,
        dataset: words,
        chosenWordServer : chosenWord,

      });
    }else{
      response.status(404);
      response.setHeader('Content-Type', 'text/html')
      response.render("error", {
        "errorCode":"404"
      });
    }

});


app.get('/usersScores', function(request, response) {
  let users = JSON.parse(fs.readFileSync('data/users.json'));
  let userArray=[];

  //create an array to use sort, and dynamically generate win percent
  for(name in users){
    users[name].win_percent = (users[name].win/parseFloat(users[name].win+users[name].lose+users[name].tie) * 100).toFixed(2);
    if(users[name].win_percent=="NaN") users[name].win_percent=0;
    userArray.push(users[name])
  }
  userArray.sort(function(a, b){
    return parseFloat(b.win_percent)-parseFloat(a.win_percent);
  })

  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("usersScores",{
    users: userArray,
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

app.get('/user/:userName', function(request, response) {
  let users = JSON.parse(fs.readFileSync('data/users.json'));

  // using dynamic routes to specify resource request information
  let userName = request.params.userName;

  if(users[userName]){
    users[userName].win_percent = (users[userName].win/parseFloat(users[userName].win+users[userName].lose) * 100).toFixed(2);
    if(users[userName].win_percent=="NaN") users[userName].win_percent=0;

    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("userDetails",{
      user: users[userName]
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

app.get('/userCreate', function(request, response) {
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("userCreate");
});

app.post('/userCreate', function(request, response) {
    let userName = request.body.userName;
    let userPhoto = request.body.userPhoto;
    if(userName&&userPhoto){
      let users = JSON.parse(fs.readFileSync('data/users.json'));
      let newuser={
        "name": userName,
        "photo": userPhoto,
        "win":0,
        "lose": 0,
      }
      users[userName] = newuser;
      fs.writeFileSync('data/users.json', JSON.stringify(users));

      response.status(200);
      response.setHeader('Content-Type', 'text/html')
      response.redirect("/user/"+userName);
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
