
// import { CronJob } from 'cron';
// import { main } from './fetch-data/fetch';
// import * as cluster from 'cluster';
// import * as C from '@jingli/config';

// function jobStop() { 
//     console.log("job stop ...");
// }

// if (cluster.isWorker) { 
//     process.on('message', function (msg) {
//         if (typeof msg == 'string') { 
//             msg = JSON.parse(msg);
//         }
//         if (msg && msg.CMD && msg.CMD == 'schedule') {
//             main()
//                 .catch((err) => { 
//                     console.error(err);
//                 })
//             // console.log(`处理完成请求`);
//         }
//     });
// }

// async function scheduleFn() { 
//     let ids = Object.keys(cluster.workers);
//     let idx = Math.floor(Math.random() * ids.length);
//     console.log(`分配给${[ids[idx]]}处理定时任务`);
//     cluster.workers[ids[idx]].send({ CMD: 'schedule'});
// }

// if (cluster.isMaster) { 
//     const job = new CronJob({
//         cronTime: C.cron,
//         onTick: scheduleFn,
//         start: true,
//         timeZone: 'Asia/Shanghai'
//     });
// }
