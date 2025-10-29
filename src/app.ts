import express, { Express ,Request ,Response} from "express";
import cors from "cors";
import routes from "./routes/intex.routes.ts";
import cookieParser from "cookie-parser";

export const app: Express = express();

app.use(cors({
     origin: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     credentials: true,
}));
app.set('trust proxy', 1);
app.use(express.json()); 
app.use(cookieParser()); 
app.use(express.urlencoded({ extended: true }));
app.get('/', (req: Request, res: Response) => {
     res.json({message: "API is running...."});
});

app.use('/api-v1', routes);