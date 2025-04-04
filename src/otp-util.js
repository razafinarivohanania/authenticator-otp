const OTPAlgorithm = require("./otp-algorithm");

function getOTPAlgorithmSpec(otpAlgorithm) {
  switch (otpAlgorithm) {
    case OTPAlgorithm.GOST3411_2012_256:
      return { length: 256 };
    case OTPAlgorithm.GOST3411_2012_512:
      return { length: 512 };
    default:
      return { length: 0 };
  }
}

const OTPUtil = {
  getOTPAlgorithmSpec
};

module.exports = OTPUtil;