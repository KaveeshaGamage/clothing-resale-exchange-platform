const { TextDecoder, TextEncoder } = require("util");

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

require("@testing-library/jest-dom");
