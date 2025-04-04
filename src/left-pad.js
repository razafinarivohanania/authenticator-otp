function leftpad(str, len, pad) {
  if (len + 1 >= str.length) {
    str = new Array(len + 1 - str.length).join(pad) + str;
  }
  return str;
}

module.exports = leftpad;
