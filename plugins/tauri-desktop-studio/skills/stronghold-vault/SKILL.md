---
name: Stronghold Vault
description: Use when the user asks about tauri-plugin-stronghold, encrypted secret vaults, password-derived keys, Argon2, or persistent secret storage in Tauri apps.
version: 0.1.0
---

# Stronghold (Encrypted Vault)

`tauri-plugin-stronghold` wraps IOTA Stronghold — an encrypted at-rest secret store. Use it for **app-managed** secrets (signing keys, refresh tokens you don't want in OS keychain, derived material).

For **user OS credentials** (e.g. SSO tokens), prefer the `keyring` crate which uses Windows Credential Manager / macOS Keychain / Secret Service.

## Setup

```toml
# Cargo.toml
[dependencies]
tauri-plugin-stronghold = "2"
argon2 = "0.5"
```

```rust
// lib.rs
use tauri_plugin_stronghold::Builder as StrongholdBuilder;

fn main() {
    tauri::Builder::default()
        .plugin(
            StrongholdBuilder::new(|password| {
                let salt = b"tauri-stronghold-salt-v1";
                let mut output = [0u8; 32];
                argon2::Argon2::default()
                    .hash_password_into(password.as_ref(), salt, &mut output)
                    .expect("argon2");
                output.to_vec()
            })
            .build()
        )
        // ...
}
```

## Renderer usage

```typescript
import { Client, Stronghold } from '@tauri-apps/plugin-stronghold';
import { appDataDir } from '@tauri-apps/api/path';

async function openVault(password: string) {
  const vaultPath = `${await appDataDir()}/vault.hold`;
  const stronghold = await Stronghold.load(vaultPath, password);
  let client: Client;
  try {
    client = await stronghold.loadClient('main');
  } catch {
    client = await stronghold.createClient('main');
  }
  return { stronghold, client };
}

async function setItem(client: Client, key: string, value: string) {
  const store = client.getStore();
  await store.insert(key, Array.from(new TextEncoder().encode(value)));
}

async function getItem(client: Client, key: string): Promise<string | null> {
  const store = client.getStore();
  const data = await store.get(key);
  return data ? new TextDecoder().decode(new Uint8Array(data)) : null;
}

// Persist after writes:
await stronghold.save();
```

## Capability

```json
{ "permissions": ["stronghold:default"] }
```
Tighter scope: `stronghold:allow-load`, `stronghold:allow-create-client`, `stronghold:allow-save`, `stronghold:allow-execute-procedure`.

## Argon2 parameters

Default `Argon2::default()` uses safe parameters (m=19456 KiB, t=2, p=1). For higher-value vaults, increase memory:
```rust
let params = argon2::Params::new(64 * 1024, 3, 4, Some(32)).unwrap();
let argon2 = argon2::Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);
```

## Pitfalls

- **Forgetting `stronghold.save()`**: writes are in-memory until saved.
- **Reusing the salt across apps**: namespace it (`<app-id>-stronghold-salt-v1`).
- **Password prompt UX**: cache the unlocked client in app state for the session.
- **Backup story**: Stronghold files are platform-specific. Design so the vault is rebuildable.
