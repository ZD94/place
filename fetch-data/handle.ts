import * as fs from 'fs';
import * as readline from 'readline';

export interface RowInterface { 
}

export interface handleRowFnInterface { 
    (row: RowInterface):void;
}

export async function handleFile(filePath: string, handleRowFn: handleRowFnInterface) { 
    const stream = fs.createReadStream(filePath)
    let rl = readline.createInterface({
        input: stream,
    });

    rl.on('line', (line) => {
        handleRowFn(line);
    });

    await new Promise((resolve, reject) => {
        rl.on('close', () => {
            resolve(true);
        })

        rl.on('error', (err) => {
            reject(err);
        })
    });

    stream.close();
    rl.close();
}