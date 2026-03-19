import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();
  const returnTo = new URLSearchParams(window.location.search).get('returnTo') ?? '/';

  return <button onClick={() => loginWithRedirect({ appState: { returnTo } })}>Log In</button>;
};

export default LoginButton;