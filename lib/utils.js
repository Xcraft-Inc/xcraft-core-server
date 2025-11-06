'use strict';

const path = require('node:path');
const fse = require('fs-extra');

/* Synchronize directories between the internal packages folder
 * and third folders.
 */
function syncPackagesSymlinks(packagesRoot) {
  const xFs = require('xcraft-core-fs');

  const root = path.join(packagesRoot, '..');
  const packagesDirs = xFs.lsdir(root, /packages[.]/);
  if (!packagesDirs.length) {
    return;
  }

  /* List all packages/ symlinks */
  const symlinks = new Set(
    fse
      .readdirSync(packagesRoot)
      .map((dir) => path.join(packagesRoot, dir))
      .filter((dir) => fse.lstatSync(dir).isSymbolicLink())
      .map((symlink) => path.basename(symlink))
  );

  /* For each packagesDirs, add (if necessary) the symlink in packages/ */
  for (const dir of packagesDirs) {
    const pkgs = xFs.lsdir(path.join(root, dir));
    for (const pkg of pkgs) {
      symlinks.delete(pkg);
      if (fse.existsSync(path.join(root, 'packages', pkg))) {
        continue;
      }
      fse.symlinkSync(
        path.join('..', dir, pkg),
        path.join(packagesRoot, pkg),
        'junction'
      );
    }
  }

  /* Remove dead symlinks from packages */
  for (const symlink of symlinks) {
    fse.removeSync(path.join(packagesRoot, symlink));
  }
}

module.exports = {
  syncPackagesSymlinks,
};
