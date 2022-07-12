/*  
ENTREGABLE VI BACKEND - WEBSOCKETS
RODRIGO FAURE COMISION 30995
*/
const express = require("express");
const app = express();
const fs = require('fs');
const fetch = require('node-fetch')

const { Server: HttpServer } = require("http");
const { Server: IOServer } = require("socket.io");
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);
const PORT = process.env.PORT || 8080;

const { options } = require('./options')
const knex=require('knex')(options);

//TEMPLATE ENGINE
const exphbs = require('express-handlebars');
const { application } = require("express");


//lista de productos al momento de conectar
const productos = [
    {
        "title": "Funko Pop Star Wars: The Mandalorian",
        "price": 24990,
        "thumbnail": "https://m.media-amazon.com/images/I/5176rALHhgS._AC_UL480_FMwebp_QL65_.jpg",
        "id": 1
      },
      {
        "title": "Funko Pop Televisión: Silicon Valley Gilfoyle",
        "price": 24990,
        "thumbnail": "https://m.media-amazon.com/images/I/41PsLYv3r2L._AC_.jpg",
        "id": 2
      },
      {
        "title": "Funko Pop Televisión Marvel: Old Steve Roger",
        "price": 24990,
        "thumbnail": "https://m.media-amazon.com/images/I/51d9zjK3DdL._AC_SX466_.jpg",
        "id": 3
      }
  ]

  const mensajes = [
    { author: "Chat_Bot", text: "Bienvenido, esto son los mensajes disponibles.",
      fecha: " "
    }   
 ]



//SETTINGS
app.engine('handlebars', exphbs.engine())
app.set('view engine', 'handlebars')
app.set('views', __dirname + '/public/views')

app.set('port', PORT)

//MIDDELWARE
app.use(express.json())
app.use(express.urlencoded({ extend: true }))
app.use(express.static(__dirname + '/public'));

//ROUTES
app.get('/', (req, res) => {
    res.render('index')
   
})

app.post('/productos', (req, res) => {
    try {
        const nuevoProducto = req.body;
            knex('productos')
            .insert(nuevoProducto)
            .then(() => {
                console.log('Producto agregado a la base de datos')
            })
            .catch(err => { console.log(err) 
            })
            .finally(() => {
            knex.destroy();
            })
        res.redirect('/')
    }
    catch(error) { console.log('Ha ocurrido un error en el proceso', error)}
    
    })

//server websocket
io.on('connection',socket => {
    console.log('Un cliente se ha conectado');
    //lee productos desde BD
    knex
        .from('productos')
        .select('*')
        .orderBy('id', 'desc')
        .then((rows) => {
            const productos = rows;

        //lee mensajes desde BD 
            knex
                .from('mensajes')
                .select('*')
                .orderBy('id', 'desc')
                .then((rowsmensajes) => {
                    const mensajes = rowsmensajes;
                    
                    socket.emit('productos', productos);
                    socket.emit('mensajes', mensajes)
               })
        // .catch(err => {
        //     console.log(err);
        // })
        // .finally(() => {
        //     knex.destroy();
        // })
        socket.on('new-mensaje', data => {
            console.log(data)
            
            try {
                    knex('mensajes')
                    .insert(data)
                    .then(() => {
                        console.log('Mensaje agregado a la base de datos')
                    })
                    // .catch(err => { console.log(err) 
                    // })
                    // .finally(() => {
                    // knex.destroy();
                    // })
                    io.sockets.emit('mensajes', mensajes);

                // res.redirect('/')
            }
            catch(error) { console.log('Ha ocurrido un error en el proceso', error)}
            
            })
            
    });
 });

//FIN

 //404
 app.use((req, res, next) => {
    res.status(404).sendFile(__dirname + '/public/404.html')
})

//online
httpServer.listen(PORT, function () {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});