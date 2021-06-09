function getUniforms(opts = {}) {
  const { latitude } = opts;

  if (!latitude) {
    return;
  }

  return {
    latitude,
  };
}

const fs = `\
// todo make this a vec2, representing minLat, maxLat, and interpolate linearly
// from pixel height?
uniform float latitude;

#define PI 3.1415926538

float compute_mercator_scale_factor(float latitude) {
  return 1.0 / cos(latitude * PI / 180.);
}

float compute_slope(vec2 deriv, float scaleFactor) {
  // Divide by web mercator latitude scale factor.
  // Computed as cos(latitude in radians)
  float hypot = length(deriv) / scaleFactor;
  return degrees(atan(hypot / 8.0));
}

`;

export default {
  name: "slope",
  fs,
  getUniforms,
  inject: {
    "fs:DECKGL_MUTATE_COLOR": `
    float scaleFactor = compute_mercator_scale_factor(latitude);
    image.r = compute_slope(image.rg, scaleFactor);
    `,
  },
};
