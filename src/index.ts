import express, { Application } from 'express';
import { AuthRouter } from './routers/auth.router';
import { UserRouter } from './routers/user.router';
import { EventRouter } from './routers/event.router';
import { TransactionRouter } from './routers/transactions.router';
import { PromotionRouter } from './routers/promotion.router';
import { DashboardRouter } from './routers/dashboard.router';
// import { startExpirationCron } from './utils/cron'; 
import path from 'path';

// class Server {
//   private app: Application;
//   private port: number;

//   constructor() {
//     this.app = express();
//     this.port = Number(process.env.PORT) || 3000;
//     this.middlewares();
//     this.routes();
//   }

//   private middlewares(): void {
//     this.app.use(express.json());
//   }

//   private routes(): void {
//     this.app.use('/api/auth', new AuthRouter().router);
//     this.app.use('/api/user', new UserRouter().router);
//     this.app.use('/api/event', new EventRouter().router);
//     this.app.use('/api/transaction', new TransactionRouter().router);
//     this.app.use('/api/event', new EventRouter().router);
//     this.app.use('/api/event', PromotionRouter); 
//     this.app.use('/api/organizer', new DashboardRouter().router);
//     this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
//   }

//   public start(): void {
//     // 2. Start cron before server begins listening
//     startExpirationCron();

//     this.app.listen(this.port, () => {
//       console.log(`Server running on port ${this.port}`);
//     });
//   }
// }

// const server = new Server();
// server.start();
