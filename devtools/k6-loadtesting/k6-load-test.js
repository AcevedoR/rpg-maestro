import http from 'k6/http';

export const options = {
  vus: 1,
  duration: '100s',
};

export default function () {
  const url = 'https://fourgate.cloud/api/maestro/sessions/I7tyU8i/playing-tracks';

  const payload = JSON.stringify({
    currentTrack: {
      trackId: '4c3a9e9c-7114-4336-91f6-807aceeb9330',
      startTime: 1203650.1330000001,
      paused: true,
    },
  });

  const headers = {
    'accept': '*/*',
    'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'content-type': 'application/json',
    'cookie': 'CF_AppSession=XXXX_toreplace_XXXX; CF_Authorization=XXXX_toreplace_XXXX',
    'origin': 'https://fourgate.cloud',
    'priority': 'u=1, i',
    'referer': 'https://fourgate.cloud/maestro/I7tyU8i',
    'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    'x-requested-with': 'XMLHttpRequest',
  };

  const res= http.put(url, payload, { headers });
  // console.log(`Status: ${res.status}`);
  // console.log(`Body: ${res.body}`);
}