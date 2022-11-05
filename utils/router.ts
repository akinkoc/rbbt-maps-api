import { Express, Router } from 'express'
import getDirectionController from "../getDirectionController";

const router = Router()

router.post("/getDirections", getDirectionController)
