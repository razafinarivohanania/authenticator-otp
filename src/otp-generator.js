const { gostEngine } = require("node-gost-crypto");
const CryptoJS = require("crypto-js");
const OTPType = require("./otp-type");
const base32tohex = require("./base-32-to-hex");
const OTPAlgorithm = require("./otp-algorithm");
const OTPUtil = require("./otp-util");
const leftpad = require("./left-pad");

function base26(num) {
  const chars = "23456789BCDFGHJKMNPQRTVWXY";
  let output = "";
  const len = 5;
  for (let i = 0; i < len; i++) {
    output += chars[num % chars.length];
    num = Math.floor(num / chars.length);
  }
  if (output.length < len) {
    output = new Array(len - output.length + 1).join(chars[0]) + output;
  }
  return output;
}

function hex2dec(s) {
  return Number(`0x${s}`);
}

function dec2hex(s) {
  return (s < 15.5 ? "0" : "") + Math.round(s).toString(16);
}

function cryptoJsWordArrayToUint8Array(wordArray) {
  const l = wordArray.sigBytes;
  const words = wordArray.words;
  const result = new Uint8Array(l);
  let i = 0 /*dst*/,
    j = 0; /*src*/
  while (i < l) {
    // here i is a multiple of 4
    const w = words[j++];
    result[i++] = (w & 0xff000000) >>> 24;
    if (i === l) break;
    result[i++] = (w & 0x00ff0000) >>> 16;
    if (i === l) break;
    result[i++] = (w & 0x0000ff00) >>> 8;
    if (i === l) break;
    result[i++] = w & 0x000000ff;
  }
  return result;
}

function generate({
  type,
  secret,
  counter,
  period,
  len,
  algorithm,
  clockOffset,
}) {
  secret = secret.replace(/\s/g, "");
  if (!len) {
    len = 6;
  }
  let b26 = false;
  let key;
  switch (type) {
    case OTPType.totp:
    case OTPType.hotp:
      key = base32tohex(secret);
      break;
    case OTPType.hex:
    case OTPType.hhex:
      key = secret;
      break;
    case OTPType.battle:
      key = base32tohex(secret);
      len = 8;
      break;
    case OTPType.steam:
      key = base32tohex(secret);
      len = 10;
      b26 = true;
      break;
    default:
      key = base32tohex(secret);
  }

  if (!key) {
    throw new Error("Invalid secret key");
  }

  if (type !== OTPType.hotp && type !== OTPType.hhex) {
    let epoch = Math.round(new Date().getTime() / 1000.0);
    if (clockOffset) {
      epoch = epoch + Number(clockOffset);
    }
    counter = Math.floor(epoch / period);
  }

  const time = leftpad(dec2hex(counter), 16, "0");

  if (key.length % 2 === 1) {
    if (key.substr(-1) === "0") {
      key = key.substr(0, key.length - 1);
    } else {
      key += "0";
    }
  }

  let hmacObj = null;

  switch (algorithm) {
    case OTPAlgorithm.SHA256:
      hmacObj = CryptoJS.HmacSHA256(
        CryptoJS.enc.Hex.parse(time),
        CryptoJS.enc.Hex.parse(key)
      );
      break;
    case OTPAlgorithm.SHA512:
      hmacObj = CryptoJS.HmacSHA512(
        CryptoJS.enc.Hex.parse(time),
        CryptoJS.enc.Hex.parse(key)
      );
      break;
    case OTPAlgorithm.GOST3411_2012_256:
    case OTPAlgorithm.GOST3411_2012_512:
      const alg = {
        mode: "HMAC",
        name: "GOST R 34.11",
        version: 2012,
        length: OTPUtil.getOTPAlgorithmSpec(algorithm).length,
      };
      const gostCipher = gostEngine.getGostDigest(alg);
      hmacObj = CryptoJS.lib.WordArray.create(
        gostCipher.sign(
          cryptoJsWordArrayToUint8Array(CryptoJS.enc.Hex.parse(key)),
          cryptoJsWordArrayToUint8Array(CryptoJS.enc.Hex.parse(time))
        )
      );
      break;
    default:
      hmacObj = CryptoJS.HmacSHA1(
        CryptoJS.enc.Hex.parse(time),
        CryptoJS.enc.Hex.parse(key)
      );
      break;
  }

  const hmac = CryptoJS.enc.Hex.stringify(hmacObj);

  const offset = hex2dec(hmac.substring(hmac.length - 1));

  let otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec("7fffffff")) + "";

  if (b26) {
    return base26(Number(otp));
  }

  if (otp.length < len) {
    otp = new Array(len - otp.length + 1).join("0") + otp;
  }
  return otp.substr(otp.length - len, len).toString();
}

module.exports = generate;
