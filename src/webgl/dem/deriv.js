function getUniforms(opts = {}) {
  const { imageColormap } = opts;

  if (!imageColormap) {
    return;
  }

  return {
    bitmapTexture_colormap: imageColormap,
  };
}

const fs = `\
uniform sampler2D bitmapTexture_terrain;
uniform float rScaler;
uniform float bScaler;
uniform float gScaler;
uniform float offset;
uniform vec2 imageDimensions;

// Convert RGB-encoded elevation value to meters
// Note: a _sampler_ must be provided, since you're fetching _neighboring_
// texture values
float getElevation(sampler2D texture, vec2 coord) {
  vec4 data = texture2D(texture, coord);
  return (data.r * rScaler) + (data.g * gScaler) + (data.b * bScaler) + offset;
}


// Modified from
// https://github.com/mapbox/mapbox-gl-js/blob/master/src/shaders/hillshade_prepare.fragment.glsl
vec2 compute_deriv(sampler2D terrain) {
  vec2 epsilon = 1.0 / imageDimensions;

  // queried pixels:
  // +-----------+
  // |   |   |   |
  // | a | b | c |
  // |   |   |   |
  // +-----------+
  // |   |   |   |
  // | d | e | f |
  // |   |   |   |
  // +-----------+
  // |   |   |   |
  // | g | h | i |
  // |   |   |   |
  // +-----------+

  float a = getElevation(terrain, v_pos + vec2(-epsilon.x, -epsilon.y));
  float b = getElevation(terrain, v_pos + vec2(0, -epsilon.y));
  float c = getElevation(terrain, v_pos + vec2(epsilon.x, -epsilon.y));
  float d = getElevation(terrain, v_pos + vec2(-epsilon.x, 0));
  // Never used
  // float e = getElevation(terrain, v_pos);
  float f = getElevation(terrain, v_pos + vec2(epsilon.x, 0));
  float g = getElevation(terrain, v_pos + vec2(-epsilon.x, epsilon.y));
  float h = getElevation(terrain, v_pos + vec2(0, epsilon.y));
  float i = getElevation(terrain, v_pos + vec2(epsilon.x, epsilon.y));

  // here we divide the x and y slopes by 8 * pixel size
  // where pixel size (aka meters/pixel) is:
  // circumference of the world / (pixels per tile * number of tiles)
  // which is equivalent to: 8 * 40075016.6855785 / (512 * pow(2, u_zoom))
  // which can be reduced to: pow(2, 19.25619978527 - u_zoom)
  // we want to vertically exaggerate the hillshading though, because otherwise
  // it is barely noticeable at low zooms. to do this, we multiply this by some
  // scale factor pow(2, (u_zoom - u_maxzoom) * a) where a is an arbitrary value
  // Here we use a=0.3 which works out to the expression below. see 
  // nickidlugash's awesome breakdown for more info
  // https://github.com/mapbox/mapbox-gl-js/pull/5286#discussion_r148419556
  float exaggeration = u_zoom < 2.0 ? 0.4 : u_zoom < 4.5 ? 0.35 : 0.3;

  // TODO: update to remove exaggeration
  vec2 deriv = vec2(
      (c + f + f + i) - (a + d + d + g),
      (g + h + h + i) - (a + b + b + c)
  ) /  pow(2.0, (u_zoom - u_maxzoom) * exaggeration + 19.2562 - u_zoom);
  return deriv;
}
`;

export default {
  name: "terrain-deriv",
  fs,
  getUniforms,
  inject: {
    "fs:DECKGL_CREATE_COLOR": `
    image = vec4(compute_deriv(bitmapTexture_terrain), 1.0, 1.0);
    `,
  },
};
