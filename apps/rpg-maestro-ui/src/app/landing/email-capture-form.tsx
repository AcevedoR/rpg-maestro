import React, { FormEvent, useId, useState } from 'react';
import { CreateBetaSignupRequest } from '@rpg-maestro/rpg-maestro-api-contract';
import { toastError } from '../ui-components/toast-popup';
import { getLandingReferrer, getLandingSource, submitBetaSignup } from './landing-api';

export interface EmailCaptureFormProps {
  signedUp: boolean;
  onSignedUp: () => void;
}

export function EmailCaptureForm({ signedUp, onSignedUp }: EmailCaptureFormProps) {
  const emailInputId = useId();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (signedUp) {
    return (
      <p className="landing-signup-success" role="status">
        You're on the list! We'll email you when your seat at the table opens.
      </p>
    );
  }

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await submitBetaSignup(
        new CreateBetaSignupRequest(email, getLandingSource(), getLandingReferrer(), website || undefined)
      );
      onSignedUp();
    } catch (_error) {
      toastError('Could not sign you up, please retry (or come say hi on Discord instead)', 10000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
        Get early access →
      </button>
    </form>
  );
}
