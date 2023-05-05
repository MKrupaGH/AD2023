import fetch from "node-fetch";
import mongoose from "mongoose";
import moment from "moment/moment.js";

const dev_db_url =
  "mongodb+srv://Maryslaw:AD2023@ad2023.dbi6siw.mongodb.net/?retryWrites=true&w=majority";
const mongoDB = process.env.MONGODB_URI || dev_db_url;

mongoose.connect(mongoDB, { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const infoSchema = new mongoose.Schema(
  {
    temp: { type: Number, required: true },
    hum: { type: Number, required: true },
    pres: { type: Number, required: true },
    date:{type: String, required: true}
  }
);

const Post = mongoose.model('Post', infoSchema);

async function getPosts() {
  const weatherInfo = await fetch(
    "https://api.openweathermap.org/data/2.5/weather?q=Krakow&units=metric&APPID=a90a094d8ba09340beba0e7fd95a30fa"
  );

  const response = await weatherInfo.json();
  
  const temp  = Math.round(response.main.temp)
  
  const date = moment().format("DD/MM/YYYY HH:mm:ss")

  const post = new Post({
    temp: temp,
    hum: response.main.humidity,
    pres: response.main.pressure,
    date: date
  })

  post.save()

}

setInterval(getPosts,1000*60*60);