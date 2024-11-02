import { displayError } from '../error-utils';
import { TrackToPlay } from '@rpg-maestro/rpg-maestro-api-contract';

const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL;// TODO centralize

export const setTrackToPlay = async (trackToPlay: TrackToPlay): Promise<void> => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/admin/sessions/current/tracks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackToPlay),
    });
    if (!response.ok) {
      console.log(response.status, response.statusText);
      console.debug(response);
      throw new Error('fetch failed for error: ' + response);
    }
  } catch (error) {
    console.error(error);
    displayError(`Fetch error: ${error}`);
  }
};
