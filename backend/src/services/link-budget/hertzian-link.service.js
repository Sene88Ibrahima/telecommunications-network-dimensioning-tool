/**
 * Hertzian Link Budget Calculator Service
 * Implements formulas for hertzian/microwave link calculations
 */

/**
 * Calculate free space path loss
 * 
 * @param {number} frequency - Frequency in GHz
 * @param {number} distance - Distance in km
 * @returns {number} - Free space path loss in dB
 */
exports.calculateFreeSpaceLoss = (frequency, distance) => {
  // Free space path loss formula:
  // FSPL (dB) = 32.45 + 20log10(f) + 20log10(d)
  // where f is frequency in MHz and d is distance in km
  
  // Convert frequency from GHz to MHz if needed
  const frequencyMHz = frequency * 1000;
  
  const fspl = 32.45 + 20 * Math.log10(frequencyMHz) + 20 * Math.log10(distance);
  
  return parseFloat(fspl.toFixed(2));
};

/**
 * Calculate link margin
 * 
 * @param {number} systemGain - System gain in dB (transmit power + antenna gains)
 * @param {number} receiverThreshold - Receiver threshold/sensitivity in dBm
 * @param {number} totalLosses - Total path and system losses in dB
 * @returns {number} - Link margin in dB
 */
exports.calculateLinkMargin = (systemGain, receiverThreshold, totalLosses) => {
  // Link margin calculation:
  // Margin = System Gain - Receiver Threshold - Total Losses
  // System Gain = Transmit Power + Antenna Gains
  
  const margin = systemGain - Math.abs(receiverThreshold) - totalLosses;
  
  return parseFloat(margin.toFixed(2));
};

/**
 * Calculate link availability based on link margin and rain attenuation
 * 
 * @param {number} linkMargin - Link margin in dB
 * @param {number} frequency - Frequency in GHz
 * @param {number} distance - Distance in km
 * @param {string} rainZone - ITU-R rain zone (A-Q)
 * @returns {Object} - Link availability details
 */
exports.calculateLinkAvailability = (linkMargin, frequency, distance, rainZone) => {
  // Calculate rain attenuation for the given frequency, distance and rain zone
  const rainAttenuation = calculateRainAttenuation(frequency, distance, rainZone);
  
  // Calculate fade margin (link margin minus rain attenuation)
  const fadeMargin = linkMargin - rainAttenuation;
  
  // Calculate availability percentage based on fade margin
  // Using simplified Vigants-Barnett model
  // Unavailability = a * b * 10^(-fadeMargin/10) * distance^3 * frequency^2
  // where a and b are climate and terrain factors
  
  const climateFactor = 4; // Factor for average climate
  const terrainFactor = 1; // Factor for average terrain
  
  const unavailability = climateFactor * terrainFactor * 
                        Math.pow(10, -fadeMargin/10) * 
                        Math.pow(distance, 3) * 
                        Math.pow(frequency, 2) / 1000000;
  
  // Convert unavailability to availability percentage
  const availability = 100 - unavailability;
  
  // Calculate expected downtime in minutes per year
  const minutesPerYear = 365 * 24 * 60;
  const downtimeMinutes = (unavailability / 100) * minutesPerYear;
  
  return {
    availability: parseFloat(availability.toFixed(5)),
    unavailability: parseFloat(unavailability.toFixed(5)),
    rainAttenuation: parseFloat(rainAttenuation.toFixed(2)),
    fadeMargin: parseFloat(fadeMargin.toFixed(2)),
    downtimeMinutes: parseFloat(downtimeMinutes.toFixed(2)),
    rainZone
  };
};

/**
 * Calculate rain attenuation based on ITU-R rain model
 * 
 * @param {number} frequency - Frequency in GHz
 * @param {number} distance - Distance in km
 * @param {string} rainZone - ITU-R rain zone (A-Q)
 * @returns {number} - Rain attenuation in dB
 */
function calculateRainAttenuation(frequency, distance, rainZone) {
  // ITU-R P.837 Rain rates for different rain zones (mm/h)
  const rainRates = {
    'A': 8,
    'B': 12,
    'C': 15,
    'D': 19,
    'E': 22,
    'F': 28,
    'G': 30,
    'H': 32,
    'J': 35,
    'K': 42,
    'L': 60,
    'M': 63,
    'N': 95,
    'P': 145,
    'Q': 115
  };
  
  // Get rain rate for the selected zone
  const rainRate = rainRates[rainZone] || 42; // Default to K if invalid zone
  
  // Calculate specific attenuation γR (dB/km)
  // γR = k * R^α
  // where k and α are frequency-dependent coefficients
  
  // Calculate k and α coefficients based on frequency
  // Simplified approximation of ITU-R P.838
  let k, alpha;
  
  if (frequency < 2.5) {
    k = 0.0000387 * Math.pow(frequency, 0.912);
    alpha = 0.88;
  } else if (frequency < 54) {
    k = 0.0000372 * Math.pow(frequency, 0.913);
    alpha = 1.258 - 0.126 * Math.log(frequency);
  } else {
    k = 0.0000335 * Math.pow(frequency, 0.929);
    alpha = 0.93;
  }
  
  // Calculate specific attenuation
  const specificAttenuation = k * Math.pow(rainRate, alpha);
  
  // Calculate effective path length
  // Using distance reduction factor r
  // r = 1 / (1 + distance/d0)
  // where d0 is a distance factor dependent on rain rate and frequency
  
  const d0 = 35 * Math.exp(-0.015 * rainRate);
  const r = 1 / (1 + distance/d0);
  
  const effectiveDistance = distance * r;
  
  // Calculate total rain attenuation
  const rainAttenuation = specificAttenuation * effectiveDistance;
  
  return rainAttenuation;
};

/**
 * Calculate diffraction loss due to obstacles
 * 
 * @param {number} frequency - Frequency in GHz
 * @param {number} clearance - Clearance over obstacle in meters
 * @param {number} distance - Distance in km
 * @returns {number} - Diffraction loss in dB
 */
exports.calculateDiffractionLoss = (frequency, clearance, distance) => {
  // Calculate Fresnel zone radius
  // r = 17.3 * sqrt(d1*d2/(frequency*d))
  // where d1 and d2 are distances from transmitter and receiver to obstacle
  // Assume obstacle is in the middle for simplification
  const d1 = distance / 2;
  const d2 = distance / 2;
  
  const fresnelRadius = 17.3 * Math.sqrt((d1 * d2) / (frequency * distance));
  
  // Calculate Fresnel-Kirchhoff diffraction parameter v
  // v = h * sqrt(2*d/(lambda*d1*d2))
  // where h is the clearance height
  const lambda = 0.3 / (frequency); // wavelength in meters
  
  const v = clearance * Math.sqrt((2 * distance) / (lambda * d1 * d2 * 1000));
  
  // Calculate diffraction loss using approximation
  let diffractionLoss;
  
  if (v <= -0.7) {
    diffractionLoss = 0;
  } else if (v <= 2.4) {
    diffractionLoss = 6.9 + 20 * Math.log10(Math.sqrt(Math.pow(v - 0.1, 2) + 1) + v - 0.1);
  } else {
    diffractionLoss = 13 + 20 * Math.log10(v);
  }
  
  return parseFloat(diffractionLoss.toFixed(2));
};

/**
 * Calculate maximum allowed distance for a given link margin
 * 
 * @param {number} systemGain - System gain in dB
 * @param {number} receiverThreshold - Receiver threshold in dBm
 * @param {number} frequency - Frequency in GHz
 * @param {number} additionalLosses - Additional system losses in dB
 * @returns {number} - Maximum distance in km
 */
exports.calculateMaxDistance = (systemGain, receiverThreshold, frequency, additionalLosses = 0) => {
  // Maximum allowed path loss
  const maxPathLoss = systemGain - Math.abs(receiverThreshold) - additionalLosses;
  
  // Rearrange free space path loss formula to solve for distance
  // FSPL = 32.45 + 20log10(f) + 20log10(d)
  // 20log10(d) = FSPL - 32.45 - 20log10(f)
  // log10(d) = (FSPL - 32.45 - 20log10(f)) / 20
  // d = 10^((FSPL - 32.45 - 20log10(f)) / 20)
  
  // Convert frequency from GHz to MHz for formula
  const frequencyMHz = frequency * 1000;
  
  const logD = (maxPathLoss - 32.45 - 20 * Math.log10(frequencyMHz)) / 20;
  const maxDistance = Math.pow(10, logD);
  
  return parseFloat(maxDistance.toFixed(2));
};
