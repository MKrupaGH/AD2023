import fetch from "node-fetch";
import mongoose from "mongoose";
import moment from "moment/moment.js";
import express from "express";
import cors from "cors";

let app = express();
app.use(express.json());

app.use(cors());

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://ad2023site-production.up.railway.app"
  );

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

const PORT = process.env.PORT || 4000;

const dev_db_url =
  "mongodb+srv://Maryslaw:AD2023@ad2023.dbi6siw.mongodb.net/?retryWrites=true&w=majority";
const mongoDB = process.env.MONGODB_URI || dev_db_url;

mongoose.connect(mongoDB, { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const infoSchema = new mongoose.Schema({
  temp: { type: Number, required: true },
  hum: { type: Number, required: true },
  pres: { type: Number, required: true },
  date: { type: String, required: true },
});

const Post = mongoose.model("Post", infoSchema);

// async function getPosts() {
//   const weatherInfo = await fetch(
//     "https://api.openweathermap.org/data/2.5/weather?q=Krakow&units=metric&APPID=a90a094d8ba09340beba0e7fd95a30fa"
//   );

//   const response = await weatherInfo.json();

//   const temp = Math.round(response.main.temp);

//   const dateUTC0 = new Date().getTime();
//   const currentTime = new Date(dateUTC0 + 2 * 60 * 60 * 1000);
//   const date = moment(currentTime).format("DD/MM/YYYY HH:mm:ss");

//   const post = new Post({
//     temp: temp,
//     hum: response.main.humidity,
//     pres: response.main.pressure,
//     date: date,
//   });

//   post.save();
// }

app.get("/test", async (req, res, next) => {
  try {
    const collection = await Post.find();

    const dates = collection.map((obj) => obj.date.split(" ")[0]);

    const singleDates = [...new Set(dates)];

    return res.status(200).json({
      success: true,
      count: collection.length,
      data: singleDates,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/date", async (req, res, next) => {
  try {
    const idDate = String(req.query.date);
    const regex = new RegExp(idDate);
    const collection = await Post.find({ date: { $regex: regex } });

    const keys = ["temp", "hum", "pres"];
    let result = {};

    keys.forEach((key) => (result[key] = []));

    collection.forEach((obj) =>
      keys.forEach((key) => result[key].push(obj[key]))
    );

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "server error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
