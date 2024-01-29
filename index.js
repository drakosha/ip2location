const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require("stream")
const ip = require('ip');
const Zip = require('jszip');
const axios = require('axios');

const result = {};

const token = process.env['IP2L_TOKEN'];
const ip2lurl = process.env['IP2L_URL'];
const url = token
  ? `https://www.ip2location.com/download/?token=${token}&file=DB1LITE`
  : ip2lurl;
const outFile = process.env['IP2L_OUT'] || 'ip2l.zip';

function processDataRow(data) {
  const { from, to, iso } = data;

  const ranges = rangeToNets(parseInt(from), parseInt(to));

  if (!result[iso]) result[iso] = [];

  ranges.forEach(r => result[iso].push(r));
}

function rangeToNets(from, to) {
  const ranges = [];
  to += 1;

  const bits = Math.trunc(Math.log2(to - from));
  let toUp = from - from % (1 << bits);

  if (toUp !== from) {
    toUp += (1 << bits);
    toDown = toUp;

    do {
      const bits = Math.trunc(Math.log2(toDown - from));
      const shift = Math.pow(2, bits);
      
      toDown -= shift;

      ranges.unshift(`${ip.fromLong(toDown)}/${32-bits}`);
    } while (toDown > from);
  }

  do {
    const bits = Math.trunc(Math.log2(to - toUp));
    const shift = Math.pow(2, bits);
    
    ranges.push(`${ip.fromLong(toUp)}/${32-bits}`);

    toUp += shift;
  } while (toUp < to);

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
  fs.writeFileSync(outFile, await out.generateAsync({ 
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
        level: 5
    }
  }));
}

(async () => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const loaded = await new Zip().loadAsync(response.data);
  Readable
   .from(await loaded.file('IP2LOCATION-LITE-DB1.CSV').async("nodebuffer"))
   .pipe(csv(['from', 'to', 'iso']))
   .on('data', processDataRow)
   .on('end', writeResults);
})();
