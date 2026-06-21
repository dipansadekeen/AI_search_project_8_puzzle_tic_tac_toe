// Image upload -> center square crop -> slice into a 3x3 grid of tile images.
// Produces 9 data URLs indexed by goal position (piece i belongs at index i
// when solved). Tile value v therefore renders pieces[v-1]; the blank (0) has
// no image. Works fully offline via FileReader + canvas.
(function () {
  // Returns a Promise resolving to an array of 9 data-URL strings.
  Lab.moduleA.sliceImage = function (file, gridSize) {
    var G = gridSize || 3;
    return new Promise(function (resolve, reject) {
      if (!file) { reject(new Error('No file provided')); return; }
      var ok = /image\/(png|jpe?g|webp|gif|bmp)/i.test(file.type);
      if (!ok) { reject(new Error('Please choose a .png or .jpg image.')); return; }

      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read the file.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('That image could not be loaded.')); };
        img.onload = function () {
          var side = Math.min(img.width, img.height);
          var sx = (img.width - side) / 2;   // center crop
          var sy = (img.height - side) / 2;
          var tile = G === 4 ? 180 : 240;    // output px per tile (smaller for 4×4)
          var pieces = [];
          for (var r = 0; r < G; r++) {
            for (var c = 0; c < G; c++) {
              var canvas = document.createElement('canvas');
              canvas.width = tile; canvas.height = tile;
              var ctx = canvas.getContext('2d');
              ctx.drawImage(
                img,
                sx + (c * side / G), sy + (r * side / G), side / G, side / G,
                0, 0, tile, tile
              );
              pieces.push(canvas.toDataURL('image/png'));
            }
          }
          resolve(pieces);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  };
})();
