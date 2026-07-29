const http = require('http');

function fetch(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function testCoalescing() {
    console.log('Sending 3 concurrent requests to /api/destinations?cities=mumbai');
    const requests = [
        fetch('http://localhost:5000/api/destinations?cities=mumbai'),
        fetch('http://localhost:5000/api/destinations?cities=mumbai'),
        fetch('http://localhost:5000/api/destinations?cities=mumbai')
    ];

    const responses = await Promise.all(requests);
    console.log('Requests completed.');
    console.log('First response block keys:', Object.keys(responses[0].destinations[0].blocks));
    console.log('Poi block:', responses[0].destinations[0].blocks.poi);

    console.log('Fetching stats...');
    const stats = await fetch('http://localhost:5000/api/debug/stats');
    console.log(JSON.stringify(stats, null, 2));
}

testCoalescing().catch(console.error);
