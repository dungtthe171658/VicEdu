// src/utils/cf-sign.ts
import crypto from "crypto";

export function signCloudFrontURL(opts: {
  url: string;              // https://dxxx.cloudfront.net/hls/lessonId/index.m3u8
  keyPairId: string;        // CLOUDFRONT_KEY_PAIR_ID
  privateKeyPem: string;    // PEM string
  expiresInSec?: number;    // 1800 = 30 phút
}) {
  const expires = Math.floor(Date.now() / 1000) + (opts.expiresInSec ?? 1800);
  const policy = JSON.stringify({
    Statement: [{
      Resource: opts.url,
      Condition: { DateLessThan: { "AWS:EpochTime": expires } }
    }]
  });
  const policyB64 = Buffer.from(policy).toString("base64").replace(/\+/g, "-").replace(/=/g, "_").replace(/\//g, "~");
  const signer = crypto.createSign("RSA-SHA1");
  signer.update(policy);
  const signature = signer.sign(opts.privateKeyPem, "base64").replace(/\+/g, "-").replace(/=/g, "_").replace(/\//g, "~");

  const signedUrl =
    `${opts.url}?Policy=${policyB64}&Signature=${signature}&Key-Pair-Id=${opts.keyPairId}`;
  return { signedUrl, expires };
}
