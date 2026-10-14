import glob from 'glob';
import path from 'path';

const pages = glob.sync('pages/*.html')

const arrayKeyValuePairs = pages.map(file => [path.basename(file, '.html'), file])

export const config = Object.fromEntries(arrayKeyValuePairs)

