// @ts-nocheck
type LatLng = {
  latitude: number
  longitude: number
}
type tollLocations = {
  check: string
  car_price: number
  motor_price: number
}
const sprintf = require("sprintf-js").sprintf;
import axios from "axios";

class MapsConveyor {
  private API_URL: string = "https://maps.googleapis.com/maps/api/directions/json";
  private origin: LatLng;
  private destination: LatLng;

  constructor(origin: LatLng, destination: LatLng) {
    this.origin = origin;
    this.destination = destination;
  }

  private async getParsedMapValues() {
    try {
      let urlCombined = sprintf(
        "%s?destination=%s,%s&origin=%s,%s&key=%s",
        this.API_URL,
        this.destination.latitude,
        this.destination.longitude,
        this.origin.latitude,
        this.origin.longitude,
        process.env.GOOGLE_MAPS_API_KEY
      );
      let response = await axios.get(urlCombined);
      let responseJson = await response.data;

      let summaries = [];
      let legs = [];
      let steps = [];
      for (const route of responseJson.routes) {
        summaries.push(route.summary.replace(/\s/g, "").toLowerCase());
        for (const leg of route.legs) {
          legs.push({
            start_address: leg.start_address.replace(/\s/g, "").toLowerCase(),
            end_address: leg.end_address.replace(/\s/g, "").toLowerCase(),
            distance: leg.distance.text,
            duration: leg.duration.text
          });
          for (const step of leg.steps) {
            steps.push({
              instruction: step.html_instructions.replace(/\s/g, "").toLowerCase()
            });
          }
        }
      }
      return { summaries: summaries, legs: legs, steps: steps };
    } catch (e) {
      throw new Error(e);
    }
  }

  public async checkIfInside(tollLocations: tollLocations[]): Promise<{ inside: boolean, car_price: number, motor_price: number }> {
    try {
      let parsedMapValues = await this.getParsedMapValues();
      let summaries = parsedMapValues["summaries"];
      let legs = parsedMapValues["legs"];
      let steps = parsedMapValues["steps"];
      for (const summary of summaries) {
        for (const tollLocation of tollLocations) {
          let re = new RegExp(tollLocation.check, "g");
          if (summary.replace(/\s+/g, "").match(re)){
            return Promise.resolve({
              inside: true,
              car_price: tollLocation.car_price,
              motor_price: tollLocation.motor_price
            });
          }
        }
      }
      for (const leg of legs) {
        for (const tollLocation of tollLocations) {
          let re = new RegExp(tollLocation.check, "g");
          if (leg.start_address.replace(/\s+/g, "").match(re) || leg.end_address.replace(/\s+/g, "").match(re)) {
            return Promise.resolve({
              inside: true,
              car_price: tollLocation.car_price,
              motor_price: tollLocation.motor_price
            });
          }
        }
      }
      for (const step of steps) {
        for (const tollLocation of tollLocations) {
          let re = new RegExp(tollLocation.check, "g");
          if (step.instruction.replace(/\s+/g, "").match(re)) {
            return Promise.resolve({
              inside: true,
              car_price: tollLocation.car_price,
              motor_price: tollLocation.motor_price
            });
          }
        }
      }
    } catch (e) {
      throw new Error(e);
    }
    return false;
  }
}

export default MapsConveyor;
