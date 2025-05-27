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
/**
 * Calcule la marge de liaison en dB
 * 
 * La formule correcte est: Marge = Gain système - Pertes totales + |Seuil de réception|
 * Mais comme le seuil est déjà négatif (par ex. -85 dBm), on peut simplifier:
 * Marge = Gain système - Seuil de réception - Pertes totales
 * puisque -Seuil (qui est négatif) = +|Seuil|
 */
exports.calculateLinkMargin = (systemGain, receiverThreshold, totalLosses) => {
  // IMPORTANTE VÉRIFICATION: S'assurer que le seuil est négatif (valeur typique: -85 dBm)
  // Si la valeur est positive pour une raison quelconque, la convertir en négative
  const threshold = receiverThreshold <= 0 ? receiverThreshold : -Math.abs(receiverThreshold);
  
  // Calcul de la marge en dB
  // Formule correcte: gain système - pertes totales + |seuil|
  // Comme threshold est négatif, on utilise -threshold pour obtenir la valeur absolue
  const margin = systemGain - totalLosses - threshold;
  
  // Afficher les détails du calcul pour débogage
  console.log('Détails du calcul de marge de liaison:', { 
    systemGain, 
    receiverThreshold: threshold, 
    totalLosses, 
    margin
  });
  
  return parseFloat(margin.toFixed(2));
};

/**
 * Calculate link availability based on link margin and rain attenuation
 * 
 * @param {number} linkMargin - Link margin in dB
 * @param {number} frequency - Frequency in GHz
 * @param {number} distance - Distance in km
 * @param {string} rainZone - ITU-R rain zone (A-Q)
 * @param {string} terrainType - Type of terrain (WATER, FLAT, AVERAGE, HILLY, MOUNTAINOUS, URBAN)
 * @returns {Object} - Link availability details
 */
exports.calculateLinkAvailability = (linkMargin, frequency, distance, rainZone, terrainType = 'AVERAGE') => {
  // Calculate rain attenuation for the given frequency, distance and rain zone
  const rainAttenuation = calculateRainAttenuation(frequency, distance, rainZone);
  
  // Calculate fade margin (link margin minus rain attenuation)
  const fadeMargin = linkMargin - rainAttenuation;
  
  // Si la marge est très négative, la liaison est totalement inutilisable
  // Fournir des valeurs raisonnables pour ce scénario sans faire de calculs complexes
  if (fadeMargin < -30) {
    return {
      availability: 0.01, // Pratiquement 0%, mais on évite exactement 0
      unavailability: 99.99, // Pratiquement 100%, mais on évite exactement 100
      rainAttenuation: parseFloat(rainAttenuation.toFixed(2)),
      fadeMargin: parseFloat(fadeMargin.toFixed(2)),
      downtimeMinutes: 525600, // Quasi-totalité de l'année (365*24*60)
      rainZone
    };
  }
  
  // Pour les marges fortement négatives mais pas extrêmes (-30 à -10), 
  // utiliser une formule simplifiée pour éviter les calculs exponentiels extrêmes
  if (fadeMargin < -10) {
    // Interpolation linéaire pour les valeurs entre -30 et -10 dB
    // -30 dB -> 0.01% disponibilité
    // -10 dB -> 50% disponibilité
    const availability = 0.01 + (fadeMargin + 30) * (50 - 0.01) / 20;
    const unavailability = 100 - availability;
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
  }
  
  // Pour les marges entre -10 et +10, on utilise le modèle modifié de Vigants-Barnett
  // avec une limitation pour éviter les valeurs aberrantes
  const limitedFadeMargin = Math.max(fadeMargin, -10);
  
  const climateFactor = getClimateFactorFromRainZone(rainZone);
  const terrainFactor = getTerrainFactor(terrainType);
  
  // Calcul de l'indisponibilité avec limitation pour éviter les valeurs astronomiques
  let unavailability = climateFactor * terrainFactor * 
                      Math.pow(10, -limitedFadeMargin/10) * 
                      Math.pow(Math.min(distance, 50), 3) * 
                      Math.pow(Math.min(frequency, 40), 2) / 1000000;
  
  // Limiter l'indisponibilité à un maximum de 99.99%
  unavailability = Math.min(unavailability, 99.99);
  
  // Pour les marges positives élevées (>10dB), l'indisponibilité devient très faible
  if (fadeMargin > 10) {
    // Réduction exponentielle de l'indisponibilité pour les marges élevées
    unavailability = unavailability * Math.pow(0.5, (fadeMargin - 10) / 3);
  }
  
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
/**
 * Calculate terrain loss based on terrain type and distance
 * 
 * @param {string} terrainType - Type of terrain (WATER, FLAT, AVERAGE, HILLY, MOUNTAINOUS, URBAN)
 * @param {number} distance - Distance in km
 * @returns {number} - Terrain loss in dB
 */
exports.calculateTerrainLoss = (terrainType = 'AVERAGE', distance) => {
  const terrainFactors = {
    'WATER': 0.1,     // Surface de l'eau (pertes minimales)
    'FLAT': 0.25,     // Terrain plat
    'AVERAGE': 0.5,   // Terrain moyen
    'HILLY': 1.0,     // Terrain vallonné
    'MOUNTAINOUS': 2.0, // Terrain montagneux
    'URBAN': 3.0      // Environnement urbain (pertes maximales)
  };
  
  const factor = terrainFactors[terrainType] || terrainFactors['AVERAGE'];
  
  // Calcul simplifié où les pertes augmentent avec la distance et le facteur de terrain
  const loss = factor * Math.log10(distance + 1) * 2;
  
  return parseFloat(loss.toFixed(2));
};

/**
 * Calculate fog loss based on fog density and frequency
 * 
 * @param {number} fogDensity - Fog density in g/m³
 * @param {number} frequency - Frequency in GHz
 * @returns {number} - Fog loss in dB
 */
exports.calculateFogLoss = (fogDensity = 0, frequency) => {
  if (fogDensity <= 0) return 0;
  
  // Les pertes dues au brouillard sont plus significatives en haute fréquence
  // Formule simplifiée basée sur le modèle ITU-R P.840
  let loss = 0;
  
  if (frequency > 10) {
    // Les pertes sont plus importantes à partir de 10 GHz
    loss = fogDensity * 0.05 * frequency * Math.log10(frequency);
  } else if (frequency > 5) {
    // Pertes modérées entre 5 et 10 GHz
    loss = fogDensity * 0.02 * frequency;
  } else {
    // Pertes minimales en dessous de 5 GHz
    loss = fogDensity * 0.005 * frequency;
  }
  
  return parseFloat(loss.toFixed(2));
};

/**
 * Calculate Fresnel zone clearance loss
 * 
 * @param {number} fresnelClearance - Percentage of Fresnel zone clearance (0-100%)
 * @returns {number} - Fresnel clearance loss in dB
 */
exports.calculateFresnelLoss = (fresnelClearance = 60) => {
  // Si le dégagement est de 100%, il n'y a pas de pertes
  if (fresnelClearance >= 100) return 0;
  
  // Si le dégagement est de 60% ou plus, les pertes sont minimes
  if (fresnelClearance >= 60) {
    return parseFloat((0.5 * (100 - fresnelClearance) / 40).toFixed(2));
  }
  
  // En dessous de 60%, les pertes augmentent plus rapidement
  // 0% de dégagement peut causer jusqu'à 20dB de pertes
  return parseFloat((0.5 + (60 - fresnelClearance) / 60 * 19.5).toFixed(2));
};

/**
 * Calculate receiver threshold based on modulation type, bandwidth, and target BER
 * 
 * @param {string} modulationType - Type of modulation (BPSK, QPSK, QAM16, QAM64, QAM256, QAM1024)
 * @param {number} bandwidthMHz - Channel bandwidth in MHz
 * @param {number} targetBER - Target Bit Error Rate (e.g., 0.000001 for 10^-6)
 * @returns {number} - Receiver threshold in dBm
 */
exports.calculateReceiverThreshold = (modulationType = 'QPSK', bandwidthMHz = 20, targetBER = 0.000001) => {
  // Eb/N0 (Energy per bit to noise density ratio) requis pour différentes modulations et BER
  // Valeurs approximatives en dB
  const ebnoRequirements = {
    'BPSK': {
      '0.1': 4.3,
      '0.01': 8.4,
      '0.001': 9.8,
      '0.0001': 10.5,
      '0.00001': 12.0,
      '0.000001': 13.5,
      '0.0000001': 14.9,
      '0.00000001': 16.5,
      '0.000000001': 18.2
    },
    'QPSK': {
      '0.1': 4.3,
      '0.01': 8.4,
      '0.001': 9.8,
      '0.0001': 10.5,
      '0.00001': 12.0,
      '0.000001': 13.5,
      '0.0000001': 14.9,
      '0.00000001': 16.5,
      '0.000000001': 18.2
    },
    'QAM16': {
      '0.1': 7.5,
      '0.01': 10.5,
      '0.001': 13.5,
      '0.0001': 16.5,
      '0.00001': 18.0,
      '0.000001': 19.5,
      '0.0000001': 21.0,
      '0.00000001': 22.5,
      '0.000000001': 24.0
    },
    'QAM64': {
      '0.1': 11.5,
      '0.01': 14.5,
      '0.001': 17.5,
      '0.0001': 20.5,
      '0.00001': 22.0,
      '0.000001': 23.5,
      '0.0000001': 25.0,
      '0.00000001': 26.5,
      '0.000000001': 28.0
    },
    'QAM256': {
      '0.1': 15.5,
      '0.01': 18.5,
      '0.001': 21.5,
      '0.0001': 24.5,
      '0.00001': 26.0,
      '0.000001': 27.5,
      '0.0000001': 29.0,
      '0.00000001': 30.5,
      '0.000000001': 32.0
    },
    'QAM1024': {
      '0.1': 19.5,
      '0.01': 22.5,
      '0.001': 25.5,
      '0.0001': 28.5,
      '0.00001': 30.0,
      '0.000001': 31.5,
      '0.0000001': 33.0,
      '0.00000001': 34.5,
      '0.000000001': 36.0
    }
  };
  
  // Utilisation de QPSK comme modulation par défaut si la modulation fournie n'est pas reconnue
  const modulation = ebnoRequirements[modulationType] || ebnoRequirements['QPSK'];
  
  // Utilisation de BER 10^-6 comme valeur par défaut si le BER cible n'est pas reconnu
  const ebno = modulation[targetBER.toString()] || modulation['0.000001'];
  
  // Calcul du bruit thermique: N = k*T*B où k est la constante de Boltzmann, T est la température en Kelvin, B est la bande passante
  // k*T à température ambiante (290K) est approximativement -174 dBm/Hz
  const thermalNoise = -174 + 10 * Math.log10(bandwidthMHz * 1e6); // Conversion MHz en Hz
  
  // Ajout d'un facteur de bruit de récepteur typique (5 dB)
  const noiseFloor = thermalNoise + 5;
  
  // Calcul du seuil de réception: Bruit + Eb/N0 + marge d'implémentation (2 dB)
  const threshold = noiseFloor + ebno + 2;
  
  return parseFloat(threshold.toFixed(2));
};

/**
 * Calculate maximum achievable data rate based on modulation, bandwidth, and link margin
 * 
 * @param {string} modulationType - Type of modulation (BPSK, QPSK, QAM16, QAM64, QAM256, QAM1024)
 * @param {number} bandwidthMHz - Channel bandwidth in MHz
 * @param {number} linkMargin - Available link margin in dB
 * @returns {number} - Maximum achievable data rate in Mbps
 */
exports.calculateMaxDataRate = (modulationType = 'QPSK', bandwidthMHz = 20, linkMargin = 10) => {
  // Log d'entrée pour débogage
  console.log('Calcul débit max:', { modulationType, bandwidthMHz, linkMargin });
  
  // Efficacité spectrale (bits/s/Hz) pour différentes modulations en conditions idéales
  const spectralEfficiency = {
    'BPSK': 1,
    'QPSK': 2,
    'QAM16': 4,
    'QAM64': 6,
    'QAM256': 8,
    'QAM1024': 10
  };
  
  // Obtenir l'efficacité spectrale de la modulation choisie (ou QPSK par défaut)
  const efficiency = spectralEfficiency[modulationType] || spectralEfficiency['QPSK'];
  
  // Si la marge de liaison est négative, la liaison est dégradée
  if (linkMargin < 0) {
    // Pour une marge négative, utiliser une formule spéciale basée sur l'importance de la dégradation
    const minDebit = 0.01; // Débit minimal (10 kbps)
    const degradedRate = Math.max(minDebit, bandwidthMHz * efficiency * 0.01 * Math.exp(linkMargin/20));
    return parseFloat(degradedRate.toFixed(2));
  }
  
  // Pour les marges positives, utiliser le calcul normal avec facteur de correction
  let correctionFactor;
  if (linkMargin < 5) {
    correctionFactor = 0.5 + (linkMargin / 10); // Entre 0.5 et 1.0 pour margin 0-5 dB
  } else if (linkMargin > 20) {
    // Bonus pour les liens avec une très bonne marge
    correctionFactor = 1.0 + (Math.min(linkMargin - 20, 10) / 20); // Max 1.5 pour margin > 30dB
  } else {
    correctionFactor = 1.0; // Valeur standard pour les marges entre 5 et 20 dB
  }
  
  // Calcul du débit maximal: Bande passante * Efficacité spectrale * Facteur de correction
  const maxDataRate = bandwidthMHz * efficiency * correctionFactor;
  
  // Log de sortie pour débogage
  console.log('Résultat débit max:', { efficiency, correctionFactor, maxDataRate });
  
  // S'assurer que le débit n'est jamais négatif ou trop proche de zéro
  return parseFloat(Math.max(maxDataRate, 0.01).toFixed(2));
};

/**
 * Helper function to get climate factor from rain zone
 * 
 * @param {string} rainZone - ITU-R rain zone (A-Q)
 * @returns {number} - Climate factor
 */
function getClimateFactorFromRainZone(rainZone) {
  const climateFactors = {
    'A': 1,  // Très sec
    'B': 2,
    'C': 2.5,
    'D': 3,
    'E': 3.5, // Modéré
    'F': 4,
    'G': 4.5,
    'H': 5,
    'J': 5.5,
    'K': 6,   // Tropical modéré
    'L': 6.5,
    'M': 7,   // Tropical humide
    'N': 7.5,
    'P': 8,   // Très humide
    'Q': 8.5
  };
  
  return climateFactors[rainZone] || 4; // Default to average (4)
}

/**
 * Helper function to get terrain factor
 * 
 * @param {string} terrainType - Type of terrain
 * @returns {number} - Terrain factor
 */
function getTerrainFactor(terrainType) {
  const factors = {
    'WATER': 0.5,     // Eau (facteur le plus bas)
    'FLAT': 0.8,      // Terrain plat
    'AVERAGE': 1.0,   // Terrain moyen (valeur de référence)
    'HILLY': 1.5,     // Terrain vallonné
    'MOUNTAINOUS': 2.0, // Montagneux
    'URBAN': 2.5      // Urbain (facteur le plus élevé)
  };
  
  return factors[terrainType] || 1.0; // Default to average terrain
}

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
