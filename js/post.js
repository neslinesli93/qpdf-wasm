Object.assign(FS, {
  ["init"]: FS.init,
  ["mkdir"]: FS.mkdir,
  ["mount"]: FS.mount,
  ["unlink"]: FS.unlink,
  ["unmount"]: FS.unmount,
  ["chdir"]: FS.chdir,
  ["writeFile"]: FS.writeFile,
  ["readFile"]: FS.readFile,
  ["createLazyFile"]: FS.createLazyFile,
  ["setIgnorePermissions"]: function (val) {
    FS.ignorePermissions = val;
  },
});
