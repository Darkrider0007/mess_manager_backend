import { app } from './app.js';
import dotenv from 'dotenv'
import { connectDB } from './db/index.js';

dotenv.config({
  path: "/.env",
});

connectDB()
.then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`⚙️  Server🚀 running on port ${process.env.PORT}✨`);
  });
})
.catch((error) => {
  console.log("Error🤷‍♂️ connecting to the database");
  console.log(error);
  process.exit(1);
});