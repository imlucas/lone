var express = require('express'),
  http = require('http'),
  socketio = require('socket.io'),
  mongodb = require('mongodb'),
  app = express(),
  port = process.env.PORT || 8080,
  hostname = process.env.HOSTNAME || '127.0.0.1',
  listen = 'http://'+hostname+':' + port;

app.server = http.createServer(app);
app.io = socketio.listen(app.server, {serveClient: false});

app.set('json spaces', 2);
app.use(express.static(__dirname + '/static'));

app.get('/is-mongodb-running', function(req, res){
  mongodb.connect('mongodb://localhost:27017', function(err){
    if(err) return res.status(200).send('mongo not running? ' + err);
    res.status(200).send('mongo running!');
  });
});

app.server.listen(port, hostname, function(){
  console.log(listen);
});
