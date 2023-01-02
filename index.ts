import express, { Request, Response } from "express";
import { DirectionsResponse, DistanceMatrixResponse, TrafficModel, TravelMode } from "@googlemaps/google-maps-services-js";
import limiter from "./utils/limiter";
import { body, param, validationResult } from "express-validator";
import MapsConveyor from "./utils/MapsConveyor";
import { AxiosError } from "axios";

const app = express();
const { Client } = require("@googlemaps/google-maps-services-js");
require("dotenv").config();
import {decodePath} from "@googlemaps/google-maps-services-js/dist/util";

const client = new Client({});

app.use(limiter);
app.use(express.json());
app.use(express.static("public"));
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
    .withMessage("Input must be best_guessimum 3 character and maximum 30 character."),
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

function decodeLevels(encodedLevelsString: string) {
  var decodedLevels = [];

  for (var i = 0; i < encodedLevelsString.length; ++i) {
    var level = encodedLevelsString.charCodeAt(i) - 63;
    decodedLevels.push(level);
  }

  return decodedLevels;
}

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
      .directions({
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          mode: TravelMode.driving,
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          departure_time: "now",
          alternatives: true,
          traffic_model: TrafficModel.best_guess
        }
      })
      .then(async ({ data }: DirectionsResponse) => {
        const { routes } = data;
        if (!routes || routes.length === 0) return;
        let routeCalculetes: any = [];

        routes.forEach((route) => {
          if (!route.legs || route.legs.length === 0) return;
          route.legs.forEach((leg) => {
            // FOR MINIMUM DISTANCE CALCULATION
            let distance = Number((leg.distance.value / 1000).toFixed(2));
            // FOR MINIMUM DURATION CALCULATION
            let duration = Number((leg.duration.value / 60).toFixed(2));
            // FOR MINIMUM DURATION IN TRAFFIC CALCULATION
            let duration_in_traffic = Number(((leg.duration_in_traffic?.value ?? 1) / 60).toFixed(2));
            const path = decodePath(route.overview_polyline.points.replace(/'/g, "\\'"));
            let updatedPath: { latitude: number; longitude: number; }[] = [];
            path.map(item => updatedPath.push({latitude: item.lat, longitude: item.lng}));
            let calculateMapVal  = (distance * 0.3) + (duration_in_traffic * 0.7);
            let motorcycleDistances  = distance;
            routeCalculetes.push({
              minute_by_km: duration_in_traffic / distance,
              duration,
              calculateMapVal,
              motorcycleDistances,
              distance,
              overview_polyline: route.overview_polyline,
              duration_in_traffic,
              waypoints: updatedPath
            });
          });
        });
        let min: any = (a: any, f: any): any => a.reduce((m: any, x: any) => m[f] < x[f] ? m : x);
        let car_price, motorcycle_price = 0;
        let best_guess = min(routeCalculetes, "calculateMapVal");
        let best_guess_motorcycle = min(routeCalculetes, "motorcycleDistances");

        let traffic_statue_value = 0;
        if (best_guess.minute_by_km > Number(process.env.TRAFFIC_STATUE_FLUENT) && best_guess.minute_by_km < Number(process.env.TRAFFIC_STATUE_INTENSE_FLUID)) traffic_statue_value = 0;
        if (best_guess.minute_by_km > Number(process.env.TRAFFIC_STATUE_INTENSE_FLUID) && best_guess.minute_by_km < Number(process.env.TRAFFIC_STATUE_DENSE)) traffic_statue_value = 0.05;
        if (best_guess.minute_by_km > Number(process.env.TRAFFIC_STATUE_DENSE)) traffic_statue_value = 0.1;
        if (best_guess.distance < Number(process.env.APP_MIN_KM)) {
          const car_duration_price = Number((best_guess.duration_in_traffic * Number(process.env.CAR_KM_PER_PRICE)).toFixed(2));
          const car_km_traffic_price = Number((car_duration_price * traffic_statue_value).toFixed(2));
          car_price = Number(Number(Number(process.env.CAR_START_PRICE) + car_km_traffic_price).toFixed(2));
          motorcycle_price = Number(process.env.MOTORCYCLE_START_PRICE);

          res.json({
            car_price: car_price,
            motorcycle_price: motorcycle_price,
            distance: best_guess.distance,
            duration: best_guess.duration + 15,
            duration_in_traffic: best_guess.duration_in_traffic + 15,
            traffic_statue_value: traffic_statue_value,
            minute_by_km: best_guess.minute_by_km,
            overview_polyline: best_guess.overview_polyline,
            waypoints: best_guess.waypoints
          });
        } else {
          const subsitude_distance = best_guess.distance - Number(process.env.APP_MIN_KM);
          const subsitude_motorcycle_distance = best_guess_motorcycle.distance - Number(process.env.APP_MIN_KM);
          const car_distance_price = Number((subsitude_distance * Number(process.env.CAR_KM_PER_PRICE)).toFixed(2));
          const car_km_traffic_price = Number(((Number(process.env.CAR_START_PRICE) + car_distance_price) * traffic_statue_value).toFixed(2));
          const motorcycle_distance_price = Number((subsitude_motorcycle_distance * Number(process.env.MOTORCYCLE_KM_PER_PRICE)).toFixed(2));
          let car_price = Number((Number(process.env.CAR_START_PRICE) + car_distance_price + car_km_traffic_price).toFixed(2));
          let motorcycle_price = Number((Number(process.env.MOTORCYCLE_START_PRICE) + motorcycle_distance_price).toFixed(2));
          let mapsConveyor = new MapsConveyor(origin, destination);
          let toll_price_included = false;

          mapsConveyor.checkIfInside([
            {
              check: "avrasya",
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
              distance: best_guess.distance,
              duration: best_guess.duration + 15,
              duration_in_traffic: best_guess.duration_in_traffic + 15,
              minute_by_km: best_guess.minute_by_km,
              traffic_statue_value,
              toll_price_included,
              overview_polyline: best_guess.overview_polyline,
              waypoints: best_guess.waypoints
            });
          });
        }
      })
      .catch((err: AxiosError) => console.log(err));

    // client
    //   .distancematrix({
    //     params: {
    //       key: process.env.GOOGLE_MAPS_API_KEY,
    //       origins: [[origin.latitude, origin.longitude]],
    //       destinations: [[destination.latitude, destination.longitude]],
    //       provideRouteAlternatives: true
    //     }
    //   })
    //   .then(({ data }: DistanceMatrixResponse) => {
    //     console.log(data.rows[0].elements);
    //     let car_price = 0,
    //       motorcycle_price = 0;
    //     if (data.rows.length > 0) {
    //       if (data.rows[0].elements.length > 0) {
    //         let distance = Number((data.rows[0].elements[0].distance.value / 1000).toFixed(2));
    //         let duration = Number((data.rows[0].elements[0].duration.value / 60).toFixed(2));
    //         let duration_in_traffic = Number((data.rows[0].elements[0].duration_in_traffic.value / 60).toFixed(2));
    //         if (duration > duration_in_traffic) {
    //           let temp_duration_in_trraffic = duration_in_traffic;
    //           duration_in_traffic = duration;
    //           duration = temp_duration_in_trraffic;
    //         }
    //         const minute_by_km = Number((duration_in_traffic / distance).toFixed(2));
    //         // const minute_by_km = 1.99;
    //         let traffic_statue_value = 0;
    //         if (minute_by_km > Number(process.env.TRAFFIC_STATUE_FLUENT) && minute_by_km < Number(process.env.TRAFFIC_STATUE_INTENSE_FLUID)) traffic_statue_value = 0;
    //         if (minute_by_km > Number(process.env.TRAFFIC_STATUE_INTENSE_FLUID) && minute_by_km < Number(process.env.TRAFFIC_STATUE_DENSE)) traffic_statue_value = 0.05;
    //         if (minute_by_km > Number(process.env.TRAFFIC_STATUE_DENSE)) traffic_statue_value = 0.1;
    //
    //
    //         if (distance < Number(process.env.APP_MIN_KM)) {
    //           const car_duration_price = Number((duration_in_traffic * Number(process.env.CAR_KM_PER_PRICE)).toFixed(2));
    //           const car_km_traffic_price = Number((car_duration_price * traffic_statue_value).toFixed(2));
    //           car_price = Number(Number(Number(process.env.CAR_START_PRICE) + car_km_traffic_price).toFixed(2));
    //           motorcycle_price = Number(process.env.MOTORCYCLE_START_PRICE);
    //           res.json({
    //             car_price: car_price,
    //             motorcycle_price: motorcycle_price,
    //             distance: distance,
    //             duration: duration,
    //             duration_in_traffic: duration_in_traffic,
    //             traffic_statue_value: traffic_statue_value,
    //             minute_by_km
    //           });
    //         } else {
    //           const subsitude_distance = distance - Number(process.env.APP_MIN_KM);
    //           const car_distance_price = Number((subsitude_distance * Number(process.env.CAR_KM_PER_PRICE)).toFixed(2));
    //           const car_km_traffic_price = Number(((Number(process.env.CAR_START_PRICE) + car_distance_price) * traffic_statue_value).toFixed(2));
    //           const motorcycle_distance_price = Number((subsitude_distance * Number(process.env.MOTORCYCLE_KM_PER_PRICE)).toFixed(2));
    //           let car_price = Number((Number(process.env.CAR_START_PRICE) + car_distance_price + car_km_traffic_price).toFixed(2));
    //           let motorcycle_price = Number((Number(process.env.MOTORCYCLE_START_PRICE) + motorcycle_distance_price).toFixed(2));
    //           let mapsConveyor = new MapsConveyor(origin, destination);
    //           let toll_price_included = false;
    //           mapsConveyor.checkIfInside([
    //             {
    //               check: "avrasya",
    //               car_price: 50,
    //               motor_price: 20
    //             },
    //             {
    //               check: "o-7",
    //               car_price: 20,
    //               motor_price: 20
    //             }
    //           ]).then(({ inside, car_price: car_toll_price, motor_price: motor_toll_price }) => {
    //             if (inside) {
    //               car_price += car_toll_price;
    //               motorcycle_price += motor_toll_price;
    //               toll_price_included = true;
    //             }
    //             return res.json({
    //               car_price,
    //               motorcycle_price,
    //               car_km_traffic_price,
    //               motorcycle_distance_price,
    //               car_distance_price,
    //               distance,
    //               duration,
    //               duration_in_traffic,
    //               minute_by_km,
    //               traffic_statue_value,
    //               toll_price_included
    //             });
    //           });
    //         }
    //       } else {
    //         res.status(409).json({
    //           message: "There is no location for giving location"
    //         });
    //       }
    //     } else {
    //       res.status(409).json({
    //         message: "There is no path for giving location"
    //       });
    //     }
    //   })
    //   .catch(() =>
    //     res.status(500).json({
    //       message: "Something gone wrong, please try again!"
    //     })
    //   );
  }
);
app.listen(Number(process.env.PORT) || 3000, () => {
  console.log(`PORT LISTENING ON : ${Number(process.env.PORT)}`);
});
// app.listen(Number(process.env.PORT) || 3000, "192.168.1.18", () => {
// console.log(`PORT LISTENING ON : ${process.env.PORT}`);
// });


