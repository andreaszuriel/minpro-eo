import express, { Application } from 'express';
import { AuthRouter } from './routers/auth.router';  

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
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);  
    });
  }
}

const server = new Server();
server.start();
