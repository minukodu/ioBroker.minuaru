// iobroker prettier configuration file
import prettierConfig from '@iobroker/eslint-config/prettier.config.mjs';

export default {
    ...prettierConfig,
    // uncomment next line if you prefer double quotes
    // singleQuote: false,
    // keep line endings of the checkout (CRLF on Windows with core.autocrlf, LF in CI)
    endOfLine: 'auto',
}