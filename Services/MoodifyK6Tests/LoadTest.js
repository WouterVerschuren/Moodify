import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 VUs
    { duration: '3m', target: 50 }, // Hold at 50 VUs
    { duration: '1m', target: 0 },  // Ramp down to 0 VUs
  ],
};

export default function () {
  const listRes = http.get('http://localhost:5000/api/audio');
  check(listRes, {
    'list status is 200': (r) => r.status === 200,
    'list response time < 500ms': (r) => r.timings.duration < 500,
  });

  // // Optional: GET a specific song by id (stream)
  // const songs = listRes.json(); // parse JSON response
  //   const streamRes = http.get(`http://localhost:5000/api/audio/${11}`);
  //   check(streamRes, {
  //     'stream status is 200': (r) => r.status === 200,
  //     'stream content-type is audio': (r) =>
  //       r.headers['Content-Type'].startsWith('audio/'),
  //   });

  // sleep(1); // 1s pause between iterations  
}

//Prometheus:

//cd "C:\Users\finwo\Prometheus"
//.\prometheus.exe --config.file=prometheus.yml --web.listen-address=":9090" --storage.tsdb.path="C:\Users\finwo\Prometheus"
//http://localhost:9090/query

//K6:

//cd "C:\Users\finwo\Documents\Schoolwerk\Semester7\IP\Code\Moodify\Services\MoodifyK6Tests"
//k6 cloud run --local-execution LoadTest.js
