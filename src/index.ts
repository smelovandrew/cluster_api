import * as path from "path";
import { cpus } from 'os';
import express from 'express';
import cors from 'cors';
const app = express()
import { NodeCluster } from "./NodeCluster";

const NODES_COUNT = Number(process.env.NODES_COUNT ?? cpus().length);
const API_PORT = Number(process.env.API_PORT ?? 8000);
const cluster = new NodeCluster(path.join(__dirname, './child.js'), NODES_COUNT)

app.listen(API_PORT, () => {
  console.log(`Cluster app listening at http://localhost:${API_PORT}`)
})

app.use(express.json())
app.use(cors())

app.get('/workers', (_req, res) => {
  res.send(cluster.workers)
})
app.put('/workers/:id', (req, res) => {
  const { isActive } = req.body;
  const { id } = req.params;
  if (typeof isActive !== 'undefined'){
    res.send(cluster.setWorkerIsActive(Number(id), isActive))
  } else {
    res.send(cluster.workers)
  }
})