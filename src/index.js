

const env = require("./env");
const generate = require("./otp-generator");

const parameters = env.getGenerationParameters();
parameters.clockOffset = null
console.log(parameters);
console.log(generate(parameters));