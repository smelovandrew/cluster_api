const params = JSON.parse(process.argv[2]);
import {Node, TMessage} from "./Node";

const node = new Node(params.id, params.isMaster);

console.log(`${node.type} process ${node.id} is running`)

process.on('message', (message: TMessage) => {
  switch (message.type) {
    case 'data':
      node.process(message.value ?? 0)
      break;
    case 'master':
      node.isMaster = true;
      break;
    default:
      break;
  }
})