import {TMessage} from "./Node";
import * as child_process from "child_process";
import { ChildProcess } from "child_process";
import { sample } from 'lodash';

interface INode {
  id: number;
  isActive: boolean;
  isMaster: boolean;
  childProcess: ChildProcess | null;
  sent: number;
  processed: number;
}

type TWorker = Omit<INode, 'childProcess'>

export class NodeCluster {
  private nodes: INode[] = [];

  public get workers(): TWorker[] {
    return this.nodes.map(node => {
      const {id, isActive, isMaster, processed, sent} = node;

      return {id, isActive, isMaster, processed, sent}
    })
  }

  private onMessage(message: TMessage): void {
    switch (message.type) {
      case 'data':
        const sender = this.nodes.find(node => node.id === message.id)
        sender && sender.sent++;

        const workerNodes = this.nodes.filter(node => !node.isMaster && node.isActive);
        const randomWorker = sample(workerNodes);
        randomWorker?.childProcess?.send({type: 'data', value: message.value ?? 0});
        break;
      case "processed":
        const worker = this.nodes.find(node => node.id === message.id)
        worker && worker.processed++;
        break;
      default:
        break;
    }

  }

  public constructor(public workerPath: string, public nodesCount: number) {
    if (this.nodesCount < 1) {
      return;
    }

    for (let i = 1; i <= this.nodesCount; i++) {
      const node: INode = {
        id: i,
        isActive: true,
        isMaster: i === 1,
        childProcess: null,
        sent: 0,
        processed: 0
      }
      const child = child_process.fork(workerPath, [JSON.stringify({id: node.id, isMaster: node.isMaster})])
      child.on("message", this.onMessage.bind(this))
      node.childProcess = child
      this.nodes.push(node);
    }
  }

  public setWorkerIsActive(id: number, state: boolean): TWorker[] {
    try {
      const node = this.nodes.find(node => node.id === id)
      if (node) {
        if (state !== node.isActive) {
          if (state) {
            const child = child_process.fork(this.workerPath, [JSON.stringify({id: node.id, isMaster: false})])
            child.on("message", this.onMessage.bind(this))
            node.childProcess = child
          } else {
            const killed = node.childProcess?.kill('SIGINT');
            if (!killed) throw new Error('Node kill failed');
            if (node.isMaster) {
              const workerNodes = this.nodes.filter(node => !node.isMaster);
              const randomWorker = sample(workerNodes);
              if (randomWorker) {
                randomWorker.childProcess?.send({type: 'master'});
                randomWorker.isMaster = true;
              }
              node.isMaster = false;
            }
          }

          node.isActive = state;
        }
      }
    } catch (error) {
      console.error('Failed to set worker state: ', error);
    } finally {
      return this.workers;
    }
  }
}