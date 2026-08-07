const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const tracksDir = path.join(root, 'tracks');
const coversDir = path.join(root, 'covers');
const outputPath = path.join(root, 'tracks.json');
const coverExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.tiff'];

function formatSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function urlPath(...segments) {
  return segments.join('/');
}

function findCover(baseName, title) {
  const coverFileNames = fs.readdirSync(coversDir);
  const matchingCover = coverFileNames.find((fileName) => {
    const extension = path.extname(fileName).toLowerCase();
    return path.basename(fileName, path.extname(fileName)) === baseName
      && coverExtensions.includes(extension);
  });

  if (matchingCover) return urlPath('covers', matchingCover);

  const generatedCover = path.join(coversDir, 'generated', `${title}.svg`);
  return fs.existsSync(generatedCover)
    ? urlPath('covers', 'generated', `${title}.svg`)
    : 'covers/default.jpeg';
}

function trackFromFile(fileName) {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);
  const parts = baseName.split('_');

  if (parts.length < 4 || !/^Модуль\d+$/iu.test(parts[2])) {
    throw new Error(
      `Неверное имя файла «${fileName}». Используйте формат: Фамилия_Имя_МодульN_Название.mp3`,
    );
  }

  const [lastName, firstName, moduleFileName, ...titleParts] = parts;
  const module = moduleFileName.replace(/^Модуль(\d+)$/iu, 'Модуль $1');
  const title = titleParts.join('_');
  const cover = findCover(baseName, title);

  return {
    file: urlPath('tracks', fileName),
    student: `${lastName} ${firstName}`,
    module,
    title,
    cover,
    size: formatSize(fs.statSync(path.join(tracksDir, fileName)).size),
  };
}

const files = fs.readdirSync(tracksDir)
  .filter((fileName) => path.extname(fileName).toLowerCase() === '.mp3')
  .sort((a, b) => a.localeCompare(b, 'ru'));

const tracks = files.map(trackFromFile);
fs.writeFileSync(outputPath, `${JSON.stringify(tracks, null, 2)}\n`, 'utf8');
console.log(`Обновлён tracks.json: ${tracks.length} треков.`);
