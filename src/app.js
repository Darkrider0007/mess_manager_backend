import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
)


app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '16kb'}));
app.use(express.static('public'));

app.use(cookieParser());


import healthCheckRouter  from './routes/healthCheck.routes.js';
import userRouter from './routes/user.routes.js';
import messRouter from './routes/mess.routes.js';


app.use('/api/v1/health', healthCheckRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/mess', messRouter);

export { app };