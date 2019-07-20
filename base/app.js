var express        = require('express'),
    bodyParser     = require('body-parser'),
    http           = require('http'),
    request        = require('request'),
    app            = express(),
    token          = "EAAFCnrGcRvwBAGPZCi5KiNjStZAEru3nqCWdi6rqbjgiSTXELv0EjVCB4INiItqlTbXOlMpNyTO50Kj1WOrkUo4Y1KDK5YrCVg3DKxOj4iA6VXZBDfg6WhZCQjIc3zKPJYRrJJJKJZBkGTT2InwJLg9DZCCkSkxAgKWvR4ZA5qG8AZDZD";
    imageFlag      = false;
    coordinatesFlag= false;

app.use(bodyParser.json());

// set port
app.set('port', process.env.PORT || 8080);

// create a health check endpoint
app.get('/health', function(req, res) {
  res.send('okay');
});

app.post('/fb', function(req, res){
    var id = req.body.entry[0].messaging[0].sender.id;
    var text = req.body.entry[0].messaging[0].message.text;
    console.log("Request body:",JSON.stringify(req.body))

    if (req.body.entry[0].messaging[0].message.hasOwnProperty("attachments")){
        console.log("Attachment:", req.body.entry[0].messaging[0].message.attachments[0]);

        if (req.body.entry[0].messaging[0].message.attachments[0].type=='image'){
            console.log("URL",req.body.entry[0].messaging[0].message.attachments[0].payload.url);
            imageFlag = req.body.entry[0].messaging[0].message.attachments[0].payload.url;
        }
        else imageFlag = false;

        if (req.body.entry[0].messaging[0].message.attachments[0].type=='location'){
            console.log("URL",req.body.entry[0].messaging[0].message.attachments[0].url);
            coordinatesFlag = req.body.entry[0].messaging[0].message.attachments[0].payload.coordinates;
        }
        else coordinatesFlag = false;

        
    } else {
        imageFlag = false;
        coordinatesFlag = false;
    }

    app.speechHandler(text, id, function(speech){
        app.messageHandler(speech, id, function(result){
        console.log("Async Handled: " + result)
        })
    })

    res.send(req.body);
});

// start the server
http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

app.get('/fb', function(req, res) {
    if (req.query['hub.verify_token'] === 'oefaneros') {
       res.send(req.query['hub.challenge']);
     } else {
       res.send('Error, wrong validation token');
     }
  });

app.messageHandler = function(text, id, cb) {
    var data = {
        "recipient":{
            "id":id
        },
        "message":{
            "text":text
        }
    };
    var reqObj = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: data
    };
    console.log("Request object",JSON.stringify(reqObj));
    request(reqObj, function(error, response, body) {
        if (error) {
        console.log('Error sending message: ', JSON.stringify(error));
        cb(false)
        } else if (response.body.error) {
        console.log("API Error: " + JSON.stringify(response.body.error));
        cb(false)
        } else{
        cb(true)
        }
    });
}

app.speechHandler = function(text, id, cb) {
    var reqObj = {
      url: 'https://api.api.ai/v1/query?v=20150910',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"Bearer 48d2fb11df574838ba7f9f25fcb75a0b"
      },
      method: 'POST',
      json: {
        "query":text,
        "lang":"es",
        "sessionId":id
      }
    };
    request(reqObj, function(error, response, body) {
      if (error) {
        console.log('Error sending message: ', JSON.stringify(error));
        cb(false)
      } else {
        console.log("Response body:",JSON.stringify(body))
        
        if (imageFlag) cb("Perfecto! Ya casi está listo el reporte ¿Cuánto ha pasado desde que tomaste la foto o video?\n\nFoto recibida. Imagen recibida. URL: " + imageFlag);
        else if (coordinatesFlag) cb("Para terminar, bríndame una descripción de los deshechos\n\nCoordenadas recibidas. Enviar tiempo. Coordenadas: " + coordinatesFlag.lat + " " + coordinatesFlag.long);
        else cb(body.result.fulfillment.speech)
        
      }
    });
  }