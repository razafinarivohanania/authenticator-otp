

const env = require("./env");
const generate = require("./otp-generator");

console.log(generate(env.getGenerationParameters()));