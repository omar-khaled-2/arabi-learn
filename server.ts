import next from 'next'
import { createServer } from 'http'
import { parse } from 'url'
import express, { ErrorRequestHandler } from 'express'
import ApiError from './errors/ApiError'
import ConnectionManager from './ConnectionManage'
import mongoose from 'mongoose'
import http from 'http'
import {server as WebSocketServer} from 'websocket'
import skillsRouter from './routes/skills'
import questionsRouter from './routes/questions'
import * as tf from '@tensorflow/tfjs-node'

import BadRequest from './errors/BadRequest'
import fs from "fs/promises"
import path from 'path'

import sharp from 'sharp'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000;


const errorHandler:ErrorRequestHandler = (err, req, res, next) => {
  console.log(err)
  if(err.statusCode)
    res.status(err.statusCode).send({
      message: err.message
    })
  else
    res.status(500).send({
      message: "server error"
    })
}


// tf.loadLayersModel("file://" + path.join(__dirname,"ai/model/model.json")).then((model) => {
// console.log(model)
// })
// .catch(console.log)

const app = next({ dev, hostname, port })

const handle = app.getRequestHandler()

app.prepare().then(() => {

    const app = express();

    app.use(express.json())
    app.use(express.urlencoded({extended:true}))

    app.use("/api/skills",skillsRouter)
    app.use("/api/questions",questionsRouter)


    app.use("/media",express.static("media"))


    app.get('*', async(req, res) => {

      await handle(req, res);

    });

    app.all('*', (req, res) => {
      res.sendStatus(404)
    })

    app.use(errorHandler);

    

    

const server = http.createServer(app);


const wsServer = new WebSocketServer({
    httpServer: server,
  
    
    
});










  wsServer.on('request', function(request) {

      
      // const connection = request.accept();


   

      // new ConnectionManager(connection)
  });


  server.listen(3000, async() => {
      console.log("Server is listening ")
      mongoose.connect('mongodb://127.0.0.1:27017/game').then(() => {
          console.log("Connected to database")
      });

  });
})
