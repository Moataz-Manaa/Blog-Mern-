const express = require("express");
const connectDB = require("./db");
const dotenv = require("dotenv");
const authRouter = require("./routes/authRoutes");
const usersRouter = require("./routes/usersRoutes");
const postsRouter = require("./routes/postsRoutes");
const commentsRouter = require("./routes/commentsRoutes");

dotenv.config({ path: (__dirname, ".env") });

connectDB();

const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api/comments", commentsRouter);

const port = process.env.PORT || 8000;
app.listen(port, () =>
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${port}`
  )
);
