import crypto from "crypto";

const PII_SENSITIVE_FIELD_NAMES = ["email", "family_name", "given_name", "password"];
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC5J+hsNqAySgRRPaV76jTaOp2Dj17MobcOHbOTan8ztownevMk0Matr+w7M/NYB6UEIP5tgaAfQcoIPPGMzKWDjRCwSZgVy/BVYn/cAFnUXbqUt/Ej4x+ZOUyb3Csf17tSsVQBa5FrzIyqtelYXBPi4Xo3+XGK7devVpOJuzCJ+wIDAQAB
-----END PUBLIC KEY-----`;

export const handler = async (event: any): Promise<any> => {
  console.log(JSON.stringify(event));
  const request = event.Records[0].cf.request;

  if (request.uri === "/signup") {
    const decodedBase64 = Buffer.from(request.body.data, "base64").toString("utf8");
    const payload = JSON.parse(decodedBase64);
    PII_SENSITIVE_FIELD_NAMES.forEach(prop => {
      if (payload.hasOwnProperty(prop)) {
        payload[prop] = hash(payload[prop]);
      }
    });

    request.body.action = "replace";
    request.body.data = Buffer.from(JSON.stringify(payload)).toString("base64");
  }

  return request;
};

function hash(input: string): string {
  return crypto
    .publicEncrypt({
      key: PUBLIC_KEY,
    }, Buffer.from(input))
    .toString("base64");
}