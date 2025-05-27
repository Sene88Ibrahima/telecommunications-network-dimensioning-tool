/**
 * Optical Link Budget Calculator Service
 * Implements formulas for optical fiber link calculations
 */

/**
 * Calculate optical power budget
 * 
 * @param {number} transmitterPower - Transmitter output power in dBm
 * @param {number} receiverSensitivity - Receiver sensitivity in dBm
 * @returns {number} - Optical budget in dB
 */
exports.calculateOpticalBudget = (transmitterPower, receiverSensitivity) => {
  // Optical budget = Transmitter power - Receiver sensitivity
  // Note: Receiver sensitivity is typically a negative value
  const budget = transmitterPower - receiverSensitivity;
  
  return parseFloat(budget.toFixed(2));
};

/**
 * Calculate total losses in an optical link
 * 
 * @param {string} fiberType - Fiber type ('MONOMODE' or 'MULTIMODE')
 * @param {number} linkLength - Link length in km
 * @param {number} wavelength - Wavelength in nm
 * @param {number} connectorCount - Number of connectors
 * @param {number} spliceCount - Number of splices
 * @param {number} [customConnectorLoss] - Custom connector loss in dB (optional)
 * @param {number} [customSpliceLoss] - Custom splice loss in dB (optional)
 * @param {number} [customSafetyMargin] - Custom safety margin in dB (optional)
 * @returns {number} - Total losses in dB
 */
exports.calculateTotalLosses = (fiberType, linkLength, wavelength, connectorCount, spliceCount, customConnectorLoss, customSpliceLoss, customSafetyMargin) => {
  // Get fiber attenuation coefficient based on fiber type and wavelength
  const fiberAttenuation = getFiberAttenuation(fiberType, wavelength);
  
  // Get connector and splice losses based on fiber type or use custom values if provided
  const connectorLoss = customConnectorLoss || (fiberType === 'MONOMODE' ? 0.5 : 1.0); // dB per connector
  const spliceLoss = customSpliceLoss || (fiberType === 'MONOMODE' ? 0.1 : 0.3); // dB per splice
  
  // Calculate fiber attenuation
  const fiberLoss = fiberAttenuation * linkLength;
  
  // Calculate connector losses
  const connectorLosses = connectorCount * connectorLoss;
  
  // Calculate splice losses
  const spliceLosses = spliceCount * spliceLoss;
  
  // Add safety margin (default 3dB or custom value)
  const safetyMargin = customSafetyMargin !== undefined ? customSafetyMargin : 3;
  
  // Calculate total losses
  const totalLosses = fiberLoss + connectorLosses + spliceLosses + safetyMargin;
  
  return parseFloat(totalLosses.toFixed(2));
};

/**
 * Get fiber attenuation coefficient based on fiber type and wavelength
 * 
 * @param {string} fiberType - Fiber type ('MONOMODE' or 'MULTIMODE')
 * @param {number} wavelength - Wavelength in nm
 * @returns {number} - Attenuation coefficient in dB/km
 */
exports.getFiberAttenuation = getFiberAttenuation;

function getFiberAttenuation(fiberType, wavelength) {
  // Typical attenuation values for different fiber types and wavelengths
  if (fiberType === 'MONOMODE') {
    // Single-mode fiber attenuation coefficients
    if (wavelength >= 1300 && wavelength < 1400) {
      return 0.35; // 1310nm window
    } else if (wavelength >= 1500 && wavelength < 1600) {
      return 0.25; // 1550nm window
    } else if (wavelength >= 1600) {
      return 0.30; // 1625nm window
    } else {
      return 0.40; // Other wavelengths
    }
  } else {
    // Multi-mode fiber attenuation coefficients
    if (wavelength >= 800 && wavelength < 900) {
      return 3.0; // 850nm window
    } else if (wavelength >= 1200 && wavelength < 1400) {
      return 1.0; // 1300nm window
    } else {
      return 3.5; // Other wavelengths
    }
  }
}

/**
 * Calculate maximum range for an optical link
 * 
 * @param {number} opticalBudget - Optical budget in dB
 * @param {number} linearAttenuation - Fiber attenuation coefficient in dB/km
 * @param {number} connectionLosses - Total connection losses in dB (connectors, splices, etc.)
 * @param {number} [customSafetyMargin] - Custom safety margin in dB (optional)
 * @returns {number} - Maximum range in km
 */
exports.calculateMaxRange = (opticalBudget, linearAttenuation, connectionLosses, customSafetyMargin) => {
  // Apply safety margin (default 3dB or custom value)
  const safetyMargin = customSafetyMargin !== undefined ? customSafetyMargin : 3;
  
  // Available budget for fiber attenuation
  const availableBudget = opticalBudget - connectionLosses - safetyMargin;
  
  // Maximum range = Available budget / Linear attenuation
  const maxRange = availableBudget / linearAttenuation;
  
  // Return 0 if result is negative
  return maxRange > 0 ? parseFloat(maxRange.toFixed(2)) : 0;
};

/**
 * Calculate chromatic dispersion
 * 
 * @param {number} wavelength - Wavelength in nm
 * @param {number} linkLength - Link length in km
 * @param {number} spectralWidth - Source spectral width in nm
 * @returns {number} - Chromatic dispersion in ps
 */
exports.calculateChromaticDispersion = (wavelength, linkLength, spectralWidth) => {
  // Get dispersion coefficient based on wavelength (typical values)
  let dispersionCoefficient;
  
  if (wavelength < 1300) {
    dispersionCoefficient = -100; // ps/(nm·km) for wavelengths below 1300nm
  } else if (wavelength < 1500) {
    // Near zero dispersion in 1310nm window for standard single-mode fiber
    dispersionCoefficient = 2; // ps/(nm·km)
  } else {
    // Higher dispersion in 1550nm window
    dispersionCoefficient = 17; // ps/(nm·km)
  }
  
  // Calculate total chromatic dispersion
  // D = Dispersion coefficient * Spectral width * Link length
  const chromaticDispersion = Math.abs(dispersionCoefficient) * spectralWidth * linkLength;
  
  return parseFloat(chromaticDispersion.toFixed(2));
};

/**
 * Calculate power penalty due to dispersion
 * 
 * @param {number} bitRate - Bit rate in Gbps
 * @param {number} dispersion - Total dispersion in ps
 * @returns {number} - Power penalty in dB
 */
exports.calculateDispersionPenalty = (bitRate, dispersion) => {
  // Convert bit rate to bit period in ps
  const bitPeriod = 1000 / bitRate; // 1000 ps per ns
  
  // Calculate power penalty using approximation formula
  // Simplified formula: Penalty ≈ 5 * log10(1 + (Dispersion/BitPeriod)²)
  const penaltyFactor = 1 + Math.pow(dispersion / bitPeriod, 2);
  const penalty = 5 * Math.log10(penaltyFactor);
  
  return parseFloat(penalty.toFixed(2));
};

/**
 * Calculate optical signal-to-noise ratio (OSNR)
 * 
 * @param {number} launchPower - Launch power in dBm
 * @param {number} receivedPower - Received power in dBm
 * @param {number} noiseFigure - Amplifier noise figure in dB
 * @param {number} amplifierCount - Number of optical amplifiers
 * @returns {number} - OSNR in dB
 */
exports.calculateOSNR = (launchPower, receivedPower, noiseFigure, amplifierCount) => {
  // Calculate span loss
  const spanLoss = launchPower - receivedPower;
  
  // Calculate OSNR using approximation formula
  // OSNR ≈ Launch power - Noise figure - 10log10(amplifier count) - 58
  const osnr = launchPower - noiseFigure - 10 * Math.log10(amplifierCount) - 58;
  
  return parseFloat(osnr.toFixed(2));
};
