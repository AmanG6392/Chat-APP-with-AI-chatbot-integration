import 'dotenv/config.js';
import http from 'http'
import app from './app.js'
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken'



const port = process.env.PORT || 4000
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: '*', // Change this to your frontend URL in production
    methods: ["GET", "POST"]
  }
});


io.use((socket, next) => {

  try {

    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    // if (!token){

    //   return next(new Error('----Authentication error ----'))

    // }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    

    if(!decoded) {
    
      return next(new Error('Authentication error !!!'))
    }


    // socket.user = decoded;

    next();


  }catch(error){

   next(error)

  }
})



io.on('connection',socket  => {

  console.log('a user connected');
  
  socket.on('event', data => {

     /* … */ 

    });
  socket.on('disconnect', () => { 

    console.log('A user disconnected');

   });

});




server.listen(port,() => {
  console.log(`Server is running on port ${port}`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Trying another port...`);
    app.listen(0); // Automatically picks an available port
  }
});