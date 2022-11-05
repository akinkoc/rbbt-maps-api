import express, { Request, Response } from "express";
import { DirectionsResponse, DistanceMatrixResponse, TrafficModel } from "@googlemaps/google-maps-services-js";
import limiter from "./utils/limiter";
import { body, param, validationResult } from "express-validator";
import MapsConveyor from "./utils/MapsConveyor";

const app = express();
const PORT = 3000;
const { Client } = require("@googlemaps/google-maps-services-js");
require("dotenv").config();

const client = new Client({});

app.use(limiter);
app.use(express.json());
app.use(express.static("public"))
app.post(
  "/getDirections",
  param("token", "Token is required").notEmpty().withMessage("Token is missing"),
  body("origin.latitude")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Origin latitude cannot be empty")
    .isNumeric()
    .withMessage("Origin latitude must be integer"),
  body("origin.longitude")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Origin longitude cannot be empty")
    .isNumeric()
    .withMessage("Origin longitude must be integer"),
  body("destination.latitude")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Destination latitude cannot be empty")
    .isNumeric()
    .withMessage("Destination latitude must be integer"),
  body("destination.longitude")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Destination longitude cannot be empty")
    .isNumeric()
    .withMessage("Destination longitude must be integer"),
  (req: Request, res: Response) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.json(err.mapped());
    }
    const { origin, destination } = req.body;
    client
      .directions({
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          origin: origin,
          destination: destination,
          departure_time: "now",
          traffic_model: TrafficModel.best_guess
        }
      })
      .then(({ data }: DirectionsResponse) => res.json(data))
      .catch(() =>
        res.status(500).json({
          message: "Something gone wrong, please try again!"
        })
      );
  }
);
app.post(
  "/getAutocompleteValues",
  param("token", "Token is required").notEmpty().withMessage("Token is missing"),
  body("input")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Input cannot be empty")
    .isLength({
      min: 3
    })
    .withMessage("Input must be minimum 3 character and maximum 30 character."),
  body("session_id").notEmpty({ ignore_whitespace: true }).withMessage("Session ID cannot be null"),
  (req: Request, res: Response) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.json(err.mapped());
    }
    const { input, session_id } = req.body;
    client
      .placeAutocomplete({
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          input: input,
          sessiontoken: session_id
        }
      })
      .then(({ data }: DirectionsResponse) => res.json(data))
      .catch(() =>
        res.status(500).json({
          message: "Something gone wrong, please try again!"
        })
      );
  }
);
app.post(
  "/getDistanceMatrixValues",
  param("token", "Token is required").notEmpty().withMessage("Token is missing"),
  body("origin.latitude")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Origin latitude cannot be empty")
    .isNumeric()
    .withMessage("Origin latitude must be integer"),
  body("origin.longitude")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Origin longitude cannot be empty")
    .isNumeric()
    .withMessage("Origin longitude must be integer"),
  body("destination.latitude")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Destination latitude cannot be empty")
    .isNumeric()
    .withMessage("Destination latitude must be integer"),
  body("destination.longitude")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Destination longitude cannot be empty")
    .isNumeric()
    .withMessage("Destination longitude must be integer"),
  (req: Request, res: Response) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.json(err.mapped());
    }
    const { origin, destination } = req.body;
    client
      .distancematrix({
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          origins: [origin],
          destinations: [destination],
          departure_time: "now",
          traffic_model: TrafficModel.best_guess
        }
      })
      .then(({ data }: DirectionsResponse) => res.json(data))
      .catch(() =>
        res.status(500).json({
          message: "Something gone wrong, please try again!"
        })
      );
  }
);

app.post(
  "/getPriceCalculation",
  // param('token', 'Token is required').notEmpty().withMessage('Token is missing'),
  body("origin.latitude")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Origin latitude cannot be empty")
    .isNumeric()
    .withMessage("Origin latitude must be integer"),
  body("origin.longitude")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Origin longitude cannot be empty")
    .isNumeric()
    .withMessage("Origin longitude must be integer"),
  body("destination.latitude")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Destination latitude cannot be empty")
    .isNumeric()
    .withMessage("Destination latitude must be integer"),
  body("destination.longitude")
    .notEmpty({
      ignore_whitespace: true
    })
    .withMessage("Destination longitude cannot be empty")
    .isNumeric()
    .withMessage("Destination longitude must be integer"),
  (req: Request, res: Response) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.json(err.mapped());
    }
    const { origin, destination } = req.body;
    client
      .distancematrix({
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          origins: [origin],
          destinations: [destination],
          departure_time: "now",
          traffic_model: TrafficModel.best_guess
        }
      })
      .then(({ data }: DistanceMatrixResponse) => {
        let car_price = 0,
          motorcycle_price = 0;
        if (data.rows.length > 0) {
          if (data.rows[0].elements.length > 0) {
            const distance = Number((data.rows[0].elements[0].distance.value / 1000).toFixed(2));
            const duration = Number((data.rows[0].elements[0].duration.value / 60).toFixed(2));
            const duration_in_traffic = Number((data.rows[0].elements[0].duration_in_traffic.value / 60).toFixed(2));
            const duration_by_km = Number((duration_in_traffic / distance).toFixed(2));
            let traffic_statue_value = 0;
            if (duration_by_km > Number(process.env.TRAFFIC_STATUE_FLUENT) && duration_by_km < Number(process.env.TRAFFIC_STATUE_INTENSE_FLUID)) traffic_statue_value = 0;
            if (duration_by_km > Number(process.env.TRAFFIC_STATUE_INTENSE_FLUID) && duration_by_km < Number(process.env.TRAFFIC_STATUE_DENSE)) traffic_statue_value = 0.05;
            if (duration_by_km > Number(process.env.DENSE)) traffic_statue_value = 0.1;

            if (distance < Number(process.env.APP_MIN_KM)) {
              car_price = Number(process.env.CAR_START_PRICE);
              motorcycle_price = Number(process.env.MOTORCYCLE_START_PRICE);
              res.json({
                car_price: car_price,
                motorcycle_price: motorcycle_price,
                distance: distance,
                duration: duration,
                duration_in_traffic: duration_in_traffic,
                traffic_statue_value: traffic_statue_value
              });
            } else {
              const subsitude_distance = distance - Number(process.env.APP_MIN_KM);
              const car_distance_price = Number((subsitude_distance * Number(process.env.CAR_KM_PER_PRICE)).toFixed(2));
              const motorcycle_distance_price = Number((subsitude_distance * Number(process.env.MOTORCYCLE_KM_PER_PRICE)).toFixed(2));
              const car_km_traffic_price = Number(((Number(process.env.CAR_START_PRICE) + car_distance_price) * traffic_statue_value).toFixed(2));
              let car_price = Number((Number(process.env.CAR_START_PRICE) + car_distance_price + car_km_traffic_price).toFixed(2));
              let motorcycle_price = Number((Number(process.env.MOTORCYCLE_START_PRICE) + motorcycle_distance_price).toFixed(2));
              let mapsConveyor = new MapsConveyor(origin, destination);
              let toll_price_included = false;
              mapsConveyor.checkIfInside([
                {
                  check: "avraysa",
                  car_price: 50,
                  motor_price: 20
                },
                {
                  check: "o-7",
                  car_price: 20,
                  motor_price: 20
                }
              ]).then(({ inside, car_price: car_toll_price, motor_price: motor_toll_price }) => {
                if (inside) {
                  car_price += car_toll_price;
                  motorcycle_price += motor_toll_price;
                  toll_price_included = true;
                }
                return res.json({
                  car_price,
                  motorcycle_price,
                  car_km_traffic_price,
                  motorcycle_distance_price,
                  car_distance_price,
                  distance,
                  duration,
                  duration_in_traffic,
                  duration_by_km,
                  traffic_statue_value,
                  toll_price_included
                });
              });
            }
          } else {
            res.status(409).json({
              message: "There is no location for giving location"
            });
          }
        } else {
          res.status(409).json({
            message: "There is no path for giving location"
          });
        }
      })
      .catch(() =>
        res.status(500).json({
          message: "Something gone wrong, please try again!"
        })
      );
  }
);

app.listen(PORT, () => {
  console.log(`PORT LISTENING ON : ${PORT}`);
});
