import socket from 'socket.io-client';

let socketInstance = null;   // represent the connection between the your server and the client

export const initializeSocket = (projectId) => {

    {socketInstance = socket(import.meta.env.VITE_API_URL,{
      
        auth: {

            token: localStorage.getItem('token')
        },

        query: {

             projectId: projectId
        },
        
        transports: ['websocket']

       });

     socketInstance.on('connect', () => console.log('socket connected', socket.id));
     socketInstance.on('connect_error', (err) => console.error('socket connect_error', err.message));
    
    }

    return socketInstance;
}

export const receiveMessage =  (eventName, cb) => {

    socketInstance.on(eventName, cb);
}



export const sendMessage = (eventName, data) => {

    socketInstance.emit(eventName, data);

}

export const JoinRoom = (eventName, data) => {
    
      if (!socketInstance) {
        console.error("❌ Socket not initialized yet");
        return;
      }
    socketInstance.emit(eventName, data);
}

export const NowJoinRoom = (eventName, data) =>{

    socketInstance.on(eventName, data)
    return () => { 
        socketInstance.off(eventName,data)
    }
}

// for -> if another user joined the room then to make enter into the room
export const userJoined = (eventName, data) =>{

    socketInstance.on(eventName, data)
    return () => { 
        socketInstance.off(eventName,data)
    }
    
}
export const usercall = (eventName, data) =>{

    socketInstance.emit(eventName, data)
    return () => { 
        socketInstance.off(eventName,data)
    }
    
}

export const incomingcall = (eventName, data) =>{

    socketInstance.on(eventName, data)
    return () => { 
        socketInstance.off(eventName,data)
    }
    
}
export const callrequestaccepted= (eventName, data) =>{

    socketInstance.emit(eventName, data)
    return () => { 
        socketInstance.off(eventName,data)
    }
    
}
export const callAccepting= (eventName, data) =>{

    socketInstance.on(eventName, data)
    return () => { 
        socketInstance.off(eventName,data)
    }
    
}
export const negotiation= (eventName, data) =>{

    socketInstance.emit(eventName, data)
    return () => { 
        socketInstance.off(eventName,data)
    }
    
}
export const negotiationIncoming = (eventName, data) =>{

    socketInstance.on(eventName, data)
    return () => { 
        socketInstance.off(eventName,data)
    }
    
}

export const negotiationDone = (eventName, data) =>{

    socketInstance.emit(eventName, data)
    return () => { 
        socketInstance.off(eventName,data)
    }
    
}

export const negotiationFinal = (eventName, data) =>{

    socketInstance.on(eventName, data)
    return () => { 
        socketInstance.off(eventName,data)
    }
    
}