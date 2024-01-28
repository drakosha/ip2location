const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require("stream")
const { Blob } = require("buffer");
const ip = require('ip');
const Zip = require('jszip');
const axios = require('axios');
const { resolve } = require('path');

const result = {};

//const url = 'https://www.ip2location.com/download/?token=HkIuMFgJ3wsniqfvITrBQRUyS1Pe42GQS3Lmz87ugzKp6eeQI43wQqMwGjNcQy3v&file=DB1LITE';
const url = 'https://lab1.triptrack.net/IP2LOCATION-LITE-DB1.CSV.zip';

function processDataRow(data) {
  const { from, to, iso } = data;

  const ranges = rangeToNets(parseInt(from), parseInt(to));

  if (!result[iso]) result[iso] = [];

  ranges.forEach(r => result[iso].push(r));
}

function rangeToNets(from, to) {
  const ranges = [];
  let length = to - from + 1;
  do {
    const bits = Math.trunc(Math.log2(length));
    const shift = Math.pow(2, bits);
    
    ranges.push(`${ip.fromLong(from)}/${32-bits}`);

    length -= shift;
    from += shift;

  } while (length > 0);

  return ranges;
}

async function writeResults() {
  const start = new Date();
  let locations = '';
  let ipv4 = '';
  let id = 1;

  Object.keys(result).forEach(iso => {
    locations += `${id},,,,${iso}\n`;
    // We should add empty columns, it's opnsense bug
    ipv4 += result[iso].map(range => `${range},${id},,,`).join('\n');
    id++;
  });

  const out = new Zip();
  out.file('ip2l-locations-en.csv', locations);
  out.file('ip2l-IPv4.csv', ipv4);
  fs.writeFileSync('ip2l.zip', await out.generateAsync({ 
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
        level: 5
    }
  }));

  console.log(new Date() - start);
}

(async () => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const loaded = await new Zip().loadAsync(response.data);
  Readable.from(await loaded.file('IP2LOCATION-LITE-DB1.CSV').async("nodebuffer"))
   .pipe(csv(['from', 'to', 'iso']))
   .on('data', processDataRow)
   .on('end', writeResults);
})();
