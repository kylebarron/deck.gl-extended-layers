function getUniforms(opts = {}) {
  const {imageMask} = opts;

  if (!imageMask) {
    return;
  }

  return {
    bitmapTexture_mask: imageMask,
  };
}

const fs = `\
uniform sampler2D bitmapTexture_mask;
`;

export default {
  name: 'mask-image',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    float mask = float(texture2D(bitmapTexture_mask, coord).a);
    image = vec4(image.rgb, image.a * mask);
    `,
  },
};
