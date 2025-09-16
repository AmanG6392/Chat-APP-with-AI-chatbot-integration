import 'dotenv/config.js';
import http from 'http'
import app from './app.js'
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';
import projectModel from './models/project.model.js'
import generateAIResult from './services/ai.service.js'

const port = process.env.PORT || 4000
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ["GET", "POST"]
  }
});

const emailToSocketMap = new Map();
const socketIdToEmailMap = new Map()

io.use(async (socket, next) => {

  try {

    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];

    const projectId = socket.handshake.query.projectId;

    if(!mongoose.Types.ObjectId.isValid(projectId)){

      return next(new Error('Invalid projectId'));

    }

    socket.project = await projectModel.findById(projectId);

    if (!token){

      return next(new Error('----Authentication error ----'))

    }

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


  // ✅ Adding this to log every event received
  socket.onAny((event, ...args) => {
    console.log("📥 SERVER RECEIVED EVENT:", event, args);
  });

  socket.roomId = socket.project._id.toString()
  console.log('a user connected');
  
  socket.join(socket.roomId);

    // adding chat feature
  socket.on('project-message',  async data => {

    const message = data.message;

    const aiPresentInMessage = message.includes('@ai');
     
    if(aiPresentInMessage){
      
      const prompt = message.replace('@ai', '')
      const result = await generateAIResult(prompt)

      io.to(socket.roomId).emit('project-message', {
        message: result,
        sender: {
          _id: 'ai',
          email: 'AI'
        }

      } )

      return
    }

    socket.broadcast.to(socket.roomId).emit('project-message', data)

  })
    // adding calling feature
  socket.on('room:join', data =>{
    
    const { email } = data
    

    emailToSocketMap.set(email, socket.id)
    socketIdToEmailMap.set(socket.id, email) 


    // ✅ attaching the socket.roomId to the emitted data
    const updatedData = {
      ...data,
      roomId: socket.roomId, // adding the roomId
    };

    io.to(socket.roomId).emit("user:joined", {email, id: socket.id })
    socket.join(socket.roomId)

    io.to(socket.id).emit("room:join", updatedData)
    
  })

  socket.on('user:call', ({ to , offer }) => {
    
    io.to(to).emit("incoming:call", { from: socket.id, offer})
    
  })

  socket.on ('call:request',({ to, ans}) => {
    
    if (!ans || !ans.type || !ans.sdp) {
    console.warn("Server received invalid answer, not emitting call:accepted");
    return;
    }

    io.to(to).emit("call:accepted", {from: socket.id, ans })
  })

  socket.on('peer:nego:needed', ({ to, offer }) => {
    
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });

  })

  socket.on('peer:nego:done', ({ to, ans }) => {
    
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });

  })

  socket.on('disconnect', () => { 

    console.log('A user disconnected');
    socket.leave(socket.roomId)

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