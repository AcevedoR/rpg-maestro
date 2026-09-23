import { useEffect, useState } from 'react';
import { VoiceInterpretationConfig } from '@rpg-maestro/rpg-maestro-api-contract';
import { getClientConfig } from '../../maestro-api';

/**
 * Reads, once, what the server says its voice interpreter is.
 *
 * Null while in flight and null on failure — the caller treats both as "say nothing". The
 * config only decorates a tooltip, so it is never worth a spinner or an error toast.
 */
export function useInterpretationConfig(enabled = true): VoiceInterpretationConfig | null {
  const [config, setConfig] = useState<VoiceInterpretationConfig | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    getClientConfig()
      .then((clientConfig) => {
        if (!cancelled) {
          setConfig(clientConfig?.voiceInterpretation ?? null);
        }
      })
      .catch(() => {
        // getClientConfig already swallows and logs; this is belt and braces.
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return config;
}
