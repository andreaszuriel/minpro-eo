import express, { Application } from 'express';
import { AuthRouter } from './routers/auth.router';
import { UserRouter } from './routers/user.router';
import { EventRouter } from './routers/event.router';
import { TransactionRouter } from './routers/transactions.router';

class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = Number(process.env.PORT) || 3000;
    this.middlewares();
    this.routes();
  }

  private middlewares(): void {
    this.app.use(express.json());
  }

  private routes(): void {
    this.app.use('/api/auth', new AuthRouter().router);
    this.app.use('/api/user', new UserRouter().router);
    this.app.use('/api/event', new EventRouter().router);
    this.app.use('/api/transaction', new TransactionRouter().router);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}

const server = new Server();
server.start();
