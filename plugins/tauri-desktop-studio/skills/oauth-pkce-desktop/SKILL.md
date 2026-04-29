---
name: OAuth PKCE for Desktop
description: Use when the user asks about OAuth 2.0 in a desktop app, PKCE flow, loopback redirect, system browser auth, or token refresh in Tauri/Rust.
version: 0.1.0
---

# OAuth PKCE in a Tauri Desktop App

Desktop apps can't safely use the implicit flow or store a client secret. The right pattern is **Authorization Code + PKCE** with a loopback redirect:

```
User clicks "Sign in"
   ↓
Rust generates code_verifier (43-128 random chars), derives code_challenge = base64url(sha256(verifier))
   ↓
Rust starts an ephemeral HTTP listener on 127.0.0.1:<random_port>
   ↓
Rust opens system browser (via `webbrowser` crate) to:
   https://idp/oauth/authorize?response_type=code&client_id=...
     &redirect_uri=http://127.0.0.1:<port>/callback
     &code_challenge=<challenge>&code_challenge_method=S256
     &state=<random>&scope=...
   ↓
User authenticates in the browser
   ↓
IdP redirects to http://127.0.0.1:<port>/callback?code=...&state=...
   ↓
Rust handler validates state, exchanges code+verifier at /token endpoint
   ↓
Tokens go to OS keychain via `keyring`
```

## Crates

```toml
[dependencies]
oauth2 = "4"
webbrowser = "1"
keyring = "3"
sha2 = "0.10"
base64 = "0.22"
urlencoding = "2"
tokio = { version = "1", features = ["full"] }
hyper = { version = "1", features = ["server"] }
```

## Implementation sketch

```rust
use oauth2::{
    AuthUrl, ClientId, CsrfToken, PkceCodeChallenge, RedirectUrl, Scope, TokenUrl,
    basic::BasicClient, AuthorizationCode, TokenResponse, reqwest::async_http_client,
};
use std::net::TcpListener;

#[tauri::command]
pub async fn sign_in() -> Result<String, String> {
    // Pick a free loopback port.
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().unwrap().port();
    drop(listener);  // free the port; we'll re-bind below.

    let client = BasicClient::new(
        ClientId::new("YOUR_CLIENT_ID".into()),
        None,                                                       // no secret
        AuthUrl::new("https://idp/oauth/authorize".into()).unwrap(),
        Some(TokenUrl::new("https://idp/oauth/token".into()).unwrap()),
    )
    .set_redirect_uri(RedirectUrl::new(format!("http://127.0.0.1:{port}/callback")).unwrap());

    let (challenge, verifier) = PkceCodeChallenge::new_random_sha256();
    let (auth_url, csrf) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("openid".into()))
        .add_scope(Scope::new("offline_access".into()))
        .set_pkce_challenge(challenge)
        .url();

    webbrowser::open(auth_url.as_str()).map_err(|e| e.to_string())?;

    // Run a one-shot loopback server that captures ?code=...&state=...
    let (code, returned_state) = wait_for_callback(port).await?;
    if returned_state != *csrf.secret() {
        return Err("CSRF mismatch".into());
    }

    let token = client
        .exchange_code(AuthorizationCode::new(code))
        .set_pkce_verifier(verifier)
        .request_async(async_http_client)
        .await
        .map_err(|e| e.to_string())?;

    let entry = keyring::Entry::new("co.lobbi.discovery", "refresh_token")
        .map_err(|e| e.to_string())?;
    entry.set_password(token.refresh_token().unwrap().secret())
        .map_err(|e| e.to_string())?;

    Ok(token.access_token().secret().clone())
}
```

`wait_for_callback` runs a minimal `hyper` server listening on the chosen port; first request to `/callback` parses the query string, returns a tiny "You can close this tab" HTML, then shuts down.

## Token refresh

Refresh tokens stay in keyring. Access tokens stay in memory only. On 401, refresh:
```rust
let stored = keyring::Entry::new("co.lobbi.discovery", "refresh_token")?
    .get_password()?;
let refreshed = client
    .exchange_refresh_token(&oauth2::RefreshToken::new(stored))
    .request_async(async_http_client)
    .await?;
```

## Pitfalls

- **Don't allow `localhost` (DNS) redirects.** Always `127.0.0.1` — DNS-based loopback is rejected by some IdPs and is a phishing vector.
- **Random state is not optional.** Must verify it on callback.
- **Single-use port.** Bind, accept once, drop. Don't keep the listener around — long-lived loopback servers are an attack surface.
- **Don't store refresh tokens in localStorage.** Always OS keychain via `keyring`.
- **iOS/Android**: Tauri 2.x supports mobile, but use `ASWebAuthenticationSession` / Custom Tabs there, not loopback.
