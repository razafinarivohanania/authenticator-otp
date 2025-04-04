require("dotenv").config();
const OTPType = require("./otp-type");
const OTPAlgorithm = require("./otp-algorithm");

const INTEGER_PATTERN = /^\d+$/;

class Env {
  #algorithm;
  #clockOffset;
  #counter;
  #digits;
  #period;
  #secret;
  #type;

  constructor() {
    this.#algorithm = this.#parseEnum("ALGORITHM", OTPAlgorithm);
    this.#clockOffset = this.#getIntegerValue("CLOCK_OFFSET");
    this.#counter = this.#getIntegerValue("COUNTER");
    this.#digits = this.#getIntegerValue("DIGITS");
    this.#period = this.#getIntegerValue("PERIOD");
    this.#secret = this.#getStringValue("SECRET");
    this.#type = this.#parseEnum("TYPE", OTPType);
  }

  getGenerationParameters() {
    return {
      type: this.#type,
      secret: this.#secret,
      counter: this.#counter,
      period: this.#period,
      len: this.#digits,
      algorithm: this.#algorithm,
      clockOffset: this.#clockOffset,
    };
  }

  #parseEnum(key, enums) {
    const value = this.#getStringValue(key);
    const keys = Object.keys(enums);
    for (const key of keys) {
      if (enums[key] === value) {
        return value;
      }
    }

    throw new Error(`[${key}] with value [${value}] is not supported`);
  }

  #getStringValue(key) {
    const value = process.env[key];
    if (!value) {
      throw new Error(`[${key}] not defined or empty in .env`);
    }

    return value;
  }

  #getIntegerValue(key) {
    const value = this.#getStringValue(key);
    if (INTEGER_PATTERN.test(value)) {
      return +value;
    }

    throw new Error(`[${key}] with value [${value}] is not an integer`);
  }
}

const env = new Env();
module.exports = env;
