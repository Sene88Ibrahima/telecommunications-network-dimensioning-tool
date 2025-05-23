/**
 * GSM Network Dimensioning Calculator Service
 * Implements formulas for GSM network planning
 */

/**
 * Calculate cell radius based on radio parameters
 * Using simplified path loss models (Okumura-Hata or COST-231)
 * 
 * @param {number} frequency - Frequency in MHz
 * @param {number} btsPower - BTS transmission power in dBm
 * @param {number} mobileReceptionThreshold - Mobile reception sensitivity in dBm
 * @param {string} propagationModel - Propagation model ('OKUMURA_HATA' or 'COST231')
 * @returns {number} - Cell radius in km
 */
exports.calculateCellRadius = (frequency, btsPower, mobileReceptionThreshold, propagationModel) => {
  // Calculate available link budget
  const linkBudget = btsPower - mobileReceptionThreshold;
  
  // Different calculation based on propagation model
  if (propagationModel === 'OKUMURA_HATA') {
    // Okumura-Hata model for urban areas
    // Simplified formula: L = 69.55 + 26.16log(f) - 13.82log(hb) - a(hm) + (44.9 - 6.55log(hb))log(d)
    // where:
    // L = path loss in dB
    // f = frequency in MHz
    // hb = base station antenna height in meters (assuming 30m as default)
    // hm = mobile antenna height in meters (assuming 1.5m as default)
    // d = distance in km
    // a(hm) = mobile antenna height correction factor
    
    const hb = 30; // Base station height in meters (default)
    const hm = 1.5; // Mobile height in meters (default)
    
    // Calculate mobile antenna height correction factor for urban areas
    // a(hm) = 3.2(log(11.75*hm))² - 4.97 for large cities, f > 300 MHz
    const mobileCorrection = 3.2 * Math.pow(Math.log10(11.75 * hm), 2) - 4.97;
    
    // Rearrange Okumura-Hata formula to solve for distance (d)
    const a = 69.55 + 26.16 * Math.log10(frequency) - 13.82 * Math.log10(hb) - mobileCorrection;
    const b = 44.9 - 6.55 * Math.log10(hb);
    
    // Link budget = path loss, solve for d
    // L = a + b*log(d)
    // log(d) = (L - a) / b
    // d = 10^((L - a) / b)
    const logD = (linkBudget - a) / b;
    const radius = Math.pow(10, logD);
    
    return parseFloat(radius.toFixed(2));
  } else if (propagationModel === 'COST231') {
    // COST-231 extension of Hata model for frequencies 1500-2000 MHz
    // L = 46.3 + 33.9log(f) - 13.82log(hb) - a(hm) + (44.9 - 6.55log(hb))log(d) + C
    // where C = 0 for medium cities and suburban areas, 3 for metropolitan centers
    
    const hb = 30; // Base station height in meters (default)
    const hm = 1.5; // Mobile height in meters (default)
    const C = 0; // Assuming medium city
    
    // Calculate mobile antenna height correction factor
    const mobileCorrection = 3.2 * Math.pow(Math.log10(11.75 * hm), 2) - 4.97;
    
    // Rearrange COST-231 formula to solve for distance (d)
    const a = 46.3 + 33.9 * Math.log10(frequency) - 13.82 * Math.log10(hb) - mobileCorrection + C;
    const b = 44.9 - 6.55 * Math.log10(hb);
    
    const logD = (linkBudget - a) / b;
    const radius = Math.pow(10, logD);
    
    return parseFloat(radius.toFixed(2));
  } else {
    // Default simple calculation using free space path loss model
    // FSPL = 32.45 + 20log(f) + 20log(d)
    // where f is in MHz and d is in km
    
    // Rearrange to solve for d
    // d = 10^((FSPL - 32.45 - 20log(f)) / 20)
    const logD = (linkBudget - 32.45 - 20 * Math.log10(frequency)) / 20;
    const radius = Math.pow(10, logD);
    
    return parseFloat(radius.toFixed(2));
  }
};

/**
 * Calculate number of BTS needed for coverage
 * 
 * @param {number} coverageArea - Area to cover in km²
 * @param {number} cellRadius - Cell radius in km
 * @returns {number} - Number of BTS needed
 */
exports.calculateBtsCount = (coverageArea, cellRadius) => {
  // Using hexagonal cell model
  // Area of a hexagonal cell = 3√3 × R²/2
  // where R is the cell radius
  
  const cellArea = (3 * Math.sqrt(3) * Math.pow(cellRadius, 2)) / 2;
  
  // Number of cells = Total area / Cell area
  const numberOfCells = Math.ceil(coverageArea / cellArea);
  
  return numberOfCells;
};

/**
 * Calculate traffic capacity
 * 
 * @param {number} channelCount - Number of available traffic channels
 * @param {number} occupancyRate - Channel occupancy rate (0-1)
 * @returns {number} - Traffic capacity in Erlang
 */
exports.calculateTrafficCapacity = (channelCount, occupancyRate) => {
  // Simple traffic capacity calculation
  // Capacity = Number of channels × Occupancy rate
  const capacity = channelCount * occupancyRate;
  
  return parseFloat(capacity.toFixed(2));
};

/**
 * Calculate Erlang B capacity
 * Used to determine the number of channels needed for a given traffic and blocking probability
 * 
 * @param {number} traffic - Traffic in Erlang
 * @param {number} blockingProbability - Acceptable blocking probability (0-1)
 * @returns {number} - Required number of channels
 */
exports.calculateErlangB = (traffic, blockingProbability) => {
  // Implementation of Erlang B formula
  // Recursive implementation using the iterative formula:
  // E(n+1) = A * E(n) / (n+1 + A*E(n))
  // where:
  // E(0) = 1
  // A = offered traffic in Erlang
  // n = number of channels
  // E(n) = blocking probability with n channels
  
  // Start with a small number of channels and increase until we find the minimum
  // number that satisfies our blocking probability requirement
  let channels = 1;
  let blockingProb = 1.0;
  
  while (blockingProb > blockingProbability) {
    // Calculate blocking probability for current number of channels
    let prevBlocking = 1.0;
    
    for (let i = 1; i <= channels; i++) {
      blockingProb = (traffic * prevBlocking) / (i + traffic * prevBlocking);
      prevBlocking = blockingProb;
    }
    
    if (blockingProb <= blockingProbability) {
      break;
    }
    
    channels++;
    
    // Safety check to prevent infinite loops
    if (channels > 1000) {
      throw new Error('Could not converge on a solution for Erlang B calculation');
    }
  }
  
  return channels;
};

/**
 * Calculate frequency planning parameters
 * 
 * @param {number} totalChannels - Total available channels
 * @param {number} clusterSize - Cluster size (typically 3, 4, 7, 9, 12, etc.)
 * @returns {Object} - Frequency planning parameters
 */
exports.calculateFrequencyPlanning = (totalChannels, clusterSize) => {
  // Calculate how many channels per cell
  const channelsPerCell = Math.floor(totalChannels / clusterSize);
  
  // Calculate frequency reuse factor
  const frequencyReuseFactor = 1 / clusterSize;
  
  // Calculate co-channel interference ratio
  // For hexagonal cell pattern, D/R = √(3*N) where N is the cluster size
  const cochannel = Math.sqrt(3 * clusterSize);
  
  return {
    channelsPerCell,
    frequencyReuseFactor,
    cochannel
  };
};
