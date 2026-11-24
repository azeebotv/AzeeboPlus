import { UnauthorizedException } from '@nestjs/common';

/**
 * A social identity provider whose ID tokens we verify.
 *
 * A valid signature or a successful tokeninfo lookup only proves the provider
 * issued *a* token. The claims decide whether it was issued *by this provider*
 * and *for this app*. Requiring both fields in this type means a new provider
 * cannot be wired up without naming its issuer(s) and our client id.
 */
export interface OidcProvider {
  /** Used in error messages only. */
  readonly name: string;
  /** Every `iss` value the provider puts on its tokens. At least one is required. */
  readonly issuers: readonly [string, ...string[]];
  /** Our client id at this provider. The only acceptable `aud`. */
  readonly clientId: string;
}

/** The claims we read from a token. Untrusted until checked. */
export interface OidcClaims {
  iss?: unknown;
  aud?: unknown;
}

/** Throws unless the token's `iss` is one of the provider's issuers. */
export function assertIssuedBy(claims: OidcClaims, provider: OidcProvider): void {
  if (typeof claims.iss !== 'string' || !provider.issuers.includes(claims.iss)) {
    throw new UnauthorizedException(`${provider.name} token was not issued by ${provider.name}`);
  }
}

/**
 * Throws unless the token's `aud` names our client id. `aud` is a string in
 * practice, but the JWT spec allows an array, so both forms are accepted.
 */
export function assertIssuedFor(claims: OidcClaims, provider: OidcProvider): void {
  const audiences: unknown[] = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(provider.clientId)) {
    throw new UnauthorizedException(`${provider.name} token was issued for a different client`);
  }
}

/**
 * Full ID-token check: issuer first, then audience. Use this for every ID token.
 *
 * Google's tokeninfo does not return `iss` for access tokens. Those callers
 * use {@link assertIssuedFor} alone and must say so at the call site.
 */
export function assertOidcClaims(claims: OidcClaims, provider: OidcProvider): void {
  assertIssuedBy(claims, provider);
  assertIssuedFor(claims, provider);
}
