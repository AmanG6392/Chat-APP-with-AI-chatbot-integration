import mongoose from "mongoose";

console.log(process.env.MONGODB_URI);


const connectDB = async () => {
    try{

        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI)

        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        
        

    }catch (error) {
        
        console.log("MONGO connection error ", error);
        process.exit(1)
        
    }
}


export default connectDB