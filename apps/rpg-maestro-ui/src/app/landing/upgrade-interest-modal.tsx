import React, { FormEvent, useId, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { CreateUpgradeInterestRequest } from '@rpg-maestro/rpg-maestro-api-contract';
import { getLandingReferrer, getLandingSource, hasCreatedSession } from './landing-attribution';
import { submitUpgradeInterest } from './landing-api';

export interface UpgradeInterestModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeInterestModal({ open, onClose }: UpgradeInterestModalProps) {
  const emailInputId = useId();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(false);
    try {
      await submitUpgradeInterest(
        new CreateUpgradeInterestRequest(
          email,
          getLandingSource(),
          getLandingReferrer(),
          hasCreatedSession(),
          website || undefined
        )
      );
      setReserved(true);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Maestro opens soon</DialogTitle>
      <DialogContent>
        {reserved ? (
          <p className="landing-upgrade-success" role="status">
            Founding price reserved — we'll email you when Maestro opens.
          </p>
        ) : (
          <>
            <p style={{ marginTop: 0 }}>
              The first <strong>50 GMs</strong> keep <strong>$3/month forever</strong>. Leave your email to reserve the
              founding price.
            </p>
            <form className="landing-email-form" onSubmit={onSubmit}>
              <label className="landing-visually-hidden" htmlFor={emailInputId}>
                Email
              </label>
              <input
                id={emailInputId}
                className="landing-email-input"
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <input
                className="landing-honeypot"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
              <button className="landing-cta-button" type="submit" disabled={submitting}>
                Reserve founding price
              </button>
            </form>
            {submitError && (
              <p className="landing-form-error" role="alert">
                Could not save your email, please retry (or come say hi on Discord instead).
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
