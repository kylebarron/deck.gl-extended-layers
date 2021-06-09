function getUniforms(opts = {}) {
  const { imageTerrain, rScaler, bScaler, gScaler, offset } = opts;
  if (!imageTerrain) {
    return;
  }

  return {
    bitmapTexture_terrain: imageTerrain,
    rScaler,
    bScaler,
    gScaler,
    offset,
  };
}

const fs = `\
uniform sampler2D bitmapTexture_terrain;
uniform float rScaler;
uniform float bScaler;
uniform float gScaler;
uniform float offset;

float decode_slope(vec4 image, float rScaler, float bScaler, float gScaler, float offset) {
  return (image.r * rScaler) + (image.g * gScaler) + (image.b * bScaler) + offset;
}
`;

export default {
  name: "decode-terrain-rgb",
  fs,
  getUniforms,
  inject: {
    "fs:DECKGL_CREATE_COLOR": `
    vec4 image = texture2D(bitmapTexture_terrain, coord);
    image.r = decode_slope(image, rScaler, bScaler, gScaler, offset);
    `,
  },
};
