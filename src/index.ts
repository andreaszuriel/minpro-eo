import express, { Application } from 'express';
import { AuthRouter } from './routers/auth.router';  // Ensure the AuthRouter is correctly imported

class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = Number(process.env.PORT) || 5000; // Default to port 3000
    this.middlewares();
    this.routes();
  }

  private middlewares(): void {
    this.app.use(express.json()); // Middleware to parse incoming JSON requests
  }

  private routes(): void {
    this.app.use('/api/auth', new AuthRouter().router);  // Set up routes for Auth
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);  // Log the port the server is running on
    });
  }
}

const server = new Server();
server.start();
