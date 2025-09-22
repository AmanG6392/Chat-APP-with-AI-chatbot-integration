import express from 'express';
import morgan from 'morgan'
import cors from "cors"
import cookieParser from "cookie-parser";
import connectMongoDB from './db/db.js'; 
import userRouter from './routes/user.routes.js'
import projectRouter from './routes/project.routes.js';
import authRouter from './routes/authUser.routes.js'
import aiRouter from './routes/ai.routes.js'
import uploadRoute from "./routes/upload.js";

connectMongoDB()

const app = express();
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser())
app.use(cors({
    // origin: process.env.CORS_ORIGIN,
    // credentials: true
}))

app.use("/api", uploadRoute);
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/projects', projectRouter);
app.use('/ai-res', aiRouter);


app.get('/', (req, res) =>{ 
    res.send('hello World');
})




export default app