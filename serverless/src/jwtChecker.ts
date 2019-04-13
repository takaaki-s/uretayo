import axios from "axios";
import * as jose from "node-jose";

const issuer = `https://cognito-idp.${process.env.REGION}.amazonaws.com/${
  process.env.USER_POOL_ID
}`;

interface IJwtClaims {
    sub: string;
    aud: string;
    event_id: string;
    token_use: string;
    auth_time: string;
    iss: string;
    "cognito:username": string;
    exp: number;
    iat: number;
}

const isValidJwt = async (token: string) => {
  const sections = token.split(".");
  const header = JSON.parse(jose.util.base64url.decode(sections[0]));
  const kid = header.kid;

  const res = await axios.get(issuer + "/.well-known/jwks.json");
  const keys = res.data.keys;
  let keyIndex = -1;
  for (let i = 0; i < keys.length; i++) {
    if (kid === keys[i].kid) {
      keyIndex = i;
      break;
    }
  }

  if (keyIndex === -1) {
    throw Error("Public key not found in jwks.json");
  }

  const keyResult = await jose.JWK.asKey(keys[keyIndex]);
  const result = await (await jose.JWS.createVerify(keyResult)).verify(token);
  const claims: IJwtClaims = JSON.parse(result.payload.toString());
  const currentTs = Math.floor(Number(new Date()) / 1000);
  if (currentTs > claims.exp) {
    throw Error("Token is expired");
  }

  if (claims.aud !== process.env.APP_CLIENT_ID) {
    throw Error("Token was not issued for this audience");
  }

  if (claims.iss !== issuer) {
    throw Error("Token was not issued for this issuer");
  }

  return claims;
};

export default isValidJwt;
