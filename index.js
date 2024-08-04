import fetch from "node-fetch"
import mongoose from "mongoose"
import express from "express"
import cors from "cors"

import dotenv from "dotenv"
import * as cron from "node-cron"
dotenv.config({
  path: ".env",
})

let app = express()
app.use(express.json())

app.use(cors())

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://ad2023site-production.up.railway.app",
    "https://ad2023.onrender.com/"
  )

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  )

  // Request headers you wish to allow
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type")

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true)

  // Pass to next layer of middleware
  next()
})

const PORT = process.env.PORT || 4000

const mongoDB = process.env.MONGODB_URI

mongoose.connect(mongoDB, { useNewUrlParser: true })
const db = mongoose.connection
db.on("error", console.error.bind(console, "MongoDB connection error:"))

const infoSchema = new mongoose.Schema(
  {
    temp: { type: Number, required: true },
    hum: { type: Number, required: true },
    pres: { type: Number, required: true },
    cloud: { type: Number, required: true },
    pm1: { type: Number, required: true },
    pm25: { type: Number, required: true },
    pm10: { type: Number, required: true },
    o3: { type: Number, required: true },
    co2: { type: Number, required: true },
  },
  { timestamps: true }
)

const Sensor = mongoose.model("Sensor", infoSchema)

async function getPosts() {
  const weatherInfo = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=50.0614&longitude=19.9366&current=temperature_2m,relative_humidity_2m,cloud_cover,pressure_msl&timezone=Europe%2FBerlin"
  )

  const pollutionInfo = await fetch(
    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=50.0614&longitude=19.9366&current=pm10,pm2_5,carbon_monoxide,ozone&timezone=Europe%2FBerlin"
  )

  const weatherResponse = await weatherInfo.json()
  const pollutionResponse = await pollutionInfo.json()

  const temp = Math.round(weatherResponse.current.temperature_2m)
  const humidity = Math.round(weatherResponse.current.relative_humidity_2m)
  const cloud = weatherResponse.current.cloud_cover
  const pres = Math.round(weatherResponse.current.pressure_msl)

  const pm10 = Math.round(pollutionResponse.current.pm10)
  const pm25 = Math.round(pollutionResponse.current.pm2_5)
  const pm1 =
    pm25 > 10
      ? Math.floor(pm25 - Math.random() * 5)
      : Math.floor(pm25 - Math.random() * 2)
  const co2 = pollutionResponse.current.carbon_monoxide
  const ozone = pollutionResponse.current.ozone

  const sensor = new Sensor({
    temp,
    hum: humidity,
    pres,
    cloud,
    pm1,
    pm25,
    pm10,
    o3: ozone,
    co2,
  })

  sensor.save()
}

app.post("/data", async (req, res, next) => {
  try {
    await getPosts()
    return res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "server error" })
  }
})
// app.get("/test", async (req, res, next) => {
//   try {
//     const collection = await Post.find();

//     const dates = collection.map((obj) => obj.date.split(" ")[0]);

//     const singleDates = [...new Set(dates)];

//     return res.status(200).json({
//       success: true,
//       count: collection.length,
//       data: singleDates,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: "server error" });
//   }
// });

// app.get("/date", async (req, res, next) => {
//   try {
//     const idDate = String(req.query.date);
//     const regex = new RegExp(idDate);
//     const collection = await Post.find({ date: { $regex: regex } });

//     const keys = ["temp", "hum", "pres"];
//     let result = {};

//     keys.forEach((key) => (result[key] = []));

//     collection.forEach((obj) =>
//       keys.forEach((key) => result[key].push(obj[key]))
//     );

//     return res.status(200).json({
//       success: true,
//       count: result.length,
//       data: result,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: "server error" });
//   }
// });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
