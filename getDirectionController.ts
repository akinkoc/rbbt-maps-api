import  { Request, Response } from 'express'
import { DirectionsResponse } from '@googlemaps/google-maps-services-js'

const { Client } = require('@googlemaps/google-maps-services-js')

const client = new Client({})

const getDirectionController = (req: Request, res: Response) => {
    client
      .directions({
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          origin: {
            lat: 41.00638171425758,
            lng: 28.769349540439134
          },
          destination: {
            lat: 40.98860151267782,
            lng: 28.90320837042786
          },
          language: 'tr'
        }
      })
      .then((datares: DirectionsResponse) => res.json(datares.data))
}
export default getDirectionController;
