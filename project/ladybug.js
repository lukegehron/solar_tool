// Perform a full indoor sky radiant heat exchange.
// Args:
// longwave_mrt: The longwave mean radiant temperature (MRT) expereinced
// as a result of indoor surface temperatures in C.
// diff_horiz_solar: Diffuse horizontal solar irradiance in W/m2.
// dir_normal_solar: Direct normal solar irradiance in W/m2.
// alt: The altitude of the sun in degrees [0-90].
// sky_exposure: A number between 0 and 1 representing the fraction of the
// sky vault in occupant’s view. Default is 1 for a completely glass box.
// fract_exposed: A number between 0 and 1 representing the fraction of
// the body exposed to direct sunlight. Note that this does not include the
// body’s self-shading; only the shading from surroundings.
// Default is 1 for a person standing in an open area.
// floor_reflectance: A number between 0 and 1 the represents the
// reflectance of the floor. Default is for 0.25 which is characteristic
// of outdoor grass or dry bare soil.
// window_transmittance: A number between 0 and 1 that represents the broadband
// solar transmittance of the window through which the sun is coming. Such
// values tend to be slightly less than the SHGC. Values might be as low as
// 0.2 and could be as high as 0.85 for a single pane of glass.
// Default is 0.4 assuming a double pane window with a relatively mild
// low-e coating.
// posture: A text string indicating the posture of the body. Letters must
// be lowercase.  Choose from the following: "standing", "seated", "supine".
// Default is "standing".
// sharp: A number between 0 and 180 representing the solar horizontal
// angle relative to front of person (SHARP). 0 signifies sun that is
// shining directly into the person's face and 180 signifies sun that
// is shining at the person's back. Default is 135, assuming that a person
// typically faces their side or back to the sun to avoid glare.
// body_absorptivity: A number between 0 and 1 representing the average
// shortwave absorptivity of the body (including clothing and skin color).
// Typical clothing values - white: 0.2, khaki: 0.57, black: 0.88
// Typical skin values - white: 0.57, brown: 0.65, black: 0.84
// Default is 0.7 for average (brown) skin and medium clothing.
// body_emissivity: A number between 0 and 1 representing the average
// longwave emissivity of the body.  Default is 0.95, which is almost
// always the case except in rare situations of wearing metallic clothing.
// Returns:
// A dictionary containing results with the following keys
// -    erf : The shortwave effective radiant field (ERF) in W/m2.
// -    dmrt : The MRT delta as a result of shortwave irradiance in C.
// -    mrt: The final MRT expereinced as a result of sky heat exchange in C.

function indoor_sky_heat_exch(longwave_mrt, diff_horiz_solar, dir_normal_solar, alt,
  sky_exposure = 1, fract_exposed = 1, floor_reflectance = 0.25,
  window_transmittance = 0.4, posture = 'seated', sharp = 135,
  body_absorptivity = 0.7, body_emissivity = 0.95) {
  // set defaults using the input parameters

  let fract_efficiency, short_erf, short_mrt_delta;
  if (posture == "seated") {
    fract_efficiency = 0.696;
  } else {
    fract_efficiency = 0.725;
  }

  // calculate the influence of shortwave irradiance
  if (alt >= 0) {
    let s_flux = body_solar_flux_from_parts(diff_horiz_solar, dir_normal_solar,
      alt, sharp, sky_exposure,
      fract_exposed, floor_reflectance, posture)
    s_flux = s_flux * window_transmittance
    short_erf = erf_from_body_solar_flux(s_flux, body_absorptivity, body_emissivity)
    short_mrt_delta = mrt_delta_from_erf(short_erf, fract_efficiency)

  } else {
    short_erf = 0
    short_mrt_delta = 0
  }

  // calculate final MRT
  let sky_adjusted_mrt = longwave_mrt + short_mrt_delta
  let heat_exch_result = {
    'erf': short_erf,
    'dmrt': short_mrt_delta,
    'mrt': sky_adjusted_mrt
  }
  return heat_exch_result
}


// Estimate the total solar flux on human geometry from solar components.
// Args:
//   diff_horiz_solar: Diffuse horizontal solar irradiance in W/m2.
//   dir_normal_solar: Direct normal solar irradiance in W/m2.
//   alt: The altitude of the sun in degrees [0-90].
//   sharp: A number between 0 and 180 representing the solar horizontal
//   angle relative to front of person (SHARP). 0 signifies sun that is
//    shining directly into the person's face and 180 signifies sun that
//    is shining at the person's back. Default is 135, assuming that a person
//    typically faces their side or back to the sun to avoid glare.
//   sky_exposure: A number between 0 and 1 representing the fraction of the
//   sky vault in occupant’s view. Default is 1 for outdoors in an
//    open field.
//   fract_exposed: A number between 0 and 1 representing the fraction of
//    the body exposed to direct sunlight. Note that this does not include the
//    body’s self-shading; only the shading from surroundings.
//   Default is 1 for a person standing in an open area.
//   floor_reflectance: A number between 0 and 1 the represents the
//    reflectance of the floor. Default is for 0.25 which is characteristic
//    of outdoor grass or dry bare soil.
//   posture: A text string indicating the posture of the body. Letters must
//    be lowercase.  Choose from the following: "standing", "seated", "supine".
//   Default is "standing".
function body_solar_flux_from_parts(diff_horiz_solar, dir_normal_solar, altitude,
  sharp = 135, sky_exposure = 1, fract_exposed = 1,
  floor_reflectance = 0.25, posture = 'standing') {
    let fract_efficiency;
  if (posture == "seated") {
    fract_efficiency = 0.696;
  } else {
    fract_efficiency = 0.725;
  }
  let glob_horiz = diff_horiz_solar + (dir_normal_solar * Math.sin(Math.radians(altitude)))

  let dir_solar = body_dir_from_dir_normal(dir_normal_solar, altitude, sharp,
    posture, fract_exposed)
  let diff_solar = body_diff_from_diff_horiz(diff_horiz_solar, sky_exposure, fract_eff)
  let ref_solar = body_ref_from_glob_horiz(glob_horiz, floor_reflectance,
    sky_exposure, fract_eff)
  return dir_solar + diff_solar + ref_solar
}

// Calculate effective radiant field (ERF) from incident solar flux on body in W/m2.
//     Args:
//         solar_flux: A number for the average solar flux over the human body in W/m2.
//         body_absorptivity: A number between 0 and 1 representing the average
//             shortwave absorptivity of the body (including clothing and skin color).
//             Typical clothing values - white: 0.2, khaki: 0.57, black: 0.88
//             Typical skin values - white: 0.57, brown: 0.65, black: 0.84
//             Default is 0.7 for average (brown) skin and medium clothing.
//         body_emissivity: A number between 0 and 1 representing the average
//             longwave emissivity of the body.  Default is 0.95, which is almost
//             always the case except in rare situations of wearing metallic clothing.
    
function erf_from_body_solar_flux(solar_flux, body_absorptivity=0.7, body_emissivity=0.95){
  return solar_flux * (body_absorptivity / body_emissivity)
}
    

// Calculate the mean radiant temperature (MRT) delta as a result of an ERF.
// Args:
//     erf: A number representing the effective radiant field (ERF) on the
//         person in W/m2.
//     fract_efficiency: A number representing the fraction of the body
//         surface exposed to radiation from the environment. This is typically
//         either 0.725 for a standing or supine person or 0.696 for a seated
//         person. Default is 0.725 for a standing person.
//     rad_trans_coeff: A number representing the radiant heat transfer coefficient
//         in (W/m2-K).  Default is 6.012, which is almost always the case.

function mrt_delta_from_erf(erf, fract_efficiency=0.725, rad_trans_coeff=6.012){
  return erf / (fract_efficiency * rad_trans_coeff)
}
   
    
// Estimate the direct solar flux on human geometry from direct horizontal solar.
// Args:
// dir_normal_solar: Direct normal solar irradiance in W/m2.
// altitude: A number between 0 and 90 representing the altitude of the
// sun in degrees.
// sharp: A number between 0 and 180 representing the solar horizontal
// angle relative to front of person (SHARP). 0 signifies sun that is
// shining directly into the person's face and 180 signifies sun that
// is shining at the person's back. Default is 135, assuming that a person
// typically faces their side or back to the sun to avoid glare.
// posture: A text string indicating the posture of the body. Letters must
// be lowercase.  Choose from the following: "standing", "seated", "supine".
// Default is "standing".
// fract_exposed: A number between 0 and 1 representing the fraction of
// the body exposed to direct sunlight. Note that this does not include
// the body’s self-shading; only the shading from surroundings.
// Default is 1 for a person in an open area.

function body_dir_from_dir_normal(dir_normal_solar, altitude, sharp=135,
  posture='standing', fract_exposed=1){
  // try:
  // proj_fac = get_projection_factor(altitude, sharp, posture)
  // except KeyError:
  let proj_fac = get_projection_factor_simple(altitude, sharp, posture)
  return proj_fac * fract_exposed * dir_normal_solar
  }


  // Estimate the diffuse solar flux on human geometry from diffuse horizontal solar.
  // Args:
  //     diff_horiz_solar: Diffuse horizontal solar irradiance in W/m2.
  //     sky_exposure: A number between 0 and 1 representing the fraction of the
  //         sky vault in occupant’s view. Default is 1 for outdoors in an
  //         open field.
  //     fract_efficiency: A number representing the fraction of the body
  //         surface exposed to radiation from the environment. This is typically
  //         either 0.725 for a standing or supine person or 0.696 for a seated
  //         person. Default is 0.725 for a standing person.
  function body_diff_from_diff_horiz(diff_horiz_solar, sky_exposure=1, fract_efficiency=0.725){
    return 0.5 * sky_exposure * fract_efficiency * diff_horiz_solar
  }
  

// Estimate floor-reflected solar flux on human geometry from global horizontal solar.
// Args:
// glob_horiz_solar: Global horizontal solar irradiance in W/m2.
// floor_reflectance: A number between 0 and 1 the represents the
// reflectance of the floor. Default is for 0.25 which is characteristic
// of outdoor grass or dry bare soil.
// sky_exposure: A number between 0 and 1 representing the fraction of the
// sky vault in occupant’s view. Default is 1 for outdoors in an
// open field.
// fract_efficiency: A number representing the fraction of the body
// surface exposed to radiation from the environment. This is typically
// either 0.725 for a standing or supine person or 0.696 for a seated
// person. Default is 0.725 for a standing person.
  function body_ref_from_glob_horiz(glob_horiz_solar, floor_reflectance=0.25,
    sky_exposure=1, fract_efficiency=0.725){
      return 0.5 * sky_exposure * fract_efficiency * glob_horiz_solar * floor_reflectance;
    }



// """Get the fraction of body surface area exposed to direct sun using a simpler method.
// This is effectively Ap / Ad in the original Solarcal equations.
// This is a more portable version of the get_projection_area() function
// since it does not rely on the large matrix of projection factors
// stored externally in csv files. However, it is less precise since it
// effectively interpolates over the missing parts of the matrix. So this is
// only recommended for cases where such csv files are missing.
// Args:
//     altitude: A number between 0 and 90 representing the altitude of the
//         sun in degrees.
//     sharp: A number between 0 and 180 representing the solar horizontal
//         angle relative to front of person (SHARP). Default is 135, assuming
//         a person typically faces their side or back to the sun to avoid glare.
//     posture: A text string indicating the posture of the body. Letters must
//         be lowercase.  Choose from the following: "standing", "seated", "supine".
//         Default is "standing".
// """

function get_projection_factor_simple(altitude, sharp = 135, posture = 'standing') {

  if (posture == 'supine') {
    altitude  = transpose_altitude(altitude, sharp)
    sharp = transpose_azimuth(altitude, sharp)
    posture = 'standing'
  }


  if (posture == 'standing') {
    ap_table = ((0.254, 0.254, 0.228, 0.187, 0.149, 0.104, 0.059),
      (0.248, 0.248, 0.225, 0.183, 0.145, 0.102, 0.059),
      (0.239, 0.239, 0.218, 0.177, 0.138, 0.096, 0.059),
      (0.225, 0.225, 0.199, 0.165, 0.127, 0.09, 0.059),
      (0.205, 0.205, 0.182, 0.151, 0.116, 0.083, 0.059),
      (0.183, 0.183, 0.165, 0.136, 0.109, 0.078, 0.059),
      (0.167, 0.167, 0.155, 0.131, 0.107, 0.078, 0.059),
      (0.175, 0.175, 0.161, 0.131, 0.111, 0.081, 0.059),
      (0.199, 0.199, 0.178, 0.147, 0.12, 0.084, 0.059),
      (0.22, 0.22, 0.196, 0.16, 0.126, 0.088, 0.059),
      (0.238, 0.238, 0.21, 0.17, 0.133, 0.091, 0.059),
      (0.249, 0.249, 0.22, 0.177, 0.138, 0.093, 0.059),
      (0.252, 0.252, 0.223, 0.178, 0.138, 0.093, 0.059))
  } else if (posture == 'seated') {
    ap_table = ((0.202, 0.226, 0.212, 0.211, 0.182, 0.156, 0.123),
      (0.203, 0.228, 0.205, 0.2, 0.187, 0.158, 0.123),
      (0.2, 0.231, 0.207, 0.202, 0.184, 0.155, 0.123),
      (0.191, 0.227, 0.205, 0.201, 0.175, 0.149, 0.123),
      (0.177, 0.214, 0.195, 0.192, 0.168, 0.141, 0.123),
      (0.16, 0.196, 0.182, 0.181, 0.162, 0.134, 0.123),
      (0.15, 0.181, 0.173, 0.17, 0.153, 0.129, 0.123),
      (0.163, 0.18, 0.164, 0.158, 0.145, 0.125, 0.123),
      (0.182, 0.181, 0.156, 0.145, 0.136, 0.122, 0.123),
      (0.195, 0.181, 0.146, 0.134, 0.128, 0.118, 0.123),
      (0.207, 0.178, 0.135, 0.121, 0.117, 0.117, 0.123),
      (0.213, 0.174, 0.125, 0.109, 0.109, 0.116, 0.123),
      (0.209, 0.167, 0.117, 0.106, 0.106, 0.114, 0.123))
  }

}


// """Transpose altitude and azimuth.
    // This is necessary for getting correct projection factors for a supine posture
    // from the standing posture matrix.
    // """
function transpose_azimuth(altitude, azimuth){
    let alt_temp = altitude
    altitude = abs(90 - azimuth)
    azimuth = alt_temp
    return azimuth
}

function transpose_altitude(altitude, azimuth){
  let alt_temp = altitude
  altitude = abs(90 - azimuth)
  azimuth = alt_temp
  return altitude
}

