/**
 * UMTS Network Dimensioning Calculator Service
 * Implements formulas for UMTS/3G network planning
 */

/**
 * Calculate uplink capacity for UMTS network
 * 
 * @param {Array} services - Array of service objects with type, bitRate, and activityFactor
 * @param {number} ebno - Eb/N0 target in dB
 * @param {number} loadFactor - Optional load factor limit (0-1)
 * @returns {Object} - Uplink capacity information
 */
exports.calculateUplinkCapacity = (services, ebno, loadFactor = 0.75) => {
  // Convert Eb/N0 from dB to linear
  const ebnoLinear = Math.pow(10, ebno / 10);
  
  // Processing Gain (Gp) calculation for each service
  // Gp = W / R where W is chip rate (3.84 Mcps for UMTS) and R is the service bit rate
  const chipRate = 3.84e6; // 3.84 Mcps (UMTS standard)
  
  // Calculate load factor contribution for each service
  let totalLoadFactor = 0;
  const serviceDetails = [];
  
  services.forEach(service => {
    // Convert bit rate to bps (if provided in kbps)
    const bitRate = service.bitRate * (service.bitRate < 1000 ? 1000 : 1);
    
    // Calculate processing gain
    const processingGain = chipRate / bitRate;
    const processingGainDB = 10 * Math.log10(processingGain);
    
    // Calculate load factor contribution for this service
    // η = (1 + i) * (Eb/No) * v / Gp
    // where:
    // i = intercell interference factor (typically 0.55-0.65 for urban areas)
    // v = activity factor
    // Gp = processing gain
    const interferenceFactor = 0.65; // Typical value for urban areas
    
    const serviceLoadFactor = (1 + interferenceFactor) * ebnoLinear * service.activityFactor / processingGain;
    
    totalLoadFactor += serviceLoadFactor;
    
    serviceDetails.push({
      serviceType: service.type,
      bitRate: service.bitRate,
      activityFactor: service.activityFactor,
      processingGain,
      processingGainDB,
      serviceLoadFactor
    });
  });
  
  // Maximum number of simultaneous users based on load factor limit
  // Use either provided load factor or default 0.75 (75% cell loading)
  const maxLoadFactor = loadFactor || 0.75;
  
  // Calculate maximum users (assuming all users have the same service mix)
  const maxUsers = Math.floor(maxLoadFactor / totalLoadFactor);
  
  // Calculate noise rise due to cell loading
  // Noise Rise (dB) = -10 * log10(1 - η)
  const noiseRise = -10 * Math.log10(1 - totalLoadFactor);
  
  return {
    serviceDetails,
    totalLoadFactor,
    maxUsers,
    noiseRise,
    maxLoadFactor
  };
};

/**
 * Calculate downlink capacity for UMTS network
 * 
 * @param {Array} services - Array of service objects with type, bitRate, and activityFactor
 * @param {number} ebno - Eb/N0 target in dB
 * @param {number} loadFactor - Optional load factor limit (0-1)
 * @returns {Object} - Downlink capacity information
 */
exports.calculateDownlinkCapacity = (services, ebno, loadFactor = 0.75) => {
  // Convert Eb/N0 from dB to linear
  const ebnoLinear = Math.pow(10, ebno / 10);
  
  // Processing Gain (Gp) calculation for each service
  // Gp = W / R where W is chip rate (3.84 Mcps for UMTS) and R is the service bit rate
  const chipRate = 3.84e6; // 3.84 Mcps (UMTS standard)
  
  // Calculate load factor contribution for each service
  let totalLoadFactor = 0;
  const serviceDetails = [];
  
  // Orthogonality factor (α) - ranges from 0.4 to 0.9
  // 0.4 for high multipath environments, 0.9 for low multipath
  const orthogonalityFactor = 0.6; // Average value
  
  services.forEach(service => {
    // Convert bit rate to bps (if provided in kbps)
    const bitRate = service.bitRate * (service.bitRate < 1000 ? 1000 : 1);
    
    // Calculate processing gain
    const processingGain = chipRate / bitRate;
    const processingGainDB = 10 * Math.log10(processingGain);
    
    // Calculate load factor contribution for this service
    // η = (Eb/No) * v / Gp * ((1-α) + i)
    // where:
    // α = orthogonality factor
    // i = other cell interference factor (typically 0.55-0.65)
    // v = activity factor
    // Gp = processing gain
    const interferenceFactor = 0.65; // Typical value for urban areas
    
    const serviceLoadFactor = ebnoLinear * service.activityFactor / processingGain * ((1 - orthogonalityFactor) + interferenceFactor);
    
    totalLoadFactor += serviceLoadFactor;
    
    serviceDetails.push({
      serviceType: service.type,
      bitRate: service.bitRate,
      activityFactor: service.activityFactor,
      processingGain,
      processingGainDB,
      serviceLoadFactor
    });
  });
  
  // Maximum number of simultaneous users based on load factor limit
  // Use either provided load factor or default 0.75 (75% cell loading)
  const maxLoadFactor = loadFactor || 0.75;
  
  // Calculate maximum users (assuming all users have the same service mix)
  const maxUsers = Math.floor(maxLoadFactor / totalLoadFactor);
  
  return {
    serviceDetails,
    totalLoadFactor,
    maxUsers,
    orthogonalityFactor,
    maxLoadFactor
  };
};

/**
 * Calculate cell coverage for UMTS network
 * 
 * @param {number} transmitPower - Transmit power in dBm
 * @param {number} sensitivity - Receiver sensitivity in dBm
 * @param {number} margin - Link margin in dB
 * @param {Object} propagationParameters - Additional propagation parameters
 * @returns {Object} - Cell coverage information
 */
exports.calculateCellCoverage = (transmitPower, sensitivity, margin, propagationParameters) => {
  // Calculate maximum allowable path loss
  // MAPL = Tx Power - Rx Sensitivity - Margins
  const mapl = transmitPower - sensitivity - margin;
  
  // Calculate cell radius using path loss model
  // Using simplified COST-231 Hata model for urban environments
  const {
    frequency = 2100, // Default 2100 MHz for UMTS
    baseStationHeight = 30, // in meters
    mobileHeight = 1.5, // in meters
    environmentType = 'URBAN' // URBAN, SUBURBAN, RURAL
  } = propagationParameters;
  
  // COST-231 Hata model for urban areas
  // L = 46.3 + 33.9log(f) - 13.82log(hb) - a(hm) + (44.9 - 6.55log(hb))log(d) + C
  // where:
  // L = path loss in dB
  // f = frequency in MHz
  // hb = base station antenna height in meters
  // hm = mobile antenna height in meters
  // d = distance in km
  // C = 0 for medium cities and suburban, 3 for metropolitan centers
  
  // Calculate mobile antenna height correction factor
  let mobileCorrection;
  
  if (frequency >= 400) {
    // For large cities, f >= 400 MHz
    mobileCorrection = 3.2 * Math.pow(Math.log10(11.75 * mobileHeight), 2) - 4.97;
  } else {
    // For small to medium-sized cities
    mobileCorrection = (1.1 * Math.log10(frequency) - 0.7) * mobileHeight - (1.56 * Math.log10(frequency) - 0.8);
  }
  
  // Set environment correction factor
  let C = 0;
  if (environmentType === 'METROPOLITAN') {
    C = 3;
  }
  
  // Rearrange COST-231 formula to solve for distance (d)
  const a = 46.3 + 33.9 * Math.log10(frequency) - 13.82 * Math.log10(baseStationHeight) - mobileCorrection + C;
  const b = 44.9 - 6.55 * Math.log10(baseStationHeight);
  
  // MAPL = a + b*log(d)
  // log(d) = (MAPL - a) / b
  // d = 10^((MAPL - a) / b)
  const logD = (mapl - a) / b;
  const radius = Math.pow(10, logD);
  
  // Calculate cell area (hexagonal cell model)
  // Area = 2.6 * R²
  const cellArea = 2.6 * Math.pow(radius, 2);
  
  return {
    mapl,
    radius: parseFloat(radius.toFixed(2)),
    cellArea: parseFloat(cellArea.toFixed(2)),
    transmitPower,
    sensitivity,
    margin,
    frequency,
    environmentType
  };
};

/**
 * Calculate frequency planning parameters for UMTS
 * 
 * @param {number} totalBandwidth - Total available bandwidth in MHz
 * @param {number} carrierBandwidth - Carrier bandwidth in MHz (typically 5 MHz for UMTS)
 * @returns {Object} - Frequency planning parameters
 */
exports.calculateFrequencyPlanning = (totalBandwidth, carrierBandwidth = 5) => {
  // Calculate number of carriers
  const numberOfCarriers = Math.floor(totalBandwidth / carrierBandwidth);
  
  // Calculate total capacity assuming typical values
  // Each 5 MHz carrier supports about 100 voice users
  const voiceCapacityPerCarrier = 100;
  const totalVoiceCapacity = numberOfCarriers * voiceCapacityPerCarrier;
  
  return {
    numberOfCarriers,
    carrierBandwidth,
    totalBandwidth,
    voiceCapacityPerCarrier,
    totalVoiceCapacity
  };
};
