import express, { Request, Response } from 'express';
import 'dotenv/config';
import router from './routes/v2/index.route';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 5001;

app.use(express.json());
app.use(cors());
app.use('/api', router);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Typescript Express app listening on port ${port}`);
});
